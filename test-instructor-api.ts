import { PrismaClient } from '@prisma/client';
import { generateToken } from './src/utils/jwt';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('\n--- Setting up test data for Instructor API ---\n');

  // 1. Create Users
  const instructor1 = await prisma.user.create({
    data: {
      full_name: 'Instructor One',
      email: `inst1_${Date.now()}@test.com`,
      password_hash: 'hash',
      role: 'INSTRUCTOR',
    },
  });

  const instructor2 = await prisma.user.create({
    data: {
      full_name: 'Instructor Two',
      email: `inst2_${Date.now()}@test.com`,
      password_hash: 'hash',
      role: 'INSTRUCTOR',
    },
  });

  const student1 = await prisma.user.create({
    data: {
      full_name: 'Student One',
      email: `stud1_${Date.now()}@test.com`,
      password_hash: 'hash',
      role: 'STUDENT',
    },
  });

  const admin1 = await prisma.user.create({
    data: {
      full_name: 'Admin One',
      email: `admin1_${Date.now()}@test.com`,
      password_hash: 'hash',
      role: 'ADMIN',
    },
  });

  // 2. Create Categories
  const category = await prisma.category.create({
    data: { name: 'Programming' },
  });

  // 3. Create Courses
  const course1 = await prisma.course.create({
    data: {
      title: 'React for Beginners',
      description: 'Learn React from scratch.',
      instructor_id: instructor1.id,
      category_id: category.id,
      price: 100,
      status: 'PUBLISHED',
    },
  });

  const course2 = await prisma.course.create({
    data: {
      title: 'Advanced React',
      description: 'Master React concepts.',
      instructor_id: instructor1.id,
      category_id: category.id,
      price: 200,
      status: 'PUBLISHED',
    },
  });

  const course3 = await prisma.course.create({
    data: {
      title: 'Instructor 2 Course',
      description: 'Another course.',
      instructor_id: instructor2.id,
      category_id: category.id,
      price: 50,
      status: 'PUBLISHED',
    },
  });

  // 4. Enroll Student in Course 1 and Course 2
  await prisma.enrollment.create({
    data: {
      student_id: student1.id,
      course_id: course1.id,
      progress_percentage: 100,
    },
  });

  await prisma.enrollment.create({
    data: {
      student_id: student1.id,
      course_id: course2.id,
      progress_percentage: 50,
    },
  });

  // 5. Create Order and Payment for Revenue
  const order = await prisma.order.create({
    data: {
      student_id: student1.id,
      subtotal: 300,
      total_price: 300,
      status: 'COMPLETED',
    },
  });

  await prisma.orderItem.create({
    data: {
      order_id: order.id,
      course_id: course1.id,
      price: 100,
    },
  });

  await prisma.orderItem.create({
    data: {
      order_id: order.id,
      course_id: course2.id,
      price: 200,
    },
  });

  await prisma.payment.create({
    data: {
      order_id: order.id,
      payment_method: 'credit_card',
      status: 'SUCCESS',
    },
  });

  // 6. Create Review
  await prisma.review.create({
    data: {
      course_id: course1.id,
      student_id: student1.id,
      rating: 5,
      comment: 'Excellent course!',
    },
  });

  // Tokens
  const tokenInst1 = generateToken(instructor1.id, instructor1.role);
  const tokenInst2 = generateToken(instructor2.id, instructor2.role);
  const tokenStudent = generateToken(student1.id, student1.role);
  const tokenAdmin = generateToken(admin1.id, admin1.role);

  console.log('Test setup complete.\n');

  // Helper for requests
  async function fetchAPI(endpoint: string, token: string, method: string = 'GET') {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers: { Authorization: `Bearer ${token}` },
    });
    return { status: res.status, data: await res.json() };
  }

  // --- TESTS ---

  console.log('1. Unauthorized access (No Token)');
  let res = await fetch(`${API_URL}/instructor/dashboard`);
  console.log('Expected: 401, Got:', res.status);

  console.log('\n2. Unauthorized access (Student Role)');
  res = await fetchAPI('/instructor/dashboard', tokenStudent);
  console.log('Expected: 403, Got:', res.status);

  console.log('\n3. Unauthorized access (Admin Role)');
  res = await fetchAPI('/instructor/dashboard', tokenAdmin);
  console.log('Expected: 403, Got:', res.status);

  console.log('\n4. Get Instructor Profile');
  res = await fetchAPI('/instructor/profile', tokenInst1);
  console.log('Expected: 200, Got:', res.status);
  console.log('Data:', res.data.data?.email === instructor1.email ? 'Match' : 'Mismatch');

  console.log('\n5. Dashboard Overview (Inst 1)');
  res = await fetchAPI('/instructor/dashboard', tokenInst1);
  console.log('Expected: 200, Got:', res.status);
  console.log('Dashboard Data:', res.data.data);

  console.log('\n6. Empty Dashboard Overview (Inst 2)');
  res = await fetchAPI('/instructor/dashboard', tokenInst2);
  console.log('Expected: 200, Got:', res.status);
  console.log('Dashboard Data:', res.data.data);

  console.log('\n7. Instructor Courses (Pagination & Sort)');
  res = await fetchAPI('/instructor/courses?page=1&limit=1&sort=price&order=desc', tokenInst1);
  console.log('Expected: 200, Got:', res.status);
  console.log('Items Count:', res.data.data?.data?.length);
  console.log('First Item Price:', res.data.data?.data?.[0]?.price);

  console.log('\n8. Instructor Courses (Search)');
  res = await fetchAPI('/instructor/courses?search=Beginners', tokenInst1);
  console.log('Expected: 200, Got:', res.status);
  console.log('Found Titles:', res.data.data?.data?.map((c: any) => c.title));

  console.log('\n9. Course Stats (Own Course)');
  res = await fetchAPI(`/instructor/courses/${course1.id}/stats`, tokenInst1);
  console.log('Expected: 200, Got:', res.status);
  console.log('Stats:', res.data.data);

  console.log('\n10. Course Stats (Other Instructor Course)');
  res = await fetchAPI(`/instructor/courses/${course3.id}/stats`, tokenInst1);
  console.log('Expected: 403, Got:', res.status);

  console.log('\n10b. Course Stats (Invalid UUID)');
  res = await fetchAPI(`/instructor/courses/123-abc/stats`, tokenInst1);
  console.log('Expected: 400, Got:', res.status);

  console.log('\n10c. Course Stats (Non-existing Course)');
  res = await fetchAPI(`/instructor/courses/00000000-0000-0000-0000-000000000000/stats`, tokenInst1);
  console.log('Expected: 404, Got:', res.status);

  console.log('\n11. Revenue Stats (All)');
  res = await fetchAPI('/instructor/revenue?period=all', tokenInst1);
  console.log('Expected: 200, Got:', res.status);
  console.log('Revenue Data:', res.data.data);

  console.log('\n12. Student Analytics (Rich Data)');
  res = await fetchAPI('/instructor/students', tokenInst1);
  console.log('Expected: 200, Got:', res.status);
  console.log('Students Data:', res.data.data?.data);

  console.log('\n13. Latest Enrollments');
  res = await fetchAPI('/instructor/enrollments/latest', tokenInst1);
  console.log('Expected: 200, Got:', res.status);
  console.log('Latest Data Count:', res.data.data?.data?.length);

  console.log('\n14. Reviews Overview');
  res = await fetchAPI('/instructor/reviews', tokenInst1);
  console.log('Expected: 200, Got:', res.status);
  console.log('Review comment:', res.data.data?.data?.[0]?.comment);

  console.log('\n--- Cleanup ---');
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.lessonProgress.deleteMany();
  await prisma.courseProgress.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.review.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.section.deleteMany();
  await prisma.course.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany({
    where: { email: { contains: '@test.com' } }
  });

  console.log('Done.');
}

runTests().catch(console.error).finally(() => prisma.$disconnect());
