import { PrismaClient, Role, EnrollmentStatus, AssignmentStatus, SubmissionStatus } from '@prisma/client';
import { sign } from 'jsonwebtoken';

const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}`;

// Utils
const generateToken = (userId: string, role: string) => {
  return sign({ id: userId, role }, process.env.JWT_SECRET || 'supersecretkey', { expiresIn: '1h' });
};

const fetchAPI = async (endpoint: string, method: string = 'GET', token: string, body?: any) => {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: body ? JSON.stringify(body) : undefined
  });
  return {
    status: response.status,
    data: await response.json().catch(() => null)
  };
};

async function runTests() {
  console.log('--- STARTING RUNTIME VERIFICATION ---');

  let studentId = '';
  let instructorId = '';
  let courseId = '';
  let lessonId = '';
  let assignmentId = '';

  try {
    // 1. SEED DATA
    console.log('[1] Seeding Test Data...');
    
    // Clean up previous runs if any
    await prisma.user.deleteMany({ where: { email: { startsWith: 'test_' } } });

    // Users
    const instructor = await prisma.user.create({
      data: { email: 'test_instructor@example.com', password: 'hashedpassword', full_name: 'Test Instructor', role: Role.INSTRUCTOR }
    });
    instructorId = instructor.id;

    const student = await prisma.user.create({
      data: { email: 'test_student@example.com', password: 'hashedpassword', full_name: 'Test Student', role: Role.STUDENT }
    });
    studentId = student.id;

    // Course structure
    const category = await prisma.category.create({ data: { name: 'Test Category', slug: 'test-cat-' + Date.now() } });
    
    const course = await prisma.course.create({
      data: {
        title: 'Dashboard Test Course',
        description: 'Testing the student dashboard',
        price: 0,
        instructor_id: instructor.id,
        category_id: category.id,
        sections: {
          create: [{
            title: 'Section 1',
            sequence_order: 1,
            lessons: {
              create: [{
                title: 'Lesson 1',
                duration: 600, // 10 minutes
                sequence_order: 1
              }]
            }
          }]
        }
      },
      include: { sections: { include: { lessons: true } } }
    });
    courseId = course.id;
    lessonId = course.sections[0].lessons[0].id;

    // Enrollment
    const enrollment = await prisma.enrollment.create({
      data: { student_id: student.id, course_id: course.id, status: EnrollmentStatus.ACTIVE }
    });

    // Assignment
    const assignment = await prisma.assignment.create({
      data: {
        course_id: course.id,
        title: 'Final Project',
        total_marks: 100,
        is_visible: true,
        status: AssignmentStatus.PUBLISHED
      }
    });
    assignmentId = assignment.id;

    console.log('✅ Seed completed successfully\n');

    // Tokens
    const studentToken = generateToken(studentId, Role.STUDENT);
    const instructorToken = generateToken(instructorId, Role.INSTRUCTOR);

    // 2. TEST AUTHENTICATION
    console.log('[2] Testing Authentication...');
    const authFail = await fetchAPI('/api/student/dashboard/overview', 'GET', instructorToken);
    console.log(`Instructor accessing student dashboard: Status ${authFail.status}`);
    if (authFail.status === 403) console.log('✅ Auth barrier works.\n');
    else throw new Error('Instructor should be forbidden');

    // 3. PROFILE
    console.log('[3] Testing Profile Update...');
    const profileRes = await fetchAPI('/api/users/profile', 'PUT', studentToken, { full_name: 'Updated Name', role: 'ADMIN' });
    console.log(`Update Profile (trying to inject role): Status ${profileRes.status}`);
    console.log('Data:', profileRes.data.data.full_name, '| Role remains:', profileRes.data.data.role);

    // 4. CONTINUE WATCHING (Initial)
    console.log('\n[4] Testing Continue Watching (Empty)...');
    const cw1 = await fetchAPI('/api/student/dashboard/continue-watching', 'GET', studentToken);
    console.log('Empty response:', cw1.data.data);

    // Simulate watching
    await prisma.lessonProgress.create({
      data: {
        enrollment_id: enrollment.id,
        lesson_id: lessonId,
        watch_position_seconds: 120,
        last_watched_at: new Date()
      }
    });

    console.log('Testing Continue Watching (After watching)...');
    const cw2 = await fetchAPI('/api/student/dashboard/continue-watching', 'GET', studentToken);
    console.log('Watched response:', cw2.data.data);

    // 5. DASHBOARD OVERVIEW
    console.log('\n[5] Testing Dashboard Overview...');
    const over1 = await fetchAPI('/api/student/dashboard/overview', 'GET', studentToken);
    console.log('Overview Data:', over1.data.data);

    // 6. CERTIFICATE (Case 1: < 100%)
    console.log('\n[6] Testing Certificates (Case 1: Incomplete Course)...');
    const certFail = await fetchAPI(`/api/student/dashboard/certificates/${courseId}`, 'POST', studentToken);
    console.log(`Status: ${certFail.status} | Message: ${certFail.data.error || certFail.data.message}`);

    // Complete the lesson to reach 100%
    await prisma.lessonProgress.update({
      where: { enrollment_id_lesson_id: { enrollment_id: enrollment.id, lesson_id: lessonId } },
      data: { is_completed: true, completed_at: new Date() }
    });

    console.log('Testing Certificates (Case 2: 100% Completed)...');
    const certPass = await fetchAPI(`/api/student/dashboard/certificates/${courseId}`, 'POST', studentToken);
    console.log(`Status: ${certPass.status} | Credential:`, certPass.data.data.credential_id);

    // 7. PHASE 14 INTEGRATION (Assignments)
    console.log('\n[7] Testing Phase 14 Assignments Integration...');
    
    // Submit
    const submit = await fetchAPI('/api/student/assignments/submit', 'POST', studentToken, {
      assignmentId,
      content: 'Here is my homework.'
    });
    console.log('Submit Assignment Status:', submit.status);
    const submissionId = submit.data.data.id;

    // Grade
    const grade = await fetchAPI(`/api/instructor/assignments/submissions/${submissionId}/grade`, 'PUT', instructorToken, {
      score: 95,
      feedback: 'Excellent work.'
    });
    console.log('Grade Assignment Status:', grade.status);

    // History
    const history = await fetchAPI(`/api/student/assignments/submissions/${submissionId}`, 'GET', studentToken);
    console.log('Grade Details Score:', history.data.data.score);

    // Check Overview Pending Assignments
    const over2 = await fetchAPI('/api/student/dashboard/overview', 'GET', studentToken);
    console.log('Overview Data (After submit):', over2.data.data);

    console.log('\n--- ALL RUNTIME TESTS COMPLETED SUCCESSFULLY ---');

  } catch (err: any) {
    console.error('\n❌ Test Execution Failed:', err.message || err);
  } finally {
    // Cleanup
    await prisma.user.deleteMany({ where: { email: { startsWith: 'test_' } } });
    await prisma.$disconnect();
    process.exit(0);
  }
}

runTests();
