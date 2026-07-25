import { PrismaClient } from '@prisma/client';
import { generateToken } from './src/utils/jwt';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5000/api';

async function fetchAPI(endpoint: string, method = 'GET', body?: any, token?: string) {
  const headers: any = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  return { status: res.status, data };
}

async function runTests() {
  console.log('\n--- Starting Phase 16.1 Runtime Verification ---\n');

  // 1. Setup Admins and Targets
  const adminUser = await prisma.user.create({
    data: { full_name: 'Admin Tester', email: `admin_${Date.now()}@test.com`, password_hash: 'hash', role: 'ADMIN', status: 'ACTIVE' },
  });
  const anotherAdminUser = await prisma.user.create({
    data: { full_name: 'Admin Tester 2', email: `admin2_${Date.now()}@test.com`, password_hash: 'hash', role: 'ADMIN', status: 'ACTIVE' },
  });

  const adminToken = generateToken(adminUser.id, 'ADMIN');
  const studentToken = generateToken('dummy_id', 'STUDENT');

  console.log('Setup complete.\n');

  // 2. Test Permission Rules
  console.log('[Test 1] Permission Rules (Admin Only Access)');
  const resNoAuth = await fetchAPI('/admin/users');
  console.log('Without Auth:', resNoAuth.status, resNoAuth.status === 401 ? '✅ PASS' : '❌ FAIL');
  
  const resStudentAuth = await fetchAPI('/admin/users', 'GET', undefined, studentToken);
  console.log('With Student Auth:', resStudentAuth.status, resStudentAuth.status === 403 ? '✅ PASS' : '❌ FAIL');

  // 3. Test Create User API
  console.log('\n[Test 2] Create Instructor Account API');
  const instructorEmail = `inst_${Date.now()}@test.com`;
  const resCreate = await fetchAPI('/admin/users', 'POST', {
    full_name: 'New Instructor',
    email: instructorEmail,
    role: 'INSTRUCTOR'
  }, adminToken);
  console.log('Create Instructor Response Status:', resCreate.status, resCreate.status === 201 ? '✅ PASS' : '❌ FAIL');
  const createdInstructor = resCreate.data.data;
  console.log('Generated Password Present?', !!createdInstructor.initial_password ? '✅ PASS' : '❌ FAIL');

  // 4. Test Create Admin (Should Fail)
  console.log('\n[Test 3] Create Admin Account (Should be forbidden)');
  const resCreateAdmin = await fetchAPI('/admin/users', 'POST', {
    full_name: 'New Admin',
    email: `newadmin_${Date.now()}@test.com`,
    role: 'ADMIN'
  }, adminToken);
  console.log('Create Admin Status:', resCreateAdmin.status, resCreateAdmin.status === 400 || resCreateAdmin.status === 403 ? '✅ PASS' : '❌ FAIL');

  // 5. Test Get Users API
  console.log('\n[Test 4] Get Users (Filtering & Pagination)');
  const resGetUsers = await fetchAPI('/admin/users?role=INSTRUCTOR&limit=5&page=1', 'GET', undefined, adminToken);
  console.log('Get Users Status:', resGetUsers.status, resGetUsers.status === 200 ? '✅ PASS' : '❌ FAIL');
  console.log('Users Data Type:', Array.isArray(resGetUsers.data.data.users) ? '✅ PASS' : '❌ FAIL');

  // 6. Test User Details API
  console.log('\n[Test 5] User Details API');
  const resUserDetails = await fetchAPI(`/admin/users/${createdInstructor.id}`, 'GET', undefined, adminToken);
  console.log('User Details Status:', resUserDetails.status, resUserDetails.status === 200 ? '✅ PASS' : '❌ FAIL');
  console.log('User Details Email Matched:', resUserDetails.data.data.email === instructorEmail ? '✅ PASS' : '❌ FAIL');

  // 7. Test Account Deletion API
  console.log('\n[Test 6] Delete User API (Soft Delete)');
  const resDeleteUser = await fetchAPI(`/admin/users/${createdInstructor.id}`, 'DELETE', undefined, adminToken);
  console.log('Delete Target Status:', resDeleteUser.status, resDeleteUser.status === 200 ? '✅ PASS' : '❌ FAIL');

  // Verify Soft Delete Status
  const checkDeleted = await prisma.user.findUnique({ where: { id: createdInstructor.id } });
  console.log('User is DELETED in DB?', checkDeleted?.status === 'DELETED' ? '✅ PASS' : '❌ FAIL');

  // Verify Audit Log
  const checkAudit = await prisma.userActionHistory.findFirst({ where: { user_id: createdInstructor.id } });
  console.log('Audit Log created?', checkAudit?.action === 'DELETED_ACCOUNT' ? '✅ PASS' : '❌ FAIL');

  // 8. Test Delete Rules
  console.log('\n[Test 7] Delete Rules (Prevent Deleting Self & Admins)');
  const resDeleteSelf = await fetchAPI(`/admin/users/${adminUser.id}`, 'DELETE', undefined, adminToken);
  console.log('Delete Self Status:', resDeleteSelf.status, resDeleteSelf.status === 403 ? '✅ PASS' : '❌ FAIL');

  const resDeleteAnotherAdmin = await fetchAPI(`/admin/users/${anotherAdminUser.id}`, 'DELETE', undefined, adminToken);
  console.log('Delete Another Admin Status:', resDeleteAnotherAdmin.status, resDeleteAnotherAdmin.status === 403 ? '✅ PASS' : '❌ FAIL');

  console.log('\n--- Phase 16.1 Runtime Verification Complete ---\n');
  process.exit(0);
}

runTests().catch(console.error);
