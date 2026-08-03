import { PrismaClient } from "@prisma/client";

export interface SectionSeedResult {
  sectionIds: string[];
  courseSections: Record<string, string[]>;
}

export async function seedSections(prisma: PrismaClient, courseIds: string[]): Promise<SectionSeedResult> {
  console.log("\n📑 [Stage 5] Seeding Course Sections & Curriculums...");
  const sectionIds: string[] = [];
  const courseSections: Record<string, string[]> = {};

  const sectionTitles = [
    "المقدمة والأساسيات التمهيدية وبيئة العمل",
    "التطبيق العملي للبنية البرمجية والمفاهيم الهندسية",
    "معالجة الأخطاء والأداء واختبارات التكامل (Testing & Performance)",
    "المشروع العملي الختامي وأفضل ممارسات بيئات الإنتاج",
  ];

  for (const courseId of courseIds) {
    courseSections[courseId] = [];
    for (let idx = 0; idx < sectionTitles.length; idx++) {
      const title = sectionTitles[idx];
      const sequence_order = idx + 1;

      let section = await prisma.section.findFirst({
        where: { course_id: courseId, sequence_order },
      });

      if (section) {
        section = await prisma.section.update({
          where: { id: section.id },
          data: { title },
        });
      } else {
        section = await prisma.section.create({
          data: {
            course_id: courseId,
            title,
            sequence_order,
          },
        });
      }

      sectionIds.push(section.id);
      courseSections[courseId].push(section.id);
    }
  }

  console.log(`✅ Verified ${sectionIds.length} Syllabus Sections across ${courseIds.length} Courses.`);
  return { sectionIds, courseSections };
}
