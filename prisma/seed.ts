import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

import { seedCategories } from "./seeds/01-categories.seed";
import { seedInstructors } from "./seeds/02-instructors.seed";
import { seedStudents } from "./seeds/03-students.seed";
import { seedCourses } from "./seeds/04-courses.seed";
import { seedSections } from "./seeds/05-sections.seed";
import { seedLessons } from "./seeds/06-lessons.seed";
import { seedEnrollments } from "./seeds/07-enrollments.seed";
import { seedProgress } from "./seeds/08-progress.seed";
import { seedReviews } from "./seeds/09-reviews.seed";
import { seedOrders } from "./seeds/10-orders.seed";
import { seedPayments } from "./seeds/11-payments.seed";
import { seedCertificates } from "./seeds/12-certificates.seed";
import { seedCarts } from "./seeds/13-carts.seed";
import { seedWishlists } from "./seeds/14-wishlists.seed";
import { seedNotifications } from "./seeds/15-notifications.seed";
import { seedLearningPlans } from "./seeds/16-learning-plans.seed";
import { seedAssignments } from "./seeds/17-assignments.seed";
import { printSeedReport } from "./seeds/report";

dotenv.config({ override: true });

const prisma = new PrismaClient({
  datasourceUrl: process.env.DIRECT_URL || process.env.DATABASE_URL,
});

async function main() {
  console.log("🌱 Starting StudyFlow Enterprise Modular Seeding...");

  const categoryMap = await seedCategories(prisma);
  const instructorMap = await seedInstructors(prisma);
  const studentIds = await seedStudents(prisma);

  const { courseIdMap, courseIds } = await seedCourses(prisma, categoryMap, instructorMap);

  const { sectionIds, courseSections } = await seedSections(prisma, courseIds);
  const lessonIds = await seedLessons(prisma, sectionIds, courseSections, courseIdMap);

  const { enrollmentIds } = await seedEnrollments(prisma, studentIds, courseIds, courseIdMap);
  await seedProgress(prisma, enrollmentIds, lessonIds, courseIdMap);
  await seedReviews(prisma, studentIds, courseIds);

  const orderIds = await seedOrders(prisma, studentIds, courseIds, courseIdMap);
  await seedPayments(prisma, orderIds);

  await seedCertificates(prisma, studentIds, courseIds, courseIdMap);
  await seedCarts(prisma, studentIds, courseIds);
  await seedWishlists(prisma, studentIds, courseIds);
  await seedNotifications(prisma, studentIds);
  await seedLearningPlans(prisma, studentIds, courseIds);
  await seedAssignments(prisma, courseIds, studentIds, instructorMap);

  await printSeedReport(prisma);
}

main()
  .catch((e) => {
    console.error("❌ Error during StudyFlow database seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
