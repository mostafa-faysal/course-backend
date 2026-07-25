import { PrismaClient } from '@prisma/client';
import { generateToken } from './src/utils/jwt';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5000/api/student/learning-plan';

async function fetchAPI(endpoint: string, method: string, token: string, body?: any) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function runTests() {
  console.log('Starting Phase 13 Tests: Learning Plans...');
  
  // Clean up
  await prisma.learningPlan.deleteMany({});
  await prisma.course.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.user.deleteMany({});

  // Seed Data
  const student = await prisma.user.create({
    data: { full_name: 'Test Student', email: 'student@example.com', password_hash: 'hash', role: 'STUDENT' }
  });
  
  const instructor = await prisma.user.create({
    data: { full_name: 'Test Instructor', email: 'instructor@example.com', password_hash: 'hash', role: 'INSTRUCTOR' }
  });

  const category = await prisma.category.create({ data: { name: 'Programming' } });

  const course1 = await prisma.course.create({
    data: { title: 'Course 1', description: 'Desc', price: 10, status: 'PUBLISHED', instructor_id: instructor.id, category_id: category.id }
  });
  const course2 = await prisma.course.create({
    data: { title: 'Course 2', description: 'Desc', price: 10, status: 'PUBLISHED', instructor_id: instructor.id, category_id: category.id }
  });
  const course3 = await prisma.course.create({
    data: { title: 'Course 3', description: 'Desc', price: 10, status: 'DRAFT', instructor_id: instructor.id, category_id: category.id }
  });
  const course4 = await prisma.course.create({
    data: { title: 'Course 4', description: 'Desc', price: 10, status: 'PUBLISHED', instructor_id: instructor.id, category_id: category.id }
  });

  const studentToken = generateToken({ id: student.id, email: student.email, role: student.role });
  const instructorToken = generateToken({ id: instructor.id, email: instructor.email, role: instructor.role });

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, errorMsg?: string) {
    if (condition) {
      console.log(`✅ ${testName}`);
      passed++;
    } else {
      console.error(`❌ ${testName} - ${errorMsg}`);
      failed++;
    }
  }

  // Test 1: Unauthorized
  let res = await fetchAPI('/', 'GET', '');
  assert(res.status === 401, 'Unauthorized request should return 401');

  // Test 2: JWT Ownership Enforcement (Instructor tries to access student routes)
  res = await fetchAPI('/', 'GET', instructorToken);
  assert(res.status === 403, 'Instructor accessing learning plan returns 403');

  // Test 3: Auto-create Learning Plan on first GET
  res = await fetchAPI('/', 'GET', studentToken);
  assert(res.status === 200 && res.data.items.length === 0, 'Auto-creates empty learning plan');

  // Test 4: Add course
  res = await fetchAPI('/courses', 'POST', studentToken, { course_id: course1.id });
  assert(res.status === 201, 'Add published course to plan returns 201');

  // Test 5: Add duplicate course
  res = await fetchAPI('/courses', 'POST', studentToken, { course_id: course1.id });
  assert(res.status === 409, 'Adding duplicate course returns 409 Conflict');

  // Test 6: Add unpublished course
  res = await fetchAPI('/courses', 'POST', studentToken, { course_id: course3.id });
  assert(res.status === 400, 'Adding unpublished course returns 400 Bad Request');

  // Test 7: Add non-existent course
  res = await fetchAPI('/courses', 'POST', studentToken, { course_id: '00000000-0000-0000-0000-000000000000' });
  assert(res.status === 404, 'Adding non-existent course returns 404 Not Found');

  // Test 8: Invalid UUID format
  res = await fetchAPI('/courses', 'POST', studentToken, { course_id: 'invalid-id' });
  assert(res.status === 422, 'Adding invalid UUID format returns 422 Validation Error');

  // Test 9: Add second course
  await fetchAPI('/courses', 'POST', studentToken, { course_id: course2.id });
  
  // Test 10: Reorder with Duplicate IDs
  res = await fetchAPI('/courses/reorder', 'PUT', studentToken, { ordered_course_ids: [course1.id, course1.id] });
  assert(res.status === 422, 'Reorder with duplicate IDs returns 422');

  // Test 11: Reorder with Missing IDs
  res = await fetchAPI('/courses/reorder', 'PUT', studentToken, { ordered_course_ids: [course1.id] });
  assert(res.status === 400, 'Reorder with missing IDs returns 400');

  // Test 12: Reorder with Foreign IDs
  res = await fetchAPI('/courses/reorder', 'PUT', studentToken, { ordered_course_ids: [course1.id, course4.id] });
  assert(res.status === 400, 'Reorder with foreign IDs returns 400');

  // Test 13: Valid Reorder
  res = await fetchAPI('/courses/reorder', 'PUT', studentToken, { ordered_course_ids: [course2.id, course1.id] });
  assert(res.status === 200, 'Valid reorder returns 200');

  // Verify Sequence normalization after deletion
  await fetchAPI('/courses', 'POST', studentToken, { course_id: course4.id }); // Add third course
  res = await fetchAPI('/courses/' + course1.id, 'DELETE', studentToken);
  assert(res.status === 200, 'Remove course returns 200');

  const getRes = await fetchAPI('/', 'GET', studentToken);
  const items = getRes.data.items;
  assert(items.length === 2 && items[0].id === course2.id && items[1].id === course4.id, 'Sequence normalized correctly after deletion');

  // Test 14: Recommendation exclusions
  // We have course2 and course4 in the plan. course1 is not in plan. course3 is unpublished.
  // Recommendation should only return course1.
  res = await fetchAPI('/recommendations', 'GET', studentToken);
  const recs = res.data;
  assert(recs.length === 1 && recs[0].id === course1.id, 'Recommendations exclude planned and unpublished courses');

  console.log(`\nTests Completed: ${passed} Passed, ${failed} Failed`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(e => {
  console.error(e);
  process.exit(1);
});
