import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

    if (!user) throw new Error('User not found');
    
    const { profile_picture, ...rest } = user;
    return { ...rest, avatar_url: profile_picture };
  }

  public static async updateProfile(userId: string, data: { full_name?: string, bio?: string, avatar_url?: string }) {
    const updateData: any = {};
    if (data.full_name !== undefined) updateData.full_name = data.full_name;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.avatar_url !== undefined) updateData.profile_picture = data.avatar_url;

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
        updated_at: true
      }
    });

    const { profile_picture, ...rest } = user;
    return { ...rest, avatar_url: profile_picture };
  }
}
