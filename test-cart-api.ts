import { PrismaClient } from '@prisma/client';
import { generateToken } from './src/utils/jwt';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('\n--- Setting up test data for Cart API ---\n');

  // 1. Create a Student, an Instructor, and an Admin
  const admin = await prisma.user.create({
    data: {
      full_name: 'Cart Admin',
      email: `cart_admin_${Date.now()}@test.com`,
      password_hash: 'hash',
      role: 'ADMIN',
    },
  });

  const instructor = await prisma.user.create({
    data: {
      full_name: 'Cart Instructor',
      email: `cart_instructor_${Date.now()}@test.com`,
      password_hash: 'hash',
      role: 'INSTRUCTOR',
    },
  });

  const student = await prisma.user.create({
    data: {
      full_name: 'Cart Student',
      email: `cart_student_${Date.now()}@test.com`,
      password_hash: 'hash',
      role: 'STUDENT',
    },
  });

  const student2 = await prisma.user.create({
    data: {
      full_name: 'Cart Student 2',
      email: `cart_student2_${Date.now()}@test.com`,
      password_hash: 'hash',
      role: 'STUDENT',
    },
  });

  // 2. Create Category and Courses
  const category = await prisma.category.create({
    data: { name: 'Cart Category' },
  });

  const course1 = await prisma.course.create({
    data: {
      title: 'Cart Course 1 (Available)',
      description: 'Desc',
      price: 100,
      discount_price: 80,
      status: 'PUBLISHED',
      instructor_id: instructor.id,
      category_id: category.id,
    },
  });

  const course2 = await prisma.course.create({
    data: {
      title: 'Cart Course 2 (Enrolled)',
      description: 'Desc',
      price: 200,
      status: 'PUBLISHED',
      instructor_id: instructor.id,
      category_id: category.id,
    },
  });

  const course3 = await prisma.course.create({
    data: {
      title: 'Cart Course 3 (Draft)',
      description: 'Desc',
      price: 50,
      status: 'DRAFT',
      instructor_id: instructor.id,
      category_id: category.id,
    },
  });

  // Enroll student in course 2
  await prisma.enrollment.create({
    data: {
      student_id: student.id,
      course_id: course2.id,
    },
  });

  // Generate tokens
  const studentToken = generateToken({ id: student.id, role: student.role });
  const student2Token = generateToken({ id: student2.id, role: student2.role });
  const instructorToken = generateToken({ id: instructor.id, role: instructor.role });
  const adminToken = generateToken({ id: admin.id, role: admin.role });

  console.log('--- Running Security Tests ---');

  // Test 1: No JWT
  let res = await fetch(`${API_URL}/cart`, { method: 'GET' });
  if (res.status !== 401) console.error(`FAIL | No JWT -> Expected 401, got ${res.status}`);
  else console.log(`PASS | No JWT -> Expected 401, got 401`);

  // Test 2: Instructor JWT
  res = await fetch(`${API_URL}/cart`, {
    headers: { Authorization: `Bearer ${instructorToken}` },
  });
  if (res.status !== 403) console.error(`FAIL | Instructor JWT -> Expected 403, got ${res.status}`);
  else console.log(`PASS | Instructor JWT -> Expected 403, got 403`);

  console.log('\n--- Running Cart Features Tests ---');

  // Test 3: Get Empty Cart
  res = await fetch(`${API_URL}/cart`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  let data = await res.json();
  if (data.data.total_courses_count !== 0) console.error('FAIL | Get Empty Cart', data);
  else console.log('PASS | Get Empty Cart');

  // Test 4: Add Course 1 to Cart (Success)
  res = await fetch(`${API_URL}/cart/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`,
    },
    body: JSON.stringify({ courseId: course1.id }),
  });
  data = await res.json();
  if (res.status !== 200) console.error('FAIL | Add Course to Cart', data);
  else console.log('PASS | Add Course to Cart');

  // Test 5: Add Course 1 again (Duplicate)
  res = await fetch(`${API_URL}/cart/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`,
    },
    body: JSON.stringify({ courseId: course1.id }),
  });
  if (res.status !== 409) console.error(`FAIL | Add Duplicate -> Expected 409, got ${res.status}`);
  else console.log('PASS | Add Duplicate');

  // Test 6: Add Course 2 (Already Enrolled)
  res = await fetch(`${API_URL}/cart/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`,
    },
    body: JSON.stringify({ courseId: course2.id }),
  });
  if (res.status !== 400) console.error(`FAIL | Add Enrolled -> Expected 400, got ${res.status}`);
  else console.log('PASS | Add Enrolled');

  // Test 7: Add Course 3 (Draft / Not Published)
  res = await fetch(`${API_URL}/cart/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`,
    },
    body: JSON.stringify({ courseId: course3.id }),
  });
  if (res.status !== 404) console.error(`FAIL | Add Draft -> Expected 404, got ${res.status}`);
  else console.log('PASS | Add Draft');

  // Test 8: Get Cart (Should have 1 item and correct total)
  res = await fetch(`${API_URL}/cart`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  data = await res.json();
  if (data.data.total_courses_count !== 1 || data.data.total_price !== 80) {
    console.error('FAIL | Get Cart Data', data.data);
  } else {
    console.log('PASS | Get Cart Data (Total Calculation Correct)');
  }

  // Test 9: Remove item
  res = await fetch(`${API_URL}/cart/items/${course1.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  if (res.status !== 200) console.error('FAIL | Remove item', await res.text());
  else console.log('PASS | Remove item');

  // Test 10: Remove non-existing item
  res = await fetch(`${API_URL}/cart/items/${course1.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  if (res.status !== 404) console.error(`FAIL | Remove non-existing -> Expected 404, got ${res.status}`);
  else console.log('PASS | Remove non-existing');

  // Clean up
  await prisma.cartItem.deleteMany({ where: { course_id: { in: [course1.id, course2.id, course3.id] } } });
  await prisma.cart.deleteMany({ where: { student_id: { in: [student.id, student2.id] } } });
  await prisma.enrollment.deleteMany({ where: { student_id: student.id } });
  await prisma.course.deleteMany({ where: { id: { in: [course1.id, course2.id, course3.id] } } });
  await prisma.category.delete({ where: { id: category.id } });
  await prisma.user.deleteMany({ where: { id: { in: [admin.id, instructor.id, student.id, student2.id] } } });

  console.log('\n✅ Cart Module Production Certified Tests Completed.\n');
  process.exit(0);
}

runTests().catch(console.error);
