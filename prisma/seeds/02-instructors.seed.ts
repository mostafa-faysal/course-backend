import { PrismaClient, Role, UserStatus } from "@prisma/client";
import { INSTRUCTOR_PROFILES } from "./helpers/names";
import { getAvatar } from "./helpers/avatars";
import { getDefaultPasswordHash } from "./helpers/password";

export async function seedInstructors(prisma: PrismaClient): Promise<Record<string, string>> {
  console.log("\n👨‍🏫 [Stage 2] Seeding StudyFlow Industry Instructors...");
  const passwordHash = await getDefaultPasswordHash();
  const instructorMap: Record<string, string> = {};

  for (let i = 0; i < INSTRUCTOR_PROFILES.length; i++) {
    const profile = INSTRUCTOR_PROFILES[i];
    const avatar = getAvatar(i);

    const instructor = await prisma.user.upsert({
      where: { email: profile.email },
      update: {
        full_name: profile.full_name,
        bio: profile.bio,
        country: profile.country,
        profile_picture: avatar,
        language: "Arabic / English",
        role: Role.INSTRUCTOR,
        status: UserStatus.ACTIVE,
      },
      create: {
        email: profile.email,
        full_name: profile.full_name,
        bio: profile.bio,
        country: profile.country,
        profile_picture: avatar,
        language: "Arabic / English",
        password_hash: passwordHash,
        role: Role.INSTRUCTOR,
        status: UserStatus.ACTIVE,
      },
    });

    instructorMap[instructor.email] = instructor.id;
  }

  console.log(`✅ Verified ${Object.keys(instructorMap).length} StudyFlow Senior Instructors.`);
  return instructorMap;
}
