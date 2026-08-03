import { Express } from 'express';
import { prisma } from '../config/db';
import { storageService } from './storage';
import { logger } from '../utils/logger';

export class UserService {
  public static async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
        status: true,
        bio: true,
        profile_picture: true,
        created_at: true
      }
    });

    if (!user) throw new Error('Not Found: User not found');
    
    const { profile_picture, ...rest } = user;
    return { ...rest, avatar_url: profile_picture };
  }

  public static async updateProfile(userId: string, data: { full_name?: string, bio?: string }, file?: Express.Multer.File) {
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, profile_picture: true }
    });

    if (!existingUser) {
      throw new Error('Not Found: User not found');
    }

    const updateData: any = {};
    if (data.full_name !== undefined) updateData.full_name = data.full_name;
    if (data.bio !== undefined) updateData.bio = data.bio;

    // 1. Upload new image first to ensure cloud persistence before modifying database records
    if (file) {
      const uploaded = await storageService.uploadAvatar(userId, file);
      updateData.profile_picture = uploaded.url;
    }

    // 2. Update Database via Prisma
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
        status: true,
        bio: true,
        profile_picture: true,
        created_at: true
      }
    });

    // 3. Only after database successfully updates, delete the old avatar asset inside non-blocking try/catch
    if (file && existingUser.profile_picture && existingUser.profile_picture !== user.profile_picture) {
      try {
        await storageService.deleteFile(existingUser.profile_picture);
      } catch (err: any) {
        logger.warn('Non-blocking error encountered deleting prior user avatar', { error: err?.message, userId });
      }
    }

    const { profile_picture, ...rest } = user;
    return { ...rest, avatar_url: profile_picture };
  }
}

