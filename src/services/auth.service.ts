import { PrismaClient, Role, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NotificationHelper } from '../helpers/notification.helper';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

export class AuthService {
  public static async register(data: any) {
    // Check if email is already taken
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      throw new Error('Bad Request: Email is already registered');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    // Create user with default role STUDENT
    const user = await prisma.user.create({
      data: {
        full_name: data.full_name,
        email: data.email,
        password_hash: passwordHash,
        role: Role.STUDENT,
        status: UserStatus.ACTIVE
      }
    });

    // Generate JWT
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    } as jwt.SignOptions);

    // Exclude password_hash
    const { password_hash, ...userWithoutPassword } = user;

    await NotificationHelper.sendAccountCreated(user.id);

    return { user: userWithoutPassword, token };
  }

  public static async login(data: any) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (!user) {
      throw new Error('Unauthorized: Invalid credentials');
    }

    // Check status
    if (user.status !== UserStatus.ACTIVE) {
      throw new Error(`Forbidden: Account is ${user.status.toLowerCase()}`);
    }

    // Compare password
    const isMatch = await bcrypt.compare(data.password, user.password_hash);
    if (!isMatch) {
      throw new Error('Unauthorized: Invalid credentials');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { last_login: new Date() }
    });

    // Generate JWT
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    } as jwt.SignOptions);

    // Exclude password_hash
    const { password_hash, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, token };
  }

  public static async changePassword(userId: string, data: { current_password: string; new_password: string }) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const isMatch = await bcrypt.compare(data.current_password, user.password_hash);
    if (!isMatch) {
      throw new Error('Forbidden: Incorrect current password');
    }

    const isReuse = await bcrypt.compare(data.new_password, user.password_hash);
    if (isReuse) {
      throw new Error('Forbidden: New password cannot be the same as the current password');
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(data.new_password, salt);

    await prisma.user.update({
      where: { id: userId },
      data: {
        password_hash,
        password_updated_at: new Date()
      }
    });

    await NotificationHelper.sendPasswordReset(userId);

    return { message: 'Password updated successfully' };
  }
}
