import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class CourseUtil {
  public static async verifyCourseOwnership(courseId: string, userId: string, role: string) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { instructor_id: true },
    });

    if (!course) {
      throw new Error('Course not found');
    }

    if (role !== 'ADMIN' && course.instructor_id !== userId) {
      throw new Error('Forbidden: You are not the instructor of this course');
    }
  }

  public static async verifySectionExists(sectionId: string, courseId: string) {
    const section = await prisma.section.findUnique({
      where: { id: sectionId },
    });

    if (!section || section.course_id !== courseId) {
      throw new Error('Section not found');
    }

    return section;
  }
}
