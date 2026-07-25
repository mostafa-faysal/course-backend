import { PrismaClient, AssignmentStatus, SubmissionStatus, AssignmentType, GradingType, EnrollmentStatus } from '@prisma/client';
import { CustomError } from '../middlewares/error.middleware';
import { NotificationHelper } from '../helpers/notification.helper';

const prisma = new PrismaClient();

export class AssignmentService {
  // ----------------------------------------------------
  // INSTRUCTOR METHODS
  // ----------------------------------------------------

  public static async createAssignment(
    instructorId: string,
    courseId: string,
    data: any
  ) {
    // verify course ownership
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });
    if (!course) throw new Error('Course not found');
    if (course.instructor_id !== instructorId) {
      throw new Error('Forbidden: You do not own this course');
    }

    const assignment = await prisma.assignment.create({
      data: {
        ...data,
        course_id: courseId,
        attachments: {
          create: data.attachments || []
        }
      },
      include: { attachments: true }
    });

    // Notify all enrolled students
    const enrollments = await prisma.enrollment.findMany({
      where: { course_id: courseId },
      select: { student_id: true }
    });
    if (enrollments.length > 0) {
      const studentIds = enrollments.map(e => e.student_id);
      await NotificationHelper.sendAssignmentPublished(studentIds, assignment.id, assignment.title, assignment.course_id);
    }

    return assignment;
  }

  public static async updateAssignment(
    instructorId: string,
    assignmentId: string,
    data: any
  ) {
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        course: true,
        _count: { select: { submissions: true } }
      }
    });

    if (!assignment) throw new Error('Assignment not found');
    if (assignment.course.instructor_id !== instructorId) {
      throw new Error('Forbidden: You do not own this course');
    }

    if (assignment._count.submissions > 0) {
      if (data.passing_marks !== undefined || data.total_marks !== undefined || data.due_date !== undefined) {
        throw new Error('Forbidden: Cannot modify passing_marks, total_marks, or due_date after submissions exist');
      }
    }

    const { attachments, ...updateData } = data;

    return prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        ...updateData,
        ...(attachments ? {
          attachments: {
            deleteMany: {},
            create: attachments
          }
        } : {})
      },
      include: { attachments: true }
    });
  }

  public static async deleteAssignment(instructorId: string, assignmentId: string) {
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { course: true, _count: { select: { submissions: true } } }
    });

    if (!assignment) throw new Error('Assignment not found');
    if (assignment.course.instructor_id !== instructorId) throw new Error('Forbidden: You do not own this course');
    if (assignment._count.submissions > 0) throw new Error('Forbidden: Cannot delete assignment with existing submissions');

    await prisma.assignment.delete({ where: { id: assignmentId } });
    return { message: 'Assignment deleted successfully' };
  }

  public static async getInstructorAssignments(instructorId: string, courseId: string) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new Error('Course not found');
    if (course.instructor_id !== instructorId) throw new Error('Forbidden: You do not own this course');

    return prisma.assignment.findMany({
      where: { course_id: courseId },
      include: {
        _count: { select: { submissions: true } }
      },
      orderBy: { created_at: 'desc' }
    });
  }

  public static async getAssignmentSubmissions(instructorId: string, assignmentId: string, page = 1, limit = 20) {
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { course: true }
    });
    if (!assignment) throw new Error('Assignment not found');
    if (assignment.course.instructor_id !== instructorId) throw new Error('Forbidden: You do not own this course');

    const skip = (page - 1) * limit;

    const [submissions, total] = await Promise.all([
      prisma.assignmentSubmission.findMany({
        where: { assignment_id: assignmentId },
        include: { student: { select: { id: true, full_name: true, email: true } } },
        orderBy: { submitted_at: 'desc' },
        skip,
        take: limit
      }),
      prisma.assignmentSubmission.count({ where: { assignment_id: assignmentId } })
    ]);

    return { submissions, total, page, limit };
  }

  public static async getSubmissionAttempts(instructorId: string, submissionId: string) {
    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: { include: { course: true } },
        attempts: {
          include: { attachments: true },
          orderBy: { attempt_number: 'desc' }
        }
      }
    });

    if (!submission) throw new Error('Submission not found');
    if (submission.assignment.course.instructor_id !== instructorId) throw new Error('Forbidden: You do not own this course');

    return submission.attempts;
  }

  public static async gradeSubmission(instructorId: string, submissionId: string, score: number, feedback?: string) {
    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: { assignment: { include: { course: true } } }
    });

    if (!submission) throw new Error('Submission not found');
    if (submission.assignment.course.instructor_id !== instructorId) throw new Error('Forbidden: You do not own this course');
    if (score > submission.assignment.total_marks) throw new Error('Bad Request: Score exceeds total marks');

    const result = await prisma.$transaction(async (tx) => {
      // Create audit log
      await tx.assignmentGradeHistory.create({
        data: {
          submission_id: submissionId,
          graded_by: instructorId,
          old_score: submission.score,
          new_score: score
        }
      });

      // Update submission
      return tx.assignmentSubmission.update({
        where: { id: submissionId },
        data: {
          score,
          feedback,
          status: SubmissionStatus.GRADED,
          graded_at: new Date(),
          graded_by: instructorId
        }
      });
    });

    // Notify Student
    await NotificationHelper.sendAssignmentGraded(submission.student_id, submission.assignment_id, submission.assignment.title, score);

    return result;
  }

  public static async getAssignmentStatistics(instructorId: string, assignmentId: string) {
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { course: true }
    });

    if (!assignment) throw new Error('Assignment not found');
    if (assignment.course.instructor_id !== instructorId) throw new Error('Forbidden: You do not own this course');

    const aggregates = await prisma.assignmentSubmission.aggregate({
      where: { assignment_id: assignmentId, status: SubmissionStatus.GRADED },
      _avg: { score: true },
      _max: { score: true },
      _min: { score: true },
      _count: { _all: true }
    });

    const allSubmissionsCount = await prisma.assignmentSubmission.count({
      where: { assignment_id: assignmentId }
    });

    const lateCount = await prisma.assignmentSubmission.count({
      where: { assignment_id: assignmentId, is_late: true }
    });

    const passedCount = await prisma.assignmentSubmission.count({
      where: { 
        assignment_id: assignmentId, 
        status: SubmissionStatus.GRADED,
        score: { gte: assignment.passing_marks }
      }
    });

    const scores = await prisma.assignmentSubmission.findMany({
      where: { assignment_id: assignmentId, status: SubmissionStatus.GRADED },
      select: { score: true },
      orderBy: { score: 'asc' }
    });

    let medianScore = 0;
    if (scores.length > 0) {
      const mid = Math.floor(scores.length / 2);
      if (scores.length % 2 === 0) {
        medianScore = ((scores[mid - 1].score || 0) + (scores[mid].score || 0)) / 2;
      } else {
        medianScore = scores[mid].score || 0;
      }
    }

    return {
      submissionRate: allSubmissionsCount,
      averageGrade: aggregates._avg.score || 0,
      highestGrade: aggregates._max.score || 0,
      lowestGrade: aggregates._min.score || 0,
      medianScore,
      lateSubmissions: lateCount,
      passedCount,
      failedCount: aggregates._count._all - passedCount,
      gradedCount: aggregates._count._all
    };
  }

  // ----------------------------------------------------
  // STUDENT METHODS
  // ----------------------------------------------------

  public static async getStudentAssignments(studentId: string, courseId: string) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { student_id_course_id: { student_id: studentId, course_id: courseId } }
    });

    if (!enrollment || enrollment.status !== EnrollmentStatus.ACTIVE) {
      throw new Error('Forbidden: Active enrollment required');
    }

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course || course.status !== 'PUBLISHED') {
      throw new Error('Forbidden: Course is not published');
    }

    return prisma.assignment.findMany({
      where: {
        course_id: courseId,
        is_visible: true,
        status: { in: [AssignmentStatus.PUBLISHED, AssignmentStatus.CLOSED] }
      },
      include: {
        submissions: {
          where: { student_id: studentId }
        }
      },
      orderBy: { created_at: 'asc' }
    });
  }

  public static async getStudentSubmission(studentId: string, assignmentId: string) {
    const submission = await prisma.assignmentSubmission.findUnique({
      where: { assignment_id_student_id: { assignment_id: assignmentId, student_id: studentId } },
      include: { attempts: { include: { attachments: true }, orderBy: { attempt_number: 'desc' } } }
    });

    if (!submission) throw new Error('Submission not found');
    return submission;
  }

  public static async submitAssignment(studentId: string, assignmentId: string, data: any) {
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId }
    });

    if (!assignment) throw new Error('Assignment not found');

    if (assignment.status === AssignmentStatus.CLOSED || assignment.status === AssignmentStatus.ARCHIVED) {
      throw new Error('Forbidden: Assignment is closed');
    }

    if (assignment.available_from && new Date() < assignment.available_from) {
      throw new Error('Forbidden: Assignment is not available yet');
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: { student_id_course_id: { student_id: studentId, course_id: assignment.course_id } }
    });

    if (!enrollment || enrollment.status !== EnrollmentStatus.ACTIVE) {
      throw new Error('Forbidden: Active enrollment required');
    }

    const course = await prisma.course.findUnique({ where: { id: assignment.course_id } });
    if (!course || course.status !== 'PUBLISHED') {
      throw new Error('Forbidden: Course is not published');
    }

    const isLate = assignment.due_date ? new Date() > assignment.due_date : false;

    return prisma.$transaction(async (tx) => {
      const existingSub = await tx.assignmentSubmission.findUnique({
        where: { assignment_id_student_id: { assignment_id: assignmentId, student_id: studentId } }
      });

      let nextAttempt = 1;
      let submissionId = '';

      if (existingSub) {
        if (!assignment.allow_resubmission) {
          throw new Error('Forbidden: Resubmission is not allowed');
        }
        if (existingSub.attempt_number >= assignment.max_attempts) {
          throw new Error('Forbidden: Maximum attempts reached');
        }
        nextAttempt = existingSub.attempt_number + 1;

        await tx.assignmentSubmission.update({
          where: { id: existingSub.id },
          data: {
            status: SubmissionStatus.SUBMITTED,
            attempt_number: nextAttempt,
            is_late: isLate,
            submitted_at: new Date()
          }
        });
        submissionId = existingSub.id;
      } else {
        const newSub = await tx.assignmentSubmission.create({
          data: {
            assignment_id: assignmentId,
            student_id: studentId,
            status: SubmissionStatus.SUBMITTED,
            attempt_number: 1,
            is_late: isLate,
            submitted_at: new Date()
          }
        });
        submissionId = newSub.id;
      }

      await tx.assignmentSubmissionAttempt.create({
        data: {
          submission_id: submissionId,
          content: data.content,
          attempt_number: nextAttempt,
          is_late: isLate,
          attachments: {
            create: data.attachments || []
          }
        }
      });

      if (course) {
        await NotificationHelper.sendAssignmentSubmission(course.instructor_id, assignmentId, 'A student').catch(console.error);
      }

      return { message: 'Assignment submitted successfully' };
    });
  }

  public static async getStudentDashboard(studentId: string) {
    const enrollments = await prisma.enrollment.findMany({
      where: { student_id: studentId, status: EnrollmentStatus.ACTIVE },
      select: { course_id: true }
    });

    const enrolledCourseIds = enrollments.map(e => e.course_id);

    const assignments = await prisma.assignment.findMany({
      where: {
        course_id: { in: enrolledCourseIds },
        is_visible: true,
        status: { in: [AssignmentStatus.PUBLISHED, AssignmentStatus.CLOSED] }
      },
      include: {
        submissions: {
          where: { student_id: studentId }
        }
      }
    });

    let pendingCount = 0;
    let submittedCount = 0;
    let gradedCount = 0;
    let lateCount = 0;
    let overdueCount = 0;
    
    let totalScore = 0;
    let gradedItems = 0;

    const upcomingDueDates: any[] = [];
    const recentFeedback: any[] = [];

    const now = new Date();

    for (const assignment of assignments) {
      const sub = assignment.submissions[0];

      if (!sub) {
        if (assignment.due_date && now > assignment.due_date) {
          overdueCount++;
        } else {
          pendingCount++;
          if (assignment.due_date && assignment.due_date > now) {
            upcomingDueDates.push({
              id: assignment.id,
              title: assignment.title,
              due_date: assignment.due_date,
              course_id: assignment.course_id
            });
          }
        }
      } else {
        if (sub.status === SubmissionStatus.SUBMITTED) {
          submittedCount++;
        } else if (sub.status === SubmissionStatus.GRADED) {
          gradedCount++;
          if (sub.score !== null) {
            totalScore += sub.score;
            gradedItems++;
          }
          if (sub.feedback) {
            recentFeedback.push({
              id: assignment.id,
              title: assignment.title,
              feedback: sub.feedback,
              graded_at: sub.graded_at
            });
          }
        }

        if (sub.is_late) {
          lateCount++;
        }
      }
    }

    upcomingDueDates.sort((a, b) => a.due_date.getTime() - b.due_date.getTime());
    recentFeedback.sort((a, b) => new Date(b.graded_at).getTime() - new Date(a.graded_at).getTime());

    return {
      pending: pendingCount,
      submitted: submittedCount,
      late: lateCount,
      overdue: overdueCount,
      graded: gradedCount,
      averageScore: gradedItems > 0 ? (totalScore / gradedItems) : 0,
      upcomingDueDates: upcomingDueDates.slice(0, 5),
      recentFeedback: recentFeedback.slice(0, 5)
    };
  }
}
