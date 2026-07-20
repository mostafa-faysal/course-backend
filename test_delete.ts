import jwt from 'jsonwebtoken';
import http from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';

dotenv.config({ path: path.resolve(__dirname, './.env') });

const prisma = new PrismaClient();
const jwtSecret = process.env.JWT_SECRET || 'fallback_secret';

const ownerId = '91df47be-2067-44c3-8790-ea80cd51dc0a';
const nonOwnerId = '22222222-2222-2222-2222-222222222222';

const ownerToken = jwt.sign({ id: ownerId, role: 'INSTRUCTOR' }, jwtSecret);
const nonOwnerToken = jwt.sign({ id: nonOwnerId, role: 'INSTRUCTOR' }, jwtSecret);

function makeDeleteRequest(courseId: string, token: string | null): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const headers: any = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: `/api/courses/${courseId}`,
      method: 'DELETE',
      headers,
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode || 500, body });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  console.log('--- RUNNING DELETE COURSE TESTS ---');

  // Let's create a temporary course to delete
  const tempCourse = await prisma.course.create({
    data: {
      title: 'Temp Course to Delete',
      description: 'This is a temporary course to test DELETE endpoint.',
      price: 19.99,
      instructor_id: ownerId,
      category_id: '581c867a-7286-41dc-ac45-df9dcc42158c',
    }
  });

  const courseId = tempCourse.id;

  // Test 1: No Token
  console.log('\nTest 1: No Token (Expected: 401)');
  const res1 = await makeDeleteRequest(courseId, null);
  console.log(`Status: ${res1.status}, Body: ${res1.body}`);

  // Test 2: Invalid Token
  console.log('\nTest 2: Invalid Token (Expected: 401)');
  const res2 = await makeDeleteRequest(courseId, 'invalid_token');
  console.log(`Status: ${res2.status}, Body: ${res2.body}`);

  // Test 3: Non-owner Instructor
  console.log('\nTest 3: Non-owner Instructor (Expected: 403)');
  const res3 = await makeDeleteRequest(courseId, nonOwnerToken);
  console.log(`Status: ${res3.status}, Body: ${res3.body}`);

  // Test 4: Course Not Found
  console.log('\nTest 4: Course Not Found (Expected: 404)');
  const res4 = await makeDeleteRequest('123e4567-e89b-12d3-a456-426614174000', ownerToken);
  console.log(`Status: ${res4.status}, Body: ${res4.body}`);

  // Test 5: Course with relation constraint (Expected: 400)
  console.log('\nTest 5: Course with active section dependency (Expected: 400)');
  // Add a section to this course
  const section = await prisma.section.create({
    data: {
      course_id: courseId,
      title: 'Intro Section',
      sequence_order: 1,
    }
  });
  const res5 = await makeDeleteRequest(courseId, ownerToken);
  console.log(`Status: ${res5.status}, Body: ${res5.body}`);

  // Clean up the section first so we can test successful delete
  await prisma.section.delete({ where: { id: section.id } });

  // Test 6: Successful Delete (Expected: 200)
  console.log('\nTest 6: Successful Delete by Owner (Expected: 200)');
  const res6 = await makeDeleteRequest(courseId, ownerToken);
  console.log(`Status: ${res6.status}, Body: ${res6.body}`);

  // Verify deletion from db
  const deletedCheck = await prisma.course.findUnique({ where: { id: courseId } });
  console.log(`DB Verification: Course exists in DB? ${deletedCheck !== null}`);
}

runTests()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
