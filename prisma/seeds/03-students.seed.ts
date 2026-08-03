import { PrismaClient, Role, UserStatus } from "@prisma/client";
import { getUniqueStudents } from "./helpers/names";
import { getAvatar } from "./helpers/avatars";
import { getDefaultPasswordHash } from "./helpers/password";
import { SEED_VOLUMES, FRONTEND_COHORT_STUDENTS } from "./helpers/constants";

export async function seedStudents(prisma: PrismaClient): Promise<string[]> {
  console.log(`\n🧑‍🎓 [Stage 3] Batched Seeding of ${SEED_VOLUMES.STUDENTS_COUNT} StudyFlow Students...`);
  const passwordHash = await getDefaultPasswordHash();

  // 1. Ensure active Front-End interactive cohort students exist deterministically
  for (let idx = 0; idx < FRONTEND_COHORT_STUDENTS.length; idx++) {
    const student = FRONTEND_COHORT_STUDENTS[idx];
    await prisma.user.upsert({
      where: { email: student.email },
      update: {
        full_name: student.full_name,
        role: Role.STUDENT,
        status: UserStatus.ACTIVE,
      },
      create: {
        email: student.email,
        full_name: student.full_name,
        bio: "Enrolled in active Front-End Development interactive cohort.",
        country: "Egypt",
        profile_picture: getAvatar(idx + 1),
        language: "Arabic / English",
        password_hash: passwordHash,
        role: Role.STUDENT,
        status: UserStatus.ACTIVE,
      },
    });
  }

  const studentProfiles = getUniqueStudents(SEED_VOLUMES.STUDENTS_COUNT);

  const dataToCreate = studentProfiles.map((profile, idx) => ({
    email: profile.email,
    full_name: profile.full_name,
    bio: profile.bio,
    country: profile.country,
    profile_picture: getAvatar(idx + 3),
    language: "Arabic / English",
    password_hash: passwordHash,
    role: Role.STUDENT,
    status: UserStatus.ACTIVE,
  }));

  // Perform high-speed batched insert skipping existing unique email duplicates
  await prisma.user.createMany({
    data: dataToCreate,
    skipDuplicates: true,
  });

  const students = await prisma.user.findMany({
    where: { role: Role.STUDENT },
    select: { id: true },
  });

  const studentIds = students.map((s) => s.id);
  console.log(`✅ Verified ${studentIds.length} Active StudyFlow Students.`);
  return studentIds;
}
