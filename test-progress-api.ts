import { PrismaClient } from '@prisma/client';
import { sign } from 'jsonwebtoken';
import { randomUUID as uuidv4 } from 'crypto';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
  console.log('--- Setting up test data for Progress API ---');



  // 1. Create Instructor & Student
  const instructor = await prisma.user.create({
    data: {
      id: uuidv4(),
      full_name: 'Prog Instructor',
      email: `instructor_prog_${uuidv4()}@test.com`,
      password_hash: 'hash',
      role: 'INSTRUCTOR',
    },
  });

  const student = await prisma.user.create({
    data: {
      id: uuidv4(),
      full_name: 'Prog Student',
      email: `student_prog_${uuidv4()}@test.com`,
      password_hash: 'hash',
      role: 'STUDENT',
    },
  });

  const studentToken = sign({ id: student.id, role: student.role }, JWT_SECRET);
  
  const fetchClient = async (path: string, options: RequestInit = {}) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
        ...options.headers,
      },
    });
    const data = await res.json().catch(() => null);
    return { status: res.status, data };
  };

  // 2. Create Category & Course
  const category = await prisma.category.create({
    data: { id: uuidv4(), name: 'Prog Category' },
  });

  const course = await prisma.course.create({
    data: {
      id: uuidv4(),
      title: 'Prog Course',
      description: 'Test course for progress',
      price: 0,
      instructor_id: instructor.id,
      category_id: category.id,
      status: 'PUBLISHED',
    },
  });

  // 3. Create Sections & Lessons (Total 3 lessons)
  const section = await prisma.section.create({
    data: {
      id: uuidv4(),
      title: 'Prog Section',
      sequence_order: 1,
      course_id: course.id,
    },
  });

  const lesson1 = await prisma.lesson.create({
    data: { id: uuidv4(), title: 'Lesson 1', duration: 100, sequence_order: 1, section_id: section.id },
  });
  const lesson2 = await prisma.lesson.create({
    data: { id: uuidv4(), title: 'Lesson 2', duration: 120, sequence_order: 2, section_id: section.id },
  });
  const lesson3 = await prisma.lesson.create({
    data: { id: uuidv4(), title: 'Lesson 3', duration: 150, sequence_order: 3, section_id: section.id },
  });

  // 4. Enroll Student
  await fetchClient(`/courses/${course.id}/enroll`, { method: 'POST' });

  console.log('--- Running Security/Authentication Tests ---');
  
  const unauthClient = async (path: string, options: RequestInit = {}) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    const data = await res.json().catch(() => null);
    return { status: res.status, data };
  };

  const securityTests = await Promise.all([
    unauthClient(`/courses/${course.id}/progress`),
    unauthClient(`/courses/${course.id}/progress/lessons/${lesson1.id}/complete`, { method: 'POST' }),
    unauthClient(`/courses/${course.id}/progress/lessons/${lesson1.id}/complete`, { method: 'DELETE' }),
    unauthClient(`/courses/${course.id}/progress/lessons/${lesson1.id}/watch`, { method: 'PUT', body: JSON.stringify({ watch_position: 10 }) })
  ]);

  let allSecurityPassed = true;
  securityTests.forEach((res, index) => {
    if (res.status !== 401) {
      allSecurityPassed = false;
      console.error(`Security Test ${index + 1} FAIL | Expected 401, got ${res.status}:`, res.data);
    } else if (res.data?.status !== 'error' || !res.data?.message?.includes('Unauthorized')) {
      allSecurityPassed = false;
      console.error(`Security Test ${index + 1} FAIL | Body format invalid:`, res.data);
    }
  });

  if (allSecurityPassed) {
    console.log(`Security Tests: PASS | All 4 Progress endpoints returned 401 Unauthorized with correct error body format.`);
  }

  console.log('--- Running Progress Tests ---');

  // Test 1: Get Initial Progress
  let res = await fetchClient(`/courses/${course.id}/progress`);
  if (res.status === 200 && res.data.data.progress_percentage === 0 && res.data.data.total_lessons === 3) {
    console.log(`Test Initial Progress: Status ${res.status} -> PASS`);
  } else {
    console.error(`Test Initial Progress: FAIL | Expected 0% / 3 lessons, got:`, res.data);
  }

  // Test 2: Update Watch Position
  res = await fetchClient(`/courses/${course.id}/progress/lessons/${lesson1.id}/watch`, {
    method: 'PUT',
    body: JSON.stringify({ watch_position: 50 })
  });
  if (res.status === 200) {
    console.log(`Test Update Watch Position: Status ${res.status} -> PASS`);
  } else {
    console.error(`Test Update Watch Position: FAIL | Response:`, res.data);
  }

  // Verify watch position in DB and last watched
  let progressRes = await fetchClient(`/courses/${course.id}/progress`);
  if (progressRes.data.data.last_watched_lesson_id === lesson1.id) {
    console.log(`Test Verify Last Watched Lesson: PASS`);
  } else {
    console.error(`Test Verify Last Watched Lesson: FAIL | got:`, progressRes.data.data.last_watched_lesson_id);
  }

  // Test 3: Mark Lesson 1 Complete
  res = await fetchClient(`/courses/${course.id}/progress/lessons/${lesson1.id}/complete`, { method: 'POST' });
  // Expecting 33.33%
  if (res.status === 200 && res.data.data.progress_percentage === 33.33) {
    console.log(`Test Mark Complete (1/3): Status ${res.status} -> PASS | Percentage: 33.33%`);
  } else {
    console.error(`Test Mark Complete (1/3): FAIL | Response:`, res.data);
  }

  // Test 4: Idempotency (Marking complete again)
  res = await fetchClient(`/courses/${course.id}/progress/lessons/${lesson1.id}/complete`, { method: 'POST' });
  if (res.status === 200 && res.data.data.progress_percentage === 33.33) {
    console.log(`Test Mark Complete Idempotency: Status ${res.status} -> PASS | Percentage remains 33.33%`);
  } else {
    console.error(`Test Mark Complete Idempotency: FAIL | Response:`, res.data);
  }

  // Test 5: Concurrent Requests (Promise.all)
  console.log(`Testing Concurrent Requests (Marking Lesson 2 and 3 complete simultaneously)...`);
  const [res2, res3] = await Promise.all([
    fetchClient(`/courses/${course.id}/progress/lessons/${lesson2.id}/complete`, { method: 'POST' }),
    fetchClient(`/courses/${course.id}/progress/lessons/${lesson3.id}/complete`, { method: 'POST' })
  ]);

  progressRes = await fetchClient(`/courses/${course.id}/progress`);
  
  if (progressRes.data.data.progress_percentage === 100 && progressRes.data.data.completed_at !== null) {
    console.log(`Test Concurrent Completion (100%): PASS | Percentage: 100% | Completed At: ${progressRes.data.data.completed_at}`);
  } else {
    console.error(`Test Concurrent Completion (100%): FAIL | Percentage: ${progressRes.data.data.progress_percentage}`);
  }

  // Test 6: Reversal Logic (Mark Lesson 3 Incomplete)
  res = await fetchClient(`/courses/${course.id}/progress/lessons/${lesson3.id}/complete`, { method: 'DELETE' });
  if (res.status === 200 && res.data.data.progress_percentage === 66.67) {
    console.log(`Test Uncomplete Lesson (Reversal): Status ${res.status} -> PASS | Percentage reverted to 66.67%`);
  } else {
    console.error(`Test Uncomplete Lesson (Reversal): FAIL | Response:`, res.data);
  }

  progressRes = await fetchClient(`/courses/${course.id}/progress`);
  if (progressRes.data.data.completed_at === null) {
    console.log(`Test Reversal completed_at is null: PASS`);
  } else {
    console.error(`Test Reversal completed_at: FAIL | Expected null, got: ${progressRes.data.data.completed_at}`);
  }

  // Verify watch position is preserved on the lesson we just "uncompleted"
  const lpDb = await prisma.lessonProgress.findFirst({
    where: { lesson_id: lesson3.id }
  });
  if (lpDb && lpDb.is_completed === false) {
    console.log(`Test Reversal Data Integrity (LessonProgress not deleted): PASS`);
  } else {
    console.error(`Test Reversal Data Integrity: FAIL`);
  }

  // Test 7: 95% Auto-completion
  // Lesson3 duration is 150. 95% of 150 is 142.5.
  res = await fetchClient(`/courses/${course.id}/progress/lessons/${lesson3.id}/watch`, {
    method: 'PUT',
    body: JSON.stringify({ watch_position: 145 })
  });
  
  progressRes = await fetchClient(`/courses/${course.id}/progress`);
  if (progressRes.data.data.progress_percentage === 100 && progressRes.data.data.completed_at !== null) {
    console.log(`Test Auto-completion (>= 95%): PASS | Percentage: 100%`);
  } else {
    console.error(`Test Auto-completion (>= 95%): FAIL | Expected 100%, got: ${progressRes.data.data.progress_percentage}`);
  }

  console.log('--- Cleaning up test data ---');
  await prisma.lessonProgress.deleteMany({});
  await prisma.courseProgress.deleteMany({});
  await prisma.enrollment.deleteMany({});
  await prisma.lesson.deleteMany({});
  await prisma.section.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.cartItem.deleteMany({});
  await prisma.wishlistItem.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.certificate.deleteMany({});
  await prisma.course.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.user.deleteMany({});
  
  console.log('--- All Done ---');
  await prisma.$disconnect();
  process.exit(0);
}

runTests().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
