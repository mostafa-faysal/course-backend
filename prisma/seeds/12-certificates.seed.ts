import { PrismaClient } from "@prisma/client";
import { SEED_VOLUMES } from "./helpers/constants";
import { randomDateWithinLastDays } from "./helpers/random";

export async function seedCertificates(
  prisma: PrismaClient,
  studentIds: string[],
  courseIds: string[],
  courseIdMap: Record<string, string>
): Promise<void> {
  console.log(`\n📜 [Stage 12] Batched Seeding of ~${SEED_VOLUMES.CERTIFICATES_COUNT} StudyFlow Graduation Certificates...`);

  // We find completed enrollments first, or just match unique combinations up to CERTIFICATES_COUNT
  const completedEnrollments = await prisma.enrollment.findMany({
    where: { progress_percentage: { gte: 90.0 } },
    select: { student_id: true, course_id: true, course: { select: { title: true } } },
    take: SEED_VOLUMES.CERTIFICATES_COUNT,
  });

  const certificatePayload: Array<{
    student_id: string;
    course_id: string;
    credential_id: string;
    title: string;
    issued_at: Date;
    certificate_url: string;
  }> = [];

  const usedPairs = new Set<string>();

  for (let idx = 0; idx < completedEnrollments.length; idx++) {
    const enr = completedEnrollments[idx];
    const pair = `${enr.student_id}_${enr.course_id}`;
    if (!usedPairs.has(pair)) {
      usedPairs.add(pair);
      certificatePayload.push({
        student_id: enr.student_id,
        course_id: enr.course_id,
        credential_id: `SF-CERT-2026-${1000 + idx}-${enr.student_id.substring(0, 4).toUpperCase()}`,
        title: `Certificate of Completion: ${enr.course.title}`,
        issued_at: randomDateWithinLastDays(30, idx),
        certificate_url: "https://res.cloudinary.com/trmszuqg/image/upload/v1785559346/1000149990_g8prch.jpg",
      });
    }
  }

  // If we still need more certificates to reach 250, generate unique pairs from remaining studentIds & courseIds
  let stuIdx = 0;
  let crsIdx = 0;
  const titles = Object.keys(courseIdMap);
  while (certificatePayload.length < SEED_VOLUMES.CERTIFICATES_COUNT && stuIdx < studentIds.length * courseIds.length) {
    const sId = studentIds[stuIdx % studentIds.length];
    const cId = courseIds[crsIdx % courseIds.length];
    const pair = `${sId}_${cId}`;
    if (!usedPairs.has(pair)) {
      usedPairs.add(pair);
      const courseTitle = titles[crsIdx % titles.length] || "StudyFlow Professional Diploma";
      certificatePayload.push({
        student_id: sId,
        course_id: cId,
        credential_id: `SF-CERT-2026-${5000 + certificatePayload.length}`,
        title: `Certificate of Completion: ${courseTitle}`,
        issued_at: randomDateWithinLastDays(20, certificatePayload.length),
        certificate_url: "https://res.cloudinary.com/trmszuqg/image/upload/v1785559346/1000149990_g8prch.jpg",
      });
    }
    stuIdx++;
    if (stuIdx % studentIds.length === 0) crsIdx++;
  }

  await prisma.certificate.createMany({
    data: certificatePayload,
    skipDuplicates: true,
  });

  const count = await prisma.certificate.count();
  console.log(`✅ Verified ${count} Issued Graduation Certificates with unique credentials.`);
}
