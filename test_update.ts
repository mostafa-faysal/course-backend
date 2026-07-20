import jwt from 'jsonwebtoken';
import http from 'http';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, './.env') });

const jwtSecret = process.env.JWT_SECRET || 'fallback_secret';
const courseId = '8c3e15c6-b88f-4762-812d-9f5a21fd6fea';
const ownerId = '91df47be-2067-44c3-8790-ea80cd51dc0a';
const nonOwnerId = '22222222-2222-2222-2222-222222222222';

// 1. Generate tokens
const ownerToken = jwt.sign({ id: ownerId, role: 'INSTRUCTOR' }, jwtSecret);
const nonOwnerToken = jwt.sign({ id: nonOwnerId, role: 'INSTRUCTOR' }, jwtSecret);

function makeRequest(token: string | null, bodyData: any): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const dataStr = JSON.stringify(bodyData);
    const headers: any = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(dataStr),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: `/api/courses/${courseId}`,
      method: 'PUT',
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
    req.write(dataStr);
    req.end();
  });
}

async function runTests() {
  console.log('--- RUNNING UPDATE COURSE TESTS ---');

  // Test 1: No Token
  console.log('\nTest 1: No Token (Expected: 401)');
  const res1 = await makeRequest(null, { title: 'Updated Title' });
  console.log(`Status: ${res1.status}, Body: ${res1.body}`);

  // Test 2: Invalid Token
  console.log('\nTest 2: Invalid Token (Expected: 401)');
  const res2 = await makeRequest('invalid_token_here', { title: 'Updated Title' });
  console.log(`Status: ${res2.status}, Body: ${res2.body}`);

  // Test 3: Non-owner Instructor
  console.log('\nTest 3: Non-owner Instructor (Expected: 403)');
  const res3 = await makeRequest(nonOwnerToken, { title: 'Updated Title' });
  console.log(`Status: ${res3.status}, Body: ${res3.body}`);

  // Test 4: Owner Instructor
  console.log('\nTest 4: Owner Instructor (Expected: 200)');
  const res4 = await makeRequest(ownerToken, { title: 'Advanced React 18 & Next.js', price: 59.99 });
  console.log(`Status: ${res4.status}, Body: ${res4.body}`);
}

runTests().catch(console.error);
