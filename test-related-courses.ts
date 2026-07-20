import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api`;

async function runTests() {
  console.log('--- Setting up test data for Related Courses ---');
  
  // Create Instructor
  const instructor = await prisma.user.create({
    data: {
      full_name: 'Test Instructor Related',
      email: `instructor_related_${Date.now()}@test.com`,
      password_hash: 'hashedpassword',
      role: 'INSTRUCTOR',
    }
  });

  // Create Category
  const category1 = await prisma.category.create({ data: { name: 'Category 1' } });
  const category2 = await prisma.category.create({ data: { name: 'Category 2' } });

  // Create Courses
  const c1 = await prisma.course.create({
    data: { title: 'Course 1 (Cat 1)', description: 'Desc', price: 10, instructor_id: instructor.id, category_id: category1.id, status: 'PUBLISHED' }
  });
  
  const c2 = await prisma.course.create({
    data: { title: 'Course 2 (Cat 1)', description: 'Desc', price: 10, instructor_id: instructor.id, category_id: category1.id, status: 'PUBLISHED' }
  });

  const c3 = await prisma.course.create({
    data: { title: 'Course 3 (Cat 1)', description: 'Desc', price: 10, instructor_id: instructor.id, category_id: category1.id, status: 'DRAFT' } // Should not be returned
  });

  const c4 = await prisma.course.create({
    data: { title: 'Course 4 (Cat 2)', description: 'Desc', price: 10, instructor_id: instructor.id, category_id: category2.id, status: 'PUBLISHED' } // Different category
  });

  console.log('--- Running Related Courses Tests ---');

  // Test 1: Get related courses for Course 1
  // Should return Course 2, but not Course 1, not Course 3 (Draft), not Course 4 (Cat 2)
  let res = await fetch(`${BASE_URL}/courses/${c1.id}/related`);
  let data = await res.json();
  console.log(`Test 1 (Valid Course): Status ${res.status} -> ${res.status === 200 ? 'PASS' : 'FAIL'}`);
  const relatedIds = data.data.map((c: any) => c.id);
  console.log(`  Length: ${data.data.length} (expected 1)`);
  console.log(`  Contains c2: ${relatedIds.includes(c2.id)}`);
  console.log(`  Contains c1 (self): ${relatedIds.includes(c1.id)}`);
  console.log(`  Contains c3 (draft): ${relatedIds.includes(c3.id)}`);
  console.log(`  Contains c4 (other cat): ${relatedIds.includes(c4.id)}`);

  // Test 2: Course not found
  let fakeId = '00000000-0000-0000-0000-000000000000';
  res = await fetch(`${BASE_URL}/courses/${fakeId}/related`);
  console.log(`Test 2 (Course Not Found): Status ${res.status} -> ${res.status === 404 ? 'PASS' : 'FAIL'}`);

  console.log('--- Cleaning up test data ---');
  await prisma.course.deleteMany({ where: { id: { in: [c1.id, c2.id, c3.id, c4.id] } } });
  await prisma.category.deleteMany({ where: { id: { in: [category1.id, category2.id] } } });
  await prisma.user.delete({ where: { id: instructor.id } });

  console.log('--- All Done ---');
  process.exit(0);
}

runTests().catch(console.error);
