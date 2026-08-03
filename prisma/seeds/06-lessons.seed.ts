import { PrismaClient } from "@prisma/client";
import { FRONTEND_COURSE_TITLE } from "./helpers/constants";

export async function seedLessons(
  prisma: PrismaClient,
  sectionIds: string[],
  courseSections: Record<string, string[]> = {},
  courseIdMap: Record<string, string> = {}
): Promise<string[]> {
  console.log("\n📺 [Stage 6] Seeding Lessons and Video Streaming References...");
  const lessonIds: string[] = [];

  const frontendCourseId = courseIdMap[FRONTEND_COURSE_TITLE];
  const frontendSections = (frontendCourseId && courseSections[frontendCourseId]) ? courseSections[frontendCourseId] : [];

  const lessonTemplates = [
    { title: "الدرس 1: شرح المفاهيم النظرية وبنية المعالجة", duration: 25, is_free_preview: true },
    { title: "الدرس 2: التطبيق الحي وكتابة الأكواد مع المينتور", duration: 45, is_free_preview: false },
    { title: "الدرس 3: مراجعة الحل الهندسي وحل المسائل الشائعة", duration: 35, is_free_preview: false },
  ];

  for (const sectionId of sectionIds) {
    // Check if this section belongs to the interactive FrontEnd course
    if (frontendSections.includes(sectionId)) {
      if (sectionId === frontendSections[0]) {
        // First section of FrontEnd course: Only Lecture 1 is currently uploaded after being taught & recorded
        const tmpl = {
          title: "المحاضرة الأولى (مسجلة ومضافة حديثاً): بنية واجهات المحتوى HTML5 & Modern DOM",
          duration: 65,
          is_free_preview: true,
          video_url: "https://www.youtube.com/watch?v=TlB_eWDSMt4",
        };

        let lesson = await prisma.lesson.findFirst({
          where: { section_id: sectionId, sequence_order: 1 },
        });

        if (lesson) {
          lesson = await prisma.lesson.update({
            where: { id: lesson.id },
            data: tmpl,
          });
        } else {
          lesson = await prisma.lesson.create({
            data: {
              section_id: sectionId,
              ...tmpl,
              sequence_order: 1,
            },
          });
        }
        lessonIds.push(lesson.id);

        // Remove any old/legacy lessons in this first section beyond sequence 1
        const legacyLessonIds = await prisma.lesson.findMany({
          where: { section_id: sectionId, sequence_order: { gt: 1 } },
          select: { id: true }
        }).then(res => res.map(r => r.id));

        if (legacyLessonIds.length > 0) {
          await prisma.lessonProgress.deleteMany({ where: { lesson_id: { in: legacyLessonIds } } });
          await prisma.courseProgress.deleteMany({ where: { last_watched_lesson_id: { in: legacyLessonIds } } });
          await prisma.lesson.deleteMany({ where: { id: { in: legacyLessonIds } } });
        }
      } else {
        // Subsequent sections of FrontEnd course begin empty, waiting for future lecture uploads
        const sectionLessonIds = await prisma.lesson.findMany({
          where: { section_id: sectionId },
          select: { id: true }
        }).then(res => res.map(r => r.id));

        if (sectionLessonIds.length > 0) {
          await prisma.lessonProgress.deleteMany({ where: { lesson_id: { in: sectionLessonIds } } });
          await prisma.courseProgress.deleteMany({ where: { last_watched_lesson_id: { in: sectionLessonIds } } });
          await prisma.lesson.deleteMany({ where: { id: { in: sectionLessonIds } } });
        }
      }
      continue;
    }

    for (let idx = 0; idx < lessonTemplates.length; idx++) {
      const tmpl = lessonTemplates[idx];
      const sequence_order = idx + 1;

      let lesson = await prisma.lesson.findFirst({
        where: { section_id: sectionId, sequence_order },
      });

      if (lesson) {
        lesson = await prisma.lesson.update({
          where: { id: lesson.id },
          data: {
            title: tmpl.title,
            duration: tmpl.duration,
            is_free_preview: tmpl.is_free_preview,
            video_url: "https://www.youtube.com/watch?v=TlB_eWDSMt4",
          },
        });
      } else {
        lesson = await prisma.lesson.create({
          data: {
            section_id: sectionId,
            title: tmpl.title,
            duration: tmpl.duration,
            is_free_preview: tmpl.is_free_preview,
            video_url: "https://www.youtube.com/watch?v=TlB_eWDSMt4",
            sequence_order,
          },
        });
      }
      lessonIds.push(lesson.id);
    }
  }

  console.log(`✅ Verified ${lessonIds.length} Educational Lessons across syllabus sections.`);
  return lessonIds;
}

