import { PrismaClient } from '@prisma/client';
import { sign } from 'jsonwebtoken';
import { randomUUID as uuidv4 } from 'crypto';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

async function runTests() {
  console.log('--- Setting up test data for Favorite API ---');

  // 1. Create Users
  const instructor = await prisma.user.create({
    data: { id: uuidv4(), full_name: 'Fav Inst', email: `inst_fav_${uuidv4()}@test.com`, password_hash: 'hash', role: 'INSTRUCTOR' },
  });
  const admin = await prisma.user.create({
    data: { id: uuidv4(), full_name: 'Fav Admin', email: `admin_fav_${uuidv4()}@test.com`, password_hash: 'hash', role: 'ADMIN' },
  });
  const student = await prisma.user.create({
    data: { id: uuidv4(), full_name: 'Fav Student', email: `student_fav_${uuidv4()}@test.com`, password_hash: 'hash', role: 'STUDENT' },
  });

  const instructorToken = sign({ id: instructor.id, role: instructor.role }, JWT_SECRET);
  const adminToken = sign({ id: admin.id, role: admin.role }, JWT_SECRET);
  const studentToken = sign({ id: student.id, role: student.role }, JWT_SECRET);

  const fetchClient = async (path: string, options: RequestInit = {}, token: string = studentToken) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
    const data = await res.json().catch(() => null);
    return { status: res.status, data };
  };

  // 2. Create Category & Course
  const category = await prisma.category.create({
    data: { id: uuidv4(), name: 'Fav Category' },
  });

  const course = await prisma.course.create({
    data: {
      id: uuidv4(),
      title: 'Fav Course',
      description: 'Test course for favorites',
      price: 0,
      instructor_id: instructor.id,
      category_id: category.id,
      status: 'PUBLISHED',
    },
  });

  console.log('\n--- Running Security Tests ---');

  const securityTests = [
    { name: 'No JWT', token: '', expectedStatus: 401 },
    { name: 'Instructor JWT', token: instructorToken, expectedStatus: 403 },
    { name: 'Admin JWT', token: adminToken, expectedStatus: 403 },
  ];

  for (const test of securityTests) {
    const res = await fetchClient(`/favorites/${course.id}`, { method: 'POST' }, test.token);
    if (res.status === test.expectedStatus) {
      console.log(`PASS | ${test.name} -> Expected ${test.expectedStatus}, got ${res.status}`);
    } else {
      console.error(`FAIL | ${test.name} -> Expected ${test.expectedStatus}, got ${res.status}`);
    }
  }

  console.log('\n--- Running Favorite Features Tests ---');

  // Add course
  let res = await fetchClient(`/favorites/${course.id}`, { method: 'POST' });
  if (res.status === 200) console.log('PASS | Add course to favorites');
  else console.error('FAIL | Add course to favorites', res.data);

  // Add course again (Idempotency)
  res = await fetchClient(`/favorites/${course.id}`, { method: 'POST' });
  if (res.status === 200) console.log('PASS | Add course again (Idempotent, no crash)');
  else console.error('FAIL | Add course again', res.data);

  // Get status
  res = await fetchClient(`/favorites/${course.id}/status`);
  if (res.status === 200 && res.data.data.is_favorite === true) console.log('PASS | Get Favorite Status (true)');
  else console.error('FAIL | Get Favorite Status', res.data);

  // Get all favorites
  res = await fetchClient(`/favorites`);
  if (res.status === 200 && res.data.data.total === 1 && res.data.data.favorites[0].course_id === course.id) {
    console.log('PASS | Get All Favorites (total: 1)');
  } else {
    console.error('FAIL | Get All Favorites', res.data);
  }

  // Remove course
  res = await fetchClient(`/favorites/${course.id}`, { method: 'DELETE' });
  if (res.status === 200) console.log('PASS | Remove course from favorites');
  else console.error('FAIL | Remove course from favorites', res.data);

  // Remove course again (Idempotency)
  res = await fetchClient(`/favorites/${course.id}`, { method: 'DELETE' });
  if (res.status === 200) console.log('PASS | Remove course again (Idempotent, no crash)');
  else console.error('FAIL | Remove course again', res.data);

  // Get status after removal
  res = await fetchClient(`/favorites/${course.id}/status`);
  if (res.status === 200 && res.data.data.is_favorite === false) console.log('PASS | Get Favorite Status (false)');
  else console.error('FAIL | Get Favorite Status', res.data);

  console.log('\n✅ Favorites Module Production Certified Tests Completed.');
}

runTests().catch(console.error).finally(() => prisma.$disconnect());
