import { PrismaClient } from '@prisma/client';
import { generateToken } from './src/utils/jwt';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('\n--- Setting up test data for Admin API ---\n');

  // 1. Create Users
  const admin1 = await prisma.user.create({
    data: { full_name: 'Admin One', email: `admin1_${Date.now()}@test.com`, password_hash: 'hash', role: 'ADMIN', status: 'ACTIVE' },
  });
  const admin2 = await prisma.user.create({
    data: { full_name: 'Admin Two', email: `admin2_${Date.now()}@test.com`, password_hash: 'hash', role: 'ADMIN', status: 'ACTIVE' },
  });
  const inst1 = await prisma.user.create({
    data: { full_name: 'Instructor One', email: `inst1_${Date.now()}@test.com`, password_hash: 'hash', role: 'INSTRUCTOR', status: 'ACTIVE' },
  });
  const student1 = await prisma.user.create({
    data: { full_name: 'Student One', email: `stud1_${Date.now()}@test.com`, password_hash: 'hash', role: 'STUDENT', status: 'ACTIVE' },
  });
  const student2 = await prisma.user.create({
    data: { full_name: 'Student Two', email: `stud2_${Date.now()}@test.com`, password_hash: 'hash', role: 'STUDENT', status: 'SUSPENDED' },
  });

  // 2. Create Categories & Courses
  const cat = await prisma.category.create({ data: { name: 'Admin Testing Category' } });
  
  const course1 = await prisma.course.create({
    data: { title: 'Admin Course 1', description: 'Desc', instructor_id: inst1.id, category_id: cat.id, price: 100, status: 'PUBLISHED' }
  });
  const course2 = await prisma.course.create({
    data: { title: 'Admin Course 2 (Draft)', description: 'Desc', instructor_id: inst1.id, category_id: cat.id, price: 150, status: 'DRAFT' }
  });

  // 3. Create Orders and Payments
  // Successful Order
  const orderSuccess = await prisma.order.create({
    data: { student_id: student1.id, subtotal: 100, total_price: 100, status: 'COMPLETED' }
  });
  await prisma.orderItem.create({ data: { order_id: orderSuccess.id, course_id: course1.id, price: 100 } });
  await prisma.payment.create({ data: { order_id: orderSuccess.id, payment_method: 'credit_card', status: 'SUCCESS' } });

  // Pending Order
  const orderPending = await prisma.order.create({
    data: { student_id: student1.id, subtotal: 150, total_price: 150, status: 'PENDING' }
  });
  await prisma.orderItem.create({ data: { order_id: orderPending.id, course_id: course2.id, price: 150 } });
  await prisma.payment.create({ data: { order_id: orderPending.id, payment_method: 'paypal', status: 'PENDING' } });

  // Failed Order
  const orderFailed = await prisma.order.create({
    data: { student_id: student2.id, subtotal: 200, total_price: 200, status: 'FAILED' }
  });
  await prisma.orderItem.create({ data: { order_id: orderFailed.id, course_id: course1.id, price: 200 } });
  await prisma.payment.create({ data: { order_id: orderFailed.id, payment_method: 'credit_card', status: 'FAILED' } });

  // 4. Enrollments
  await prisma.enrollment.create({ data: { student_id: student1.id, course_id: course1.id, progress_percentage: 100 } });

  // 5. Reviews
  const review = await prisma.review.create({
    data: { student_id: student1.id, course_id: course1.id, rating: 5, comment: 'Great!', status: 'APPROVED' }
  });

  // Tokens
  const tokenAdmin1 = generateToken({ id: admin1.id, role: admin1.role });
  const tokenInst = generateToken({ id: inst1.id, role: inst1.role });

  console.log('Test setup complete.\n');

  async function fetchAPI(endpoint: string, token: string, method: string = 'GET', body?: any) {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    });
    return { status: res.status, data: await res.json() };
  }

  // --- TESTS ---

  console.log('1. Unauthorized access');
  let res: any = await fetch(`${API_URL}/admin/dashboard`);
  console.log('Expected: 401, Got:', res.status);

  console.log('\n2. Forbidden access (Instructor)');
  res = await fetchAPI('/admin/dashboard', tokenInst);
  console.log('Expected: 403, Got:', res.status);

  console.log('\n3. Dashboard Overview (Admin)');
  res = await fetchAPI('/admin/dashboard', tokenAdmin1);
  console.log('Expected: 200, Got:', res.status);
  console.log('Revenue (Only SUCCESS counts):', res.data?.data?.revenue?.totalRevenue);

  console.log('\n4. Get Users (Pagination & Filters)');
  res = await fetchAPI('/admin/users?role=STUDENT&limit=1', tokenAdmin1);
  console.log('Expected: 200, Got:', res.status);
  console.log('Total Students in DB summary:', res.data?.data?.summary?.totalStudents);

  console.log('\n5. Get Courses (Search)');
  res = await fetchAPI('/admin/courses?search=Admin Course 1', tokenAdmin1);
  console.log('Expected: 200, Got:', res.status);
  console.log('Returned items:', res.data?.data?.items?.length);

  console.log('\n6. Update User Status: Admin editing himself');
  res = await fetchAPI(`/admin/users/${admin1.id}/status`, tokenAdmin1, 'PATCH', { status: 'SUSPENDED' });
  console.log('Expected: 403, Got:', res.status);

  console.log('\n7. Update User Status: Admin editing another ADMIN');
  res = await fetchAPI(`/admin/users/${admin2.id}/status`, tokenAdmin1, 'PATCH', { status: 'SUSPENDED' });
  console.log('Expected: 403, Got:', res.status);

  console.log('\n8. Update User Status: Student duplicate status');
  res = await fetchAPI(`/admin/users/${student2.id}/status`, tokenAdmin1, 'PATCH', { status: 'SUSPENDED' });
  console.log('Expected: 409, Got:', res.status);

  console.log('\n9. Update User Status: Missing user');
  res = await fetchAPI(`/admin/users/00000000-0000-0000-0000-000000000000/status`, tokenAdmin1, 'PATCH', { status: 'SUSPENDED' });
  console.log('Expected: 404, Got:', res.status);

  console.log('\n10. Update User Status: Valid update on Student');
  res = await fetchAPI(`/admin/users/${student1.id}/status`, tokenAdmin1, 'PATCH', { status: 'SUSPENDED' });
  console.log('Expected: 200, Got:', res.status);

  console.log('\n11. Invalid Enum');
  res = await fetchAPI(`/admin/users/${student1.id}/status`, tokenAdmin1, 'PATCH', { status: 'INVALID_STATUS' });
  console.log('Expected: 400, Got:', res.status);

  console.log('\n12. Update Course Status');
  res = await fetchAPI(`/admin/courses/${course2.id}/status`, tokenAdmin1, 'PATCH', { status: 'PUBLISHED' });
  console.log('Expected: 200, Got:', res.status);

  console.log('\n13. Update Review Status');
  res = await fetchAPI(`/admin/reviews/${review.id}/status`, tokenAdmin1, 'PATCH', { status: 'HIDDEN' });
  console.log('Expected: 200, Got:', res.status);

  console.log('\n--- Cleanup ---');
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.review.deleteMany();
  await prisma.course.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany({ where: { email: { contains: '@test.com' } } });

  console.log('Done.');
}

runTests().catch(console.error).finally(() => prisma.$disconnect());
