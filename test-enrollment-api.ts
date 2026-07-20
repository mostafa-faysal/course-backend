// Native fetch is used
import { PrismaClient } from '@prisma/client';
import { generateToken } from './src/utils/jwt';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('--- Setting up test data for Enrollment ---');
  
  // 0. Cleanup from previous run
  await prisma.courseProgress.deleteMany({ where: { enrollment: { student: { email: { contains: '_enroll@test.com' } } } } });
  await prisma.enrollment.deleteMany({ where: { student: { email: { contains: '_enroll@test.com' } } } });
  await prisma.course.deleteMany({ where: { instructor: { email: { contains: '_enroll@test.com' } } } });
  await prisma.user.deleteMany({ where: { email: { contains: '_enroll@test.com' } } });

  // 1. Create Users
  const admin = await prisma.user.create({
    data: { full_name: 'Admin', email: 'admin_enroll@test.com', password_hash: 'hash', role: 'ADMIN' },
  });
  
  const inst1 = await prisma.user.create({
    data: { full_name: 'Inst1', email: 'inst1_enroll@test.com', password_hash: 'hash', role: 'INSTRUCTOR' },
  });

  const inst2 = await prisma.user.create({
    data: { full_name: 'Inst2', email: 'inst2_enroll@test.com', password_hash: 'hash', role: 'INSTRUCTOR' },
  });
  
  const student1 = await prisma.user.create({
    data: { full_name: 'Student1', email: 'student1_enroll@test.com', password_hash: 'hash', role: 'STUDENT' },
  });

  // 2. Create Category
  const cat = await prisma.category.create({
    data: { name: 'Enrollment Category' },
  });

  // 3. Create Courses
  const freeCourse = await prisma.course.create({
    data: {
      instructor_id: inst1.id,
      category_id: cat.id,
      title: 'Free Published Course',
      description: 'Desc',
      price: 0,
      status: 'PUBLISHED',
    },
  });

  const paidCourse = await prisma.course.create({
    data: {
      instructor_id: inst1.id,
      category_id: cat.id,
      title: 'Paid Published Course',
      description: 'Desc',
      price: 100,
      status: 'PUBLISHED',
    },
  });

  const draftCourse = await prisma.course.create({
    data: {
      instructor_id: inst1.id,
      category_id: cat.id,
      title: 'Draft Course',
      description: 'Desc',
      price: 0,
      status: 'DRAFT',
    },
  });

  // 4. Generate Tokens
  const adminToken = generateToken({ id: admin.id, role: admin.role });
  const inst1Token = generateToken({ id: inst1.id, role: inst1.role });
  const inst2Token = generateToken({ id: inst2.id, role: inst2.role });
  const student1Token = generateToken({ id: student1.id, role: student1.role });

  let res, text;

  console.log('--- Running Enrollment Tests ---');

  // Test 1: Invalid UUID
  res = await fetch(`${BASE_URL}/courses/123/enroll`, {
    method: 'POST', headers: { 'Authorization': `Bearer ${student1Token}` }
  });
  text = await res.text();
  console.log(`Test Invalid UUID: Status ${res.status} -> ${res.status === 400 ? 'PASS' : 'FAIL'} | Response: ${text}`);

  // Test 2: Enroll in DRAFT course (Should fail with 404 Course not found)
  res = await fetch(`${BASE_URL}/courses/${draftCourse.id}/enroll`, {
    method: 'POST', headers: { 'Authorization': `Bearer ${student1Token}` }
  });
  text = await res.text();
  console.log(`Test Enroll DRAFT course: Status ${res.status} -> ${res.status === 404 ? 'PASS' : 'FAIL'} | Response: ${text}`);

  // Test 3: Enroll in PAID course (Should fail with 403 Paid courses require purchase)
  res = await fetch(`${BASE_URL}/courses/${paidCourse.id}/enroll`, {
    method: 'POST', headers: { 'Authorization': `Bearer ${student1Token}` }
  });
  text = await res.text();
  console.log(`Test Enroll PAID course: Status ${res.status} -> ${res.status === 403 ? 'PASS' : 'FAIL'} | Response: ${text}`);

  // Test 4: Enroll in FREE course successfully
  res = await fetch(`${BASE_URL}/courses/${freeCourse.id}/enroll`, {
    method: 'POST', headers: { 'Authorization': `Bearer ${student1Token}` }
  });
  text = await res.text();
  console.log(`Test Enroll FREE course: Status ${res.status} -> ${res.status === 201 ? 'PASS' : 'FAIL'} | Response: ${text}`);

  // Test 5: Enroll again (Duplicate)
  res = await fetch(`${BASE_URL}/courses/${freeCourse.id}/enroll`, {
    method: 'POST', headers: { 'Authorization': `Bearer ${student1Token}` }
  });
  text = await res.text();
  console.log(`Test Enroll Duplicate: Status ${res.status} -> ${res.status === 400 ? 'PASS' : 'FAIL'} | Response: ${text}`);

  console.log('\n--- Running My Courses Tests ---');
  // Test 6: Get My Courses
  res = await fetch(`${BASE_URL}/enrollments/my-courses`, {
    method: 'GET', headers: { 'Authorization': `Bearer ${student1Token}` }
  });
  const myCourses = await res.json();
  console.log(`Test Get My Courses: Status ${res.status} -> ${myCourses.data?.length === 1 ? 'PASS' : 'FAIL'}`);
  console.log(`  Found ${myCourses.data?.length} courses.`);

  console.log('\n--- Running Stats Tests ---');
  // Test 7: Instructor 2 tries to get stats for Instructor 1's course
  res = await fetch(`${BASE_URL}/courses/${freeCourse.id}/enrollments/stats`, {
    method: 'GET', headers: { 'Authorization': `Bearer ${inst2Token}` }
  });
  text = await res.text();
  console.log(`Test Stats Wrong Instructor: Status ${res.status} -> ${res.status === 403 ? 'PASS' : 'FAIL'} | Response: ${text}`);

  // Test 8: Owner Instructor gets stats
  res = await fetch(`${BASE_URL}/courses/${freeCourse.id}/enrollments/stats`, {
    method: 'GET', headers: { 'Authorization': `Bearer ${inst1Token}` }
  });
  const ownerStats = await res.json();
  console.log(`Test Stats Owner: Status ${res.status} -> ${res.status === 200 ? 'PASS' : 'FAIL'} | Total Enrollments: ${ownerStats.data?.total_enrollments}`);

  // Test 9: Admin gets stats
  res = await fetch(`${BASE_URL}/courses/${freeCourse.id}/enrollments/stats`, {
    method: 'GET', headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const adminStats = await res.json();
  console.log(`Test Stats Admin: Status ${res.status} -> ${res.status === 200 ? 'PASS' : 'FAIL'} | Total Enrollments: ${adminStats.data?.total_enrollments}`);


  console.log('\n--- Cleaning up test data ---');
  await prisma.courseProgress.deleteMany({
    where: { enrollment: { student_id: student1.id } }
  });
  await prisma.enrollment.deleteMany({
    where: { student_id: student1.id }
  });
  await prisma.course.deleteMany({
    where: { instructor_id: inst1.id }
  });
  await prisma.category.deleteMany({
    where: { id: cat.id }
  });
  await prisma.user.deleteMany({
    where: { email: { in: ['admin_enroll@test.com', 'inst1_enroll@test.com', 'inst2_enroll@test.com', 'student1_enroll@test.com'] } }
  });

  console.log('--- All Done ---');
  process.exit(0);
}

runTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
