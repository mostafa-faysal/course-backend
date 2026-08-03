import { PrismaClient, Role, OrderStatus, ReviewStatus } from "@prisma/client";
import { FRONTEND_COURSE_TITLE, FRONTEND_INSTRUCTOR_EMAIL, FRONTEND_COHORT_STUDENTS, DEFAULT_PASSWORD } from "./helpers/constants";

export async function printSeedReport(prisma: PrismaClient): Promise<void> {
  console.log("\n===================================================================");
  console.log("             🏆 STUDYFLOW SENIOR PRODUCTION SEED REPORT           ");
  console.log("===================================================================\n");

  const [
    instructorsCount,
    studentsCount,
    categoriesCount,
    coursesCount,
    sectionsCount,
    lessonsCount,
    enrollmentsCount,
    reviewsCount,
    ordersCount,
    paymentsCount,
    certificatesCount,
    cartsCount,
    wishlistsCount,
    notificationsCount,
    learningPlansCount,
    assignmentsCount,
    submissionsCount,
  ] = await Promise.all([
    prisma.user.count({ where: { role: Role.INSTRUCTOR } }),
    prisma.user.count({ where: { role: Role.STUDENT } }),
    prisma.category.count(),
    prisma.course.count(),
    prisma.section.count(),
    prisma.lesson.count(),
    prisma.enrollment.count(),
    prisma.review.count(),
    prisma.order.count(),
    prisma.payment.count(),
    prisma.certificate.count(),
    prisma.cart.count(),
    prisma.wishlist.count(),
    prisma.notification.count(),
    prisma.learningPlan.count(),
    prisma.assignment.count(),
    prisma.assignmentSubmission.count(),
  ]);

  // Aggregate total production revenue
  const revenueAggregation = await prisma.order.aggregate({
    where: { status: OrderStatus.COMPLETED },
    _sum: { total_price: true },
  });
  const totalRevenue = revenueAggregation._sum.total_price || 0;

  // Aggregate average platform rating
  const ratingAggregation = await prisma.review.aggregate({
    where: { status: ReviewStatus.APPROVED },
    _avg: { rating: true },
  });
  const averageRating = (ratingAggregation._avg.rating || 0).toFixed(2);

  console.log(`📊 [Core Platform Entities]`);
  console.log(`   • Instructors       : ${instructorsCount}`);
  console.log(`   • Active Students   : ${studentsCount}`);
  console.log(`   • Categories        : ${categoriesCount}`);
  console.log(`   • Diplomas/Courses  : ${coursesCount}`);
  console.log(`   • Syllabus Sections : ${sectionsCount}`);
  console.log(`   • Video Lessons     : ${lessonsCount}`);
  
  console.log(`\n💼 [Academic & Financial Engagement]`);
  console.log(`   • Total Enrollments : ${enrollmentsCount}`);
  console.log(`   • Verified Reviews  : ${reviewsCount} (Avg Rating: ⭐ ${averageRating}/5.0)`);
  console.log(`   • Completed Orders  : ${ordersCount} (Total Revenue: EGP ${totalRevenue.toLocaleString()})`);
  console.log(`   • Payment Records   : ${paymentsCount}`);
  console.log(`   • Issued Diplomas   : ${certificatesCount}`);
  
  console.log(`\n🎯 [Student Interactive Experience]`);
  console.log(`   • Active Carts      : ${cartsCount}`);
  console.log(`   • Wishlists         : ${wishlistsCount}`);
  console.log(`   • Notifications     : ${notificationsCount}`);
  console.log(`   • Study Roadmaps    : ${learningPlansCount}`);
  console.log(`   • Project Capstones : ${assignmentsCount} (Submissions Graded: ${submissionsCount})`);

  console.log(`\n🚀 [Active Front-End Interactive Cohort - Ready for Frontend Test]`);
  console.log(`   • Target Course  : ${FRONTEND_COURSE_TITLE}`);
  console.log(`   • Instructor     : ${FRONTEND_INSTRUCTOR_EMAIL} (Password: ${DEFAULT_PASSWORD})`);
  console.log(`   • Cohort State   : Lecture 1 uploaded & recorded; ready for Instructor to upload Lecture 2.`);
  console.log(`   • Paid Enrolled Students (Password: ${DEFAULT_PASSWORD}):`);
  FRONTEND_COHORT_STUDENTS.forEach((s, idx) => {
    console.log(`      ${idx + 1}. ${s.full_name.padEnd(36)} -> ${s.email}`);
  });

  console.log("\n===================================================================");
  console.log("✅ StudyFlow Seeder completed with strict Idempotence & Zero Mocks!");
  console.log("===================================================================\n");
}
