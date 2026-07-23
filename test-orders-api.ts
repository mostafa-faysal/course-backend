import { PrismaClient } from '@prisma/client';
import { generateToken } from './src/utils/jwt';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('\n--- Setting up test data for Orders API ---\n');

  // 1. Create a Student, an Instructor
  const student = await prisma.user.create({
    data: {
      full_name: 'Order Student',
      email: `order_student_${Date.now()}@test.com`,
      password_hash: 'hash',
      role: 'STUDENT',
    },
  });
  
  const student2 = await prisma.user.create({
    data: {
      full_name: 'Order Student 2',
      email: `order_student2_${Date.now()}@test.com`,
      password_hash: 'hash',
      role: 'STUDENT',
    },
  });

  const instructor = await prisma.user.create({
    data: {
      full_name: 'Order Instructor',
      email: `order_instructor_${Date.now()}@test.com`,
      password_hash: 'hash',
      role: 'INSTRUCTOR',
    },
  });

  // 2. Create Category and Courses
  const category = await prisma.category.create({
    data: { name: 'Order Test Category' },
  });

  const course1 = await prisma.course.create({
    data: {
      title: 'Order Course 1',
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
      title: 'Order Course 2',
      description: 'Desc',
      price: 200,
      status: 'PUBLISHED',
      instructor_id: instructor.id,
      category_id: category.id,
    },
  });

  // Generate tokens
  const studentToken = generateToken({ id: student.id, role: student.role });
  const student2Token = generateToken({ id: student2.id, role: student2.role });

  console.log('--- Running Orders Tests ---');

  // Test 1: Empty Cart
  let res = await fetch(`${API_URL}/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  if (res.status !== 400) console.error(`FAIL | Create Order with Empty Cart -> Expected 400, got ${res.status}`);
  else console.log(`PASS | Create Order with Empty Cart -> Expected 400, got 400`);

  // Setup: Add courses to cart
  await fetch(`${API_URL}/cart/${course1.id}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  await fetch(`${API_URL}/cart/${course2.id}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
  });

  // Test 2: Create Order Success (multiple courses)
  res = await fetch(`${API_URL}/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  const orderData = await res.json();
  let orderId = '';
  if (res.status !== 201) {
    console.error(`FAIL | Create Order Success -> Expected 201, got ${res.status}`);
  } else {
    orderId = orderData.data.id;
    console.log(`PASS | Create Order Success -> Expected 201, got 201`);
  }

  // Test 3: Verify non-existent order
  res = await fetch(`${API_URL}/payments/verify`, {
    method: 'POST',
    headers: { 
      Authorization: `Bearer ${studentToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ orderId: '00000000-0000-0000-0000-000000000000', success: true })
  });
  if (res.status !== 404) console.error(`FAIL | Verify non-existent order -> Expected 404, got ${res.status}`);
  else console.log(`PASS | Verify non-existent order -> Expected 404, got 404`);

  // Test 4: Verify order of another user
  res = await fetch(`${API_URL}/payments/verify`, {
    method: 'POST',
    headers: { 
      Authorization: `Bearer ${student2Token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ orderId, success: true })
  });
  if (res.status !== 403) console.error(`FAIL | Verify order of another user -> Expected 403, got ${res.status}`);
  else console.log(`PASS | Verify order of another user -> Expected 403, got 403`);

  // Test 5: Verify Payment Failure
  res = await fetch(`${API_URL}/payments/verify`, {
    method: 'POST',
    headers: { 
      Authorization: `Bearer ${studentToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ orderId, success: false })
  });
  if (res.status !== 200) {
    console.error(`FAIL | Verify Payment Failure -> Expected 200, got ${res.status}`);
  } else {
    const data = await res.json();
    if (data.data.order.status === 'FAILED' && data.data.payment.status === 'FAILED') {
      console.log(`PASS | Verify Payment Failure -> Order and Payment FAILED`);
    } else {
      console.error(`FAIL | Verify Payment Failure -> Status not updated correctly`);
    }
  }

  // Setup: Create a new order since the previous one failed
  res = await fetch(`${API_URL}/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  const orderData2 = await res.json();
  const orderId2 = orderData2.data.id;

  // Test 6: Verify Payment Success
  res = await fetch(`${API_URL}/payments/verify`, {
    method: 'POST',
    headers: { 
      Authorization: `Bearer ${studentToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ orderId: orderId2, success: true })
  });
  if (res.status !== 200) {
    console.error(`FAIL | Verify Payment Success -> Expected 200, got ${res.status}`);
  } else {
    const data = await res.json();
    if (data.data.order.status === 'COMPLETED' && data.data.payment.status === 'SUCCESS') {
      console.log(`PASS | Verify Payment Success -> Order PAID and Payment SUCCESS`);
    } else {
      console.error(`FAIL | Verify Payment Success -> Status not updated correctly`);
    }
  }

  // Test 7: Verify same order twice
  res = await fetch(`${API_URL}/payments/verify`, {
    method: 'POST',
    headers: { 
      Authorization: `Bearer ${studentToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ orderId: orderId2, success: true })
  });
  if (res.status !== 409) console.error(`FAIL | Verify same order twice -> Expected 409, got ${res.status}`);
  else console.log(`PASS | Verify same order twice -> Expected 409, got 409`);

  // Test 8: Cart is cleared
  res = await fetch(`${API_URL}/cart`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  const cartData = await res.json();
  if (cartData.data.items.length === 0) {
    console.log(`PASS | Cart is cleared after success`);
  } else {
    console.error(`FAIL | Cart is cleared after success -> Cart still has items`);
  }

  // Test 9: Create order with empty cart (again)
  res = await fetch(`${API_URL}/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  if (res.status !== 400) console.error(`FAIL | Prevent creating order from old cart -> Expected 400, got ${res.status}`);
  else console.log(`PASS | Prevent creating order from old cart -> Expected 400, got 400`);

  // Test 10: Enrollments count equals courses count
  const enrollmentsCount = await prisma.enrollment.count({
    where: { student_id: student.id }
  });
  if (enrollmentsCount === 2) {
    console.log(`PASS | Enrollments created successfully`);
  } else {
    console.error(`FAIL | Enrollments created successfully -> Expected 2, got ${enrollmentsCount}`);
  }

  // Test 11: Order History
  res = await fetch(`${API_URL}/orders/history`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  if (res.status !== 200) {
    console.error(`FAIL | Order History -> Expected 200, got ${res.status}`);
  } else {
    const historyData = await res.json();
    if (historyData.data.length >= 2) { // 1 failed, 1 completed
      console.log(`PASS | Order History -> Returned orders successfully`);
    } else {
      console.error(`FAIL | Order History -> Not enough orders returned`);
    }
  }

  console.log('\n--- Cleaning up Orders Test Data ---\n');
  await prisma.enrollment.deleteMany({ where: { student_id: student.id } });
  await prisma.payment.deleteMany({ where: { order: { student_id: student.id } } });
  await prisma.orderItem.deleteMany({ where: { order: { student_id: student.id } } });
  await prisma.order.deleteMany({ where: { student_id: student.id } });
  await prisma.cartItem.deleteMany({ where: { cart: { student_id: student.id } } });
  await prisma.cart.deleteMany({ where: { student_id: student.id } });
  
  await prisma.course.deleteMany({ where: { id: { in: [course1.id, course2.id] } } });
  await prisma.category.delete({ where: { id: category.id } });
  await prisma.user.deleteMany({ where: { id: { in: [student.id, student2.id, instructor.id] } } });

  console.log('--- Orders Tests Finished ---\n');
}

runTests().catch(console.error).finally(() => prisma.$disconnect());
