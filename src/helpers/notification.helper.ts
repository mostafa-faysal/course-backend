import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export class NotificationHelper {
  
  /**
   * Internal helper to create a single notification using Prisma.
   */
  private static async send(data: {
    user_id: string;
    title: string;
    message: string;
    type: string | any;
    priority: string | any;
    action_url?: string;
    target_type?: string;
    target_id?: string;
    metadata?: any;
    expires_at?: Date;
  }) {
    return prisma.notification.create({
      data: {
        user_id: data.user_id,
        title: data.title,
        message: data.message,
        type: data.type,
        priority: data.priority,
        action_url: data.action_url,
        target_type: data.target_type,
        target_id: data.target_id,
        metadata: data.metadata || {},
        expires_at: data.expires_at,
      },
    });
  }

  static async sendPasswordReset(userId: string) {
    return this.send({
      user_id: userId,
      title: 'Password Changed',
      message: 'Your account password has been updated securely. If you did not make this change, contact support immediately.',
      type: 'PASSWORD',
      priority: 'HIGH',
      action_url: '/profile/security',
      target_type: 'ACCOUNT',
      target_id: userId,
    });
  }

  static async sendRoleChanged(userId: string, newRole: string) {
    return this.send({
      user_id: userId,
      title: 'Role Updated',
      message: `Your account role has been updated to ${newRole}. You may need to log in again to see changes.`,
      type: 'ACCOUNT',
      priority: 'HIGH',
      action_url: '/profile',
      target_type: 'ACCOUNT',
      target_id: userId,
    });
  }

  static async sendStatusChanged(userId: string, newStatus: string) {
    return this.send({
      user_id: userId,
      title: 'Account Status Updated',
      message: `Your account status has been changed to ${newStatus}.`,
      type: 'ACCOUNT',
      priority: 'HIGH',
      action_url: '/profile',
      target_type: 'ACCOUNT',
      target_id: userId,
    });
  }

  static async sendAccountCreated(userId: string) {
    return this.send({
      user_id: userId,
      title: 'Welcome to the Platform',
      message: 'Your account has been successfully created. Explore our courses and start learning!',
      type: 'ACCOUNT',
      priority: 'HIGH',
      action_url: '/courses',
      target_type: 'ACCOUNT',
      target_id: userId,
    });
  }

  static async sendEnrollment(studentId: string, instructorId: string, courseId: string, courseName: string) {
    // Notify Student
    await this.send({
      user_id: studentId,
      title: 'Enrollment Successful',
      message: `You have successfully enrolled in ${courseName}. Start learning now!`,
      type: 'ENROLLMENT',
      priority: 'MEDIUM',
      action_url: `/courses/${courseId}/learn`,
      target_type: 'COURSE',
      target_id: courseId,
      metadata: { courseId, courseName },
    });

    // Notify Instructor
    await this.send({
      user_id: instructorId,
      title: 'New Student Enrollment',
      message: `A new student has enrolled in your course: ${courseName}.`,
      type: 'ENROLLMENT',
      priority: 'LOW',
      action_url: `/instructor/courses/${courseId}/students`,
      target_type: 'COURSE',
      target_id: courseId,
      metadata: { studentId, courseId },
    });
  }

  static async sendAssignmentPublished(studentIds: string[], assignmentId: string, title: string, courseId: string) {
    const promises = studentIds.map(studentId => 
      this.send({
        user_id: studentId,
        title: 'New Assignment Published',
        message: `A new assignment "${title}" is available for your course.`,
        type: 'ASSIGNMENT',
        priority: 'MEDIUM',
        action_url: `/courses/${courseId}/assignments/${assignmentId}`,
        target_type: 'ASSIGNMENT',
        target_id: assignmentId,
      })
    );
    await Promise.all(promises);
  }

  static async sendAssignmentGraded(studentId: string, assignmentId: string, title: string, grade: number) {
    return this.send({
      user_id: studentId,
      title: 'Assignment Graded',
      message: `Your assignment "${title}" has been graded. You received: ${grade}.`,
      type: 'ASSIGNMENT',
      priority: 'HIGH',
      action_url: `/assignments/${assignmentId}/result`,
      target_type: 'ASSIGNMENT',
      target_id: assignmentId,
    });
  }

  static async sendCertificateIssued(studentId: string, certificateId: string, courseName: string) {
    return this.send({
      user_id: studentId,
      title: 'Certificate Issued',
      message: `Congratulations! You have been issued a certificate for completing "${courseName}".`,
      type: 'CERTIFICATE',
      priority: 'HIGH',
      action_url: `/certificates/${certificateId}`,
      target_type: 'CERTIFICATE',
      target_id: certificateId,
    });
  }

  static async sendNewCourseReview(instructorId: string, courseId: string, rating: number) {
    return this.send({
      user_id: instructorId,
      title: 'New Course Review',
      message: `Your course received a new ${rating}-star review.`,
      type: 'REVIEW',
      priority: 'LOW',
      action_url: `/instructor/courses/${courseId}/reviews`,
      target_type: 'COURSE',
      target_id: courseId,
    });
  }

  static async sendAssignmentSubmission(instructorId: string, assignmentId: string, studentName: string) {
    return this.send({
      user_id: instructorId,
      title: 'New Assignment Submission',
      message: `${studentName} has submitted an assignment.`,
      type: 'ASSIGNMENT',
      priority: 'MEDIUM',
      action_url: `/instructor/assignments/${assignmentId}/submissions`,
      target_type: 'ASSIGNMENT',
      target_id: assignmentId,
    });
  }

  static async sendCourseApproved(instructorId: string, courseId: string, title: string) {
    return this.send({
      user_id: instructorId,
      title: 'Course Approved',
      message: `Your course "${title}" has been approved and is now live!`,
      type: 'COURSE',
      priority: 'HIGH',
      action_url: `/instructor/courses/${courseId}`,
      target_type: 'COURSE',
      target_id: courseId,
    });
  }

  static async sendCourseRejected(instructorId: string, courseId: string, title: string) {
    return this.send({
      user_id: instructorId,
      title: 'Course Rejected',
      message: `Your course "${title}" was rejected during review. Please check the review notes.`,
      type: 'COURSE',
      priority: 'HIGH',
      action_url: `/instructor/courses/${courseId}`,
      target_type: 'COURSE',
      target_id: courseId,
    });
  }

  static async sendNewCourseSubmitted(adminIds: string[], courseId: string, title: string) {
    const promises = adminIds.map(adminId => 
      this.send({
        user_id: adminId,
        title: 'New Course Submitted for Review',
        message: `The course "${title}" has been submitted for review.`,
        type: 'SYSTEM',
        priority: 'MEDIUM',
        action_url: `/admin/courses/${courseId}/review`,
        target_type: 'COURSE',
        target_id: courseId,
      })
    );
    await Promise.all(promises);
  }

  static async sendNewLessonPublished(studentIds: string[], courseId: string, lessonTitle: string, courseName: string) {
    const promises = studentIds.map(studentId => 
      this.send({
        user_id: studentId,
        title: 'محاضرة جديدة متوفرة',
        message: `تمت إضافة محاضرة جديدة: "${lessonTitle}" في كورس "${courseName}". يمكنك مشاهدتها الآن في غرفة الدراسة!`,
        type: 'COURSE',
        priority: 'HIGH',
        action_url: `/student-dashboard/courses/${courseId}/classroom`,
        target_type: 'COURSE',
        target_id: courseId,
      })
    );
    await Promise.all(promises);
  }

  static async sendEnrollmentRevoked(studentId: string, courseId: string, courseName: string) {
    return this.send({
      user_id: studentId,
      title: 'إلغاء الاشتراك في الكورس',
      message: `تم سحب صلاحية وصولك إلى الكورس: "${courseName}". يرجى التواصل مع الإنستراكتور أو الإدارة لمزيد من التفاصيل.`,
      type: 'ENROLLMENT',
      priority: 'HIGH',
      action_url: `/student-dashboard/courses`,
      target_type: 'COURSE',
      target_id: courseId,
    });
  }
}
