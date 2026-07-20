import { PrismaClient } from '@prisma/client';
import { generateToken } from './src/utils/jwt';

const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api`;

async function runTests() {
  console.log('--- Setting up test data ---');
  
  // 1. Create Instructor
  const instructor = await prisma.user.create({
    data: {
      full_name: 'Test Instructor',
      email: `instructor_${Date.now()}@test.com`,
      password_hash: 'hashedpassword',
      role: 'INSTRUCTOR',
    }
  });

  // 2. Create Category
  const category = await prisma.category.create({
    data: { name: 'Test Category' }
  });

  // 3. Create Courses
  const course = await prisma.course.create({
    data: {
      title: 'Test Course with Reviews',
      description: 'Test Description',
      price: 100,
      instructor_id: instructor.id,
      category_id: category.id,
      requirements: [],
      learning_outcomes: [],
    }
  });

  const emptyCourse = await prisma.course.create({
    data: {
      title: 'Test Course Empty',
      description: 'Test Description',
      price: 100,
      instructor_id: instructor.id,
      category_id: category.id,
      requirements: [],
      learning_outcomes: [],
    }
  });

  // 4. Create Students and Enrollments
  const s1 = await prisma.user.create({ data: { full_name: 'S1', email: `s1_${Date.now()}@test.com`, password_hash: 'hashedpassword', role: 'STUDENT' } });
  const s2 = await prisma.user.create({ data: { full_name: 'S2', email: `s2_${Date.now()}@test.com`, password_hash: 'hashedpassword', role: 'STUDENT' } });
  const s3 = await prisma.user.create({ data: { full_name: 'S3', email: `s3_${Date.now()}@test.com`, password_hash: 'hashedpassword', role: 'STUDENT' } });

  await prisma.enrollment.createMany({
    data: [
      { student_id: s1.id, course_id: course.id },
      { student_id: s2.id, course_id: course.id },
      { student_id: s3.id, course_id: course.id },
    ]
  });

  // 5. Add Reviews
  await prisma.review.createMany({
    data: [
      { course_id: course.id, student_id: s1.id, rating: 5, comment: 'Great' },
      { course_id: course.id, student_id: s2.id, rating: 4, comment: 'Good' },
      { course_id: course.id, student_id: s3.id, rating: 2, comment: 'Bad' },
    ]
  });

  console.log('--- Running GET Reviews Tests ---');

  // Test 1: Course Not Found -> 404
  let fakeId = '00000000-0000-0000-0000-000000000000';
  let res = await fetch(`${BASE_URL}/courses/${fakeId}/reviews`);
  console.log(`Test 1 (Course Not Found): Status ${res.status} -> ${res.status === 404 ? 'PASS' : 'FAIL'}`);

  // Test 2: Course without Reviews -> empty array and 0 averageRating
  res = await fetch(`${BASE_URL}/courses/${emptyCourse.id}/reviews`);
  let data = await res.json();
  console.log(`Test 2 (Empty Course): Status ${res.status} -> ${res.status === 200 ? 'PASS' : 'FAIL'}`);
  console.log(`  averageRating: ${data.data.average_rating}, totalReviews: ${data.data.total_reviews}, reviewsLength: ${data.data.reviews.length}`);
  
  // Test 3: Course with Reviews -> correct average and data
  res = await fetch(`${BASE_URL}/courses/${course.id}/reviews`);
  data = await res.json();
  console.log(`Test 3 (Course with Reviews): Status ${res.status} -> ${res.status === 200 ? 'PASS' : 'FAIL'}`);
  console.log(`  averageRating: ${data.data.average_rating} (expected 3.7), totalReviews: ${data.data.total_reviews} (expected 3)`);
  console.log(`  student format ok: ${data.data.reviews[0].student?.full_name ? 'YES' : 'NO'}`);

  // Test 4: Pagination (limit=2)
  res = await fetch(`${BASE_URL}/courses/${course.id}/reviews?limit=2&page=1`);
  data = await res.json();
  console.log(`Test 4 (Pagination): Length: ${data.data.reviews.length} (expected 2), Page: ${data.data.pagination.page}, TotalPages: ${data.data.pagination.total_pages}`);

  console.log('--- Running PUT Review Tests ---');

  // We need a review to test. s1 made a review with rating 5. Let's find its ID from data of GET.
  // We can just fetch again without limit to get it.
  const allRevRes = await fetch(`${BASE_URL}/courses/${course.id}/reviews`);
  const allRevData = await allRevRes.json();
  const s1Review = allRevData.data.reviews.find((r: any) => r.student_id === s1.id);
  const reviewId = s1Review.id;

  // Test 5: Update review by owner (S1)
  const enrolledToken = generateToken({ id: s1.id, role: s1.role });
  res = await fetch(`${BASE_URL}/courses/${course.id}/reviews/${reviewId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${enrolledToken}` },
    body: JSON.stringify({ rating: 4, comment: 'Updated to good' })
  });
  console.log(`Test 5 (Update by Owner): Status ${res.status} -> ${res.status === 200 ? 'PASS' : 'FAIL'}`);

  // Test 6: Update review by non-owner (S2)
  const s2Token = generateToken({ id: s2.id, role: s2.role });
  res = await fetch(`${BASE_URL}/courses/${course.id}/reviews/${reviewId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${s2Token}` },
    body: JSON.stringify({ rating: 1 })
  });
  console.log(`Test 6 (Update by Non-Owner): Status ${res.status} -> ${res.status === 403 ? 'PASS' : 'FAIL'}`);

  // Test 7: Update review by admin
  const adminToken = generateToken({ id: 'admin123', role: 'ADMIN' });
  res = await fetch(`${BASE_URL}/courses/${course.id}/reviews/${reviewId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({ comment: 'Admin moderated' })
  });
  console.log(`Test 7 (Update by Admin): Status ${res.status} -> ${res.status === 200 ? 'PASS' : 'FAIL'}`);

  console.log('--- Running Rating Summary Tests ---');
  res = await fetch(`${BASE_URL}/courses/${course.id}/rating-summary`);
  data = await res.json();
  console.log(`Test 8 (Rating Summary): Status ${res.status} -> ${res.status === 200 ? 'PASS' : 'FAIL'}`);
  console.log(`  averageRating: ${data.data.average_rating}, totalReviews: ${data.data.total_reviews}`);
  console.log(`  distribution: ${JSON.stringify(data.data.rating_distribution)}`);

  console.log('--- Running DELETE Review Tests ---');

  // Test 8: Delete review by non-owner (S2 trying to delete S1's review)
  res = await fetch(`${BASE_URL}/courses/${course.id}/reviews/${reviewId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${s2Token}` }
  });
  console.log(`Test 8 (Delete by Non-Owner): Status ${res.status} -> ${res.status === 403 ? 'PASS' : 'FAIL'}`);

  // Test 9: Delete review by owner (S1)
  res = await fetch(`${BASE_URL}/courses/${course.id}/reviews/${reviewId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${enrolledToken}` }
  });
  console.log(`Test 9 (Delete by Owner): Status ${res.status} -> ${res.status === 200 ? 'PASS' : 'FAIL'}`);

  // Test 10: Delete review by Admin (Admin deleting S3's review)
  const s3Review = allRevData.data.reviews.find((r: any) => r.student_id === s3.id);
  res = await fetch(`${BASE_URL}/courses/${course.id}/reviews/${s3Review.id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  console.log(`Test 10 (Delete by Admin): Status ${res.status} -> ${res.status === 200 ? 'PASS' : 'FAIL'}`);

  // Test 11: Delete non-existent review -> 404
  let fakeReviewId = '00000000-0000-0000-0000-000000000000';
  res = await fetch(`${BASE_URL}/courses/${course.id}/reviews/${fakeReviewId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  console.log(`Test 11 (Review Not Found): Status ${res.status} -> ${res.status === 404 ? 'PASS' : 'FAIL'}`);

  console.log('--- Cleaning up test data ---');
  await prisma.review.deleteMany({ where: { course_id: { in: [course.id, emptyCourse.id] } } });
  await prisma.enrollment.deleteMany({ where: { course_id: { in: [course.id, emptyCourse.id] } } });
  await prisma.course.deleteMany({ where: { id: { in: [course.id, emptyCourse.id] } } });
  await prisma.category.delete({ where: { id: category.id } });
  await prisma.user.deleteMany({ where: { id: { in: [instructor.id, s1.id, s2.id, s3.id] } } });

  console.log('--- All Done ---');
  process.exit(0);
}

runTests().catch(console.error);
