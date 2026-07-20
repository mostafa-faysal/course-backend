import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api`;

async function runTests() {
  console.log('--- Setting up test data for Lessons ---');
  
  const admin = await prisma.user.create({
    data: {
      full_name: 'Admin Test',
      email: `admin-lesson-${Date.now()}@test.com`,
      password_hash: 'hash',
      role: 'ADMIN',
    }
  });

  const instructor1 = await prisma.user.create({
    data: {
      full_name: 'Inst1 Test',
      email: `inst1-lesson-${Date.now()}@test.com`,
      password_hash: 'hash',
      role: 'INSTRUCTOR',
    }
  });

  const instructor2 = await prisma.user.create({
    data: {
      full_name: 'Inst2 Test',
      email: `inst2-lesson-${Date.now()}@test.com`,
      password_hash: 'hash',
      role: 'INSTRUCTOR',
    }
  });

  const category = await prisma.category.create({
    data: { name: `Tech-${Date.now()}` }
  });

  const course = await prisma.course.create({
    data: {
      title: 'Lesson Test Course',
      description: 'Desc',
      instructor_id: instructor1.id,
      category_id: category.id,
      price: 10,
    }
  });

  const section = await prisma.section.create({
    data: {
      course_id: course.id,
      title: 'Test Section',
      sequence_order: 1,
    }
  });

  const generateToken = async (email: string) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'password123' }) // Assuming generic bypass or we manually sign
    });
    // For tests, let's bypass login and just sign a token directly if we have jsonwebtoken
  };

  // We need to sign tokens. Let's use jsonwebtoken directly.
  const jwt = require('jsonwebtoken');
  const inst1Token = jwt.sign({ id: instructor1.id, email: instructor1.email, role: instructor1.role }, process.env.JWT_SECRET || 'supersecret', { expiresIn: '1h' });
  const inst2Token = jwt.sign({ id: instructor2.id, email: instructor2.email, role: instructor2.role }, process.env.JWT_SECRET || 'supersecret', { expiresIn: '1h' });
  const adminToken = jwt.sign({ id: admin.id, email: admin.email, role: admin.role }, process.env.JWT_SECRET || 'supersecret', { expiresIn: '1h' });

  console.log('--- Running Create Lesson Tests ---');

  // Test 1: Validation Error (Missing Title)
  let res = await fetch(`${BASE_URL}/courses/${course.id}/sections/${section.id}/lessons`, {
    method: 'POST', headers: { 'Authorization': `Bearer ${inst1Token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ duration: 10 })
  });
  let text = await res.text();
  console.log(`Test Missing Title: Status ${res.status} -> ${res.status === 400 ? 'PASS' : 'FAIL'} | Response: ${text}`);

  // Test 2: Validation Error (Invalid Duration)
  res = await fetch(`${BASE_URL}/courses/${course.id}/sections/${section.id}/lessons`, {
    method: 'POST', headers: { 'Authorization': `Bearer ${inst1Token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Lesson 1', duration: -5 })
  });
  text = await res.text();
  console.log(`Test Invalid Duration: Status ${res.status} -> ${res.status === 400 ? 'PASS' : 'FAIL'} | Response: ${text}`);

  // Test 3: Unauthorized Instructor
  res = await fetch(`${BASE_URL}/courses/${course.id}/sections/${section.id}/lessons`, {
    method: 'POST', headers: { 'Authorization': `Bearer ${inst2Token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Lesson 1', duration: 10 })
  });
  text = await res.text();
  console.log(`Test Unauthorized Instructor: Status ${res.status} -> ${res.status === 403 ? 'PASS' : 'FAIL'} | Response: ${text}`);

  // Test 4: Section Not Found
  const fakeSectionId = '00000000-0000-0000-0000-000000000000';
  res = await fetch(`${BASE_URL}/courses/${course.id}/sections/${fakeSectionId}/lessons`, {
    method: 'POST', headers: { 'Authorization': `Bearer ${inst1Token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Lesson 1', duration: 10 })
  });
  text = await res.text();
  console.log(`Test Section Not Found: Status ${res.status} -> ${res.status === 404 ? 'PASS' : 'FAIL'} | Response: ${text}`);

  // Test 5: Auto sequence_order (Owner)
  res = await fetch(`${BASE_URL}/courses/${course.id}/sections/${section.id}/lessons`, {
    method: 'POST', headers: { 'Authorization': `Bearer ${inst1Token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Lesson A', duration: 10, video_url: 'https://youtube.com/watch?v=123' })
  });
  text = await res.text();
  console.log(`Test Auto sequence_order (Owner): Status ${res.status} -> ${res.status === 201 ? 'PASS' : 'FAIL'} | Response: ${text}`);

  // Test 6: Duplicate Title
  res = await fetch(`${BASE_URL}/courses/${course.id}/sections/${section.id}/lessons`, {
    method: 'POST', headers: { 'Authorization': `Bearer ${inst1Token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Lesson A', duration: 20 })
  });
  text = await res.text();
  console.log(`Test Duplicate Title: Status ${res.status} -> ${res.status === 400 ? 'PASS' : 'FAIL'} | Response: ${text}`);

  // Test 7: Admin creation (Auto sequence 2)
  res = await fetch(`${BASE_URL}/courses/${course.id}/sections/${section.id}/lessons`, {
    method: 'POST', headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Lesson B', duration: 15 })
  });
  text = await res.text();
  console.log(`Test Admin creation: Status ${res.status} -> ${res.status === 201 ? 'PASS' : 'FAIL'} | Response: ${text}`);

  // Test 8: Manual insertion in middle (Sequence 1)
  res = await fetch(`${BASE_URL}/courses/${course.id}/sections/${section.id}/lessons`, {
    method: 'POST', headers: { 'Authorization': `Bearer ${inst1Token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Lesson C (New First)', duration: 5, sequence_order: 1 })
  });
  text = await res.text();
  console.log(`Test Manual insertion in middle: Status ${res.status} -> ${res.status === 201 ? 'PASS' : 'FAIL'} | Response: ${text}`);

  const finalMapping = await prisma.lesson.findMany({
    where: { section_id: section.id },
    orderBy: { sequence_order: 'asc' },
    select: { title: true, sequence_order: true }
  });

  console.log('  Actual Mapping:');
  console.log(JSON.stringify(finalMapping, null, 2));

  let isContinuous = true;
  let hasDuplicates = false;
  let mappingCorrect = true;

  const expectedTitles = ['Lesson C (New First)', 'Lesson A', 'Lesson B'];
  const seenOrders = new Set<number>();

  for (let i = 0; i < finalMapping.length; i++) {
    const l = finalMapping[i];
    if (l.sequence_order !== i + 1) isContinuous = false;
    if (seenOrders.has(l.sequence_order)) hasDuplicates = true;
    if (l.title !== expectedTitles[i]) mappingCorrect = false;
    seenOrders.add(l.sequence_order);
  }

  console.log(`  Mapping Correct: ${mappingCorrect ? 'YES' : 'NO'}`);
  console.log(`  Is Continuous (1..N): ${isContinuous ? 'YES' : 'NO'}`);
  console.log(`  Has Duplicates: ${hasDuplicates ? 'YES' : 'NO'}`);

  console.log('\n--- Running Update Lesson Tests ---');

  const lessons = await prisma.lesson.findMany({ where: { section_id: section.id }, orderBy: { sequence_order: 'asc' } });
  const lessonC = lessons[0]; // pos 1
  const lessonA = lessons[1]; // pos 2
  const lessonB = lessons[2]; // pos 3

  // Test 1: Invalid UUID
  res = await fetch(`${BASE_URL}/courses/${course.id}/sections/${section.id}/lessons/not-a-uuid`, {
    method: 'PATCH', headers: { 'Authorization': `Bearer ${inst1Token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'New Title' })
  });
  console.log(`Test Update Invalid UUID: Status ${res.status} -> ${res.status === 400 ? 'PASS' : 'FAIL'}`);

  // Test 2: Course not found
  res = await fetch(`${BASE_URL}/courses/${fakeSectionId}/sections/${section.id}/lessons/${lessonA.id}`, {
    method: 'PATCH', headers: { 'Authorization': `Bearer ${inst1Token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'New Title' })
  });
  console.log(`Test Update Course Not Found: Status ${res.status} -> ${res.status === 404 ? 'PASS' : 'FAIL'}`);

  // Test 3: Section not found
  res = await fetch(`${BASE_URL}/courses/${course.id}/sections/${fakeSectionId}/lessons/${lessonA.id}`, {
    method: 'PATCH', headers: { 'Authorization': `Bearer ${inst1Token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'New Title' })
  });
  console.log(`Test Update Section Not Found: Status ${res.status} -> ${res.status === 404 ? 'PASS' : 'FAIL'}`);

  // Test 4: Lesson not found
  res = await fetch(`${BASE_URL}/courses/${course.id}/sections/${section.id}/lessons/${fakeSectionId}`, {
    method: 'PATCH', headers: { 'Authorization': `Bearer ${inst1Token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'New Title' })
  });
  console.log(`Test Update Lesson Not Found: Status ${res.status} -> ${res.status === 404 ? 'PASS' : 'FAIL'}`);

  // Test 5: Unauthorized instructor
  res = await fetch(`${BASE_URL}/courses/${course.id}/sections/${section.id}/lessons/${lessonA.id}`, {
    method: 'PATCH', headers: { 'Authorization': `Bearer ${inst2Token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'New Title' })
  });
  console.log(`Test Update Unauthorized Instructor: Status ${res.status} -> ${res.status === 403 ? 'PASS' : 'FAIL'}`);

  // Test 6: Update title only
  res = await fetch(`${BASE_URL}/courses/${course.id}/sections/${section.id}/lessons/${lessonA.id}`, {
    method: 'PATCH', headers: { 'Authorization': `Bearer ${inst1Token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Lesson A Updated' })
  });
  console.log(`Test Update Title Only: Status ${res.status} -> ${res.status === 200 ? 'PASS' : 'FAIL'}`);

  // Test 7: Duplicate title
  res = await fetch(`${BASE_URL}/courses/${course.id}/sections/${section.id}/lessons/${lessonA.id}`, {
    method: 'PATCH', headers: { 'Authorization': `Bearer ${inst1Token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Lesson B' }) // conflicts with Lesson B
  });
  console.log(`Test Update Duplicate Title: Status ${res.status} -> ${res.status === 400 ? 'PASS' : 'FAIL'}`);

  // Test 8: Move lesson upwards (3 -> 1) i.e. Lesson B (pos 3) to pos 1
  res = await fetch(`${BASE_URL}/courses/${course.id}/sections/${section.id}/lessons/${lessonB.id}`, {
    method: 'PATCH', headers: { 'Authorization': `Bearer ${inst1Token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ sequence_order: 1 })
  });
  console.log(`Test Move Upwards (3 -> 1): Status ${res.status} -> ${res.status === 200 ? 'PASS' : 'FAIL'}`);
  
  let currentMap = await prisma.lesson.findMany({ where: { section_id: section.id }, orderBy: { sequence_order: 'asc' }, select: { title: true, sequence_order: true }});
  console.log('Mapping after Move Up:');
  console.log(JSON.stringify(currentMap, null, 2));

  // Test 9: Move lesson downwards (1 -> 3) i.e. Lesson B (now pos 1) back to pos 3
  res = await fetch(`${BASE_URL}/courses/${course.id}/sections/${section.id}/lessons/${lessonB.id}`, {
    method: 'PATCH', headers: { 'Authorization': `Bearer ${inst1Token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ sequence_order: 3 })
  });
  console.log(`Test Move Downwards (1 -> 3): Status ${res.status} -> ${res.status === 200 ? 'PASS' : 'FAIL'}`);

  currentMap = await prisma.lesson.findMany({ where: { section_id: section.id }, orderBy: { sequence_order: 'asc' }, select: { title: true, sequence_order: true }});
  console.log('Mapping after Move Down:');
  console.log(JSON.stringify(currentMap, null, 2));

  // Test 10: Move to same position
  res = await fetch(`${BASE_URL}/courses/${course.id}/sections/${section.id}/lessons/${lessonB.id}`, {
    method: 'PATCH', headers: { 'Authorization': `Bearer ${inst1Token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ sequence_order: 3, duration: 99 })
  });
  console.log(`Test Move Same Position: Status ${res.status} -> ${res.status === 200 ? 'PASS' : 'FAIL'}`);

  // Test 11: sequence_order > MAX
  res = await fetch(`${BASE_URL}/courses/${course.id}/sections/${section.id}/lessons/${lessonC.id}`, {
    method: 'PATCH', headers: { 'Authorization': `Bearer ${inst1Token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ sequence_order: 999 })
  });
  console.log(`Test Order > MAX: Status ${res.status} -> ${res.status === 200 ? 'PASS' : 'FAIL'}`);
  currentMap = await prisma.lesson.findMany({ where: { section_id: section.id }, orderBy: { sequence_order: 'asc' }, select: { title: true, sequence_order: true }});
  console.log('Mapping after Order > MAX:');
  console.log(JSON.stringify(currentMap, null, 2));

  // Test 12: sequence_order < 1
  res = await fetch(`${BASE_URL}/courses/${course.id}/sections/${section.id}/lessons/${lessonA.id}`, {
    method: 'PATCH', headers: { 'Authorization': `Bearer ${inst1Token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ sequence_order: -5 })
  });
  console.log(`Test Order < 1: Status ${res.status} -> ${res.status === 200 ? 'PASS' : 'FAIL'}`);
  currentMap = await prisma.lesson.findMany({ where: { section_id: section.id }, orderBy: { sequence_order: 'asc' }, select: { title: true, sequence_order: true }});
  console.log('Mapping after Order < 1:');
  console.log(JSON.stringify(currentMap, null, 2));

  // Test 13: Section mismatch
  // Create another section
  const section2 = await prisma.section.create({
    data: { course_id: course.id, title: 'Section 2', sequence_order: 2 }
  });
  res = await fetch(`${BASE_URL}/courses/${course.id}/sections/${section2.id}/lessons/${lessonA.id}`, {
    method: 'PATCH', headers: { 'Authorization': `Bearer ${inst1Token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Mismatch' })
  });
  console.log(`Test Section Mismatch: Status ${res.status} -> ${res.status === 404 ? 'PASS' : 'FAIL'}`);

  console.log('\n--- Running Delete Lesson Tests ---');
  // At this point we have Lesson A Updated (pos 1), Lesson B (pos 2), Lesson C (New First) (pos 3) inside section 1.
  // We need 4 lessons for Test 6. Let's create Lesson D.
  res = await fetch(`${BASE_URL}/courses/${course.id}/sections/${section.id}/lessons`, {
    method: 'POST', headers: { 'Authorization': `Bearer ${inst1Token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Lesson D', duration: 10 })
  });
  
  let currentList = await prisma.lesson.findMany({ where: { section_id: section.id }, orderBy: { sequence_order: 'asc' } });
  // Map should be: 
  // pos 1: Lesson A Updated
  // pos 2: Lesson B
  // pos 3: Lesson C (New First)
  // pos 4: Lesson D

  // Test 1: Invalid UUID
  res = await fetch(`${BASE_URL}/courses/${course.id}/sections/${section.id}/lessons/not-a-uuid`, {
    method: 'DELETE', headers: { 'Authorization': `Bearer ${inst1Token}` }
  });
  console.log(`Test Delete Invalid UUID: Status ${res.status} -> ${res.status === 400 ? 'PASS' : 'FAIL'}`);

  // Test 2: Course not found
  res = await fetch(`${BASE_URL}/courses/${fakeSectionId}/sections/${section.id}/lessons/${currentList[0].id}`, {
    method: 'DELETE', headers: { 'Authorization': `Bearer ${inst1Token}` }
  });
  console.log(`Test Delete Course Not Found: Status ${res.status} -> ${res.status === 404 ? 'PASS' : 'FAIL'}`);

  // Test 3: Section not found
  res = await fetch(`${BASE_URL}/courses/${course.id}/sections/${fakeSectionId}/lessons/${currentList[0].id}`, {
    method: 'DELETE', headers: { 'Authorization': `Bearer ${inst1Token}` }
  });
  console.log(`Test Delete Section Not Found: Status ${res.status} -> ${res.status === 404 ? 'PASS' : 'FAIL'}`);

  // Test 4: Lesson not found
  res = await fetch(`${BASE_URL}/courses/${course.id}/sections/${section.id}/lessons/${fakeSectionId}`, {
    method: 'DELETE', headers: { 'Authorization': `Bearer ${inst1Token}` }
  });
  console.log(`Test Delete Lesson Not Found: Status ${res.status} -> ${res.status === 404 ? 'PASS' : 'FAIL'}`);

  // Test 5: Unauthorized instructor
  res = await fetch(`${BASE_URL}/courses/${course.id}/sections/${section.id}/lessons/${currentList[0].id}`, {
    method: 'DELETE', headers: { 'Authorization': `Bearer ${inst2Token}` }
  });
  console.log(`Test Delete Unauthorized Instructor: Status ${res.status} -> ${res.status === 403 ? 'PASS' : 'FAIL'}`);

  // Test 10: Section mismatch
  res = await fetch(`${BASE_URL}/courses/${course.id}/sections/${section2.id}/lessons/${currentList[0].id}`, {
    method: 'DELETE', headers: { 'Authorization': `Bearer ${inst1Token}` }
  });
  console.log(`Test Delete Section Mismatch: Status ${res.status} -> ${res.status === 404 ? 'PASS' : 'FAIL'}`);

  // Test 6: Delete middle lesson
  // currentList[1] is Lesson B (pos 2). Delete it.
  res = await fetch(`${BASE_URL}/courses/${course.id}/sections/${section.id}/lessons/${currentList[1].id}`, {
    method: 'DELETE', headers: { 'Authorization': `Bearer ${inst1Token}` }
  });
  console.log(`Test Delete Middle Lesson: Status ${res.status} -> ${res.status === 200 ? 'PASS' : 'FAIL'}`);
  currentMap = await prisma.lesson.findMany({ where: { section_id: section.id }, orderBy: { sequence_order: 'asc' }, select: { title: true, sequence_order: true }});
  console.log('Mapping after Delete Middle:');
  console.log(JSON.stringify(currentMap, null, 2));

  // Test 7: Delete first lesson
  // currentList[0] is Lesson A Updated (pos 1). Delete it.
  res = await fetch(`${BASE_URL}/courses/${course.id}/sections/${section.id}/lessons/${currentList[0].id}`, {
    method: 'DELETE', headers: { 'Authorization': `Bearer ${inst1Token}` }
  });
  console.log(`Test Delete First Lesson: Status ${res.status} -> ${res.status === 200 ? 'PASS' : 'FAIL'}`);
  currentMap = await prisma.lesson.findMany({ where: { section_id: section.id }, orderBy: { sequence_order: 'asc' }, select: { title: true, sequence_order: true }});
  console.log('Mapping after Delete First:');
  console.log(JSON.stringify(currentMap, null, 2));

  // Test 8: Delete last lesson
  // currently we have 2 lessons left. pos 1: Lesson C, pos 2: Lesson D.
  // We will delete Lesson D (which was currentList[3]).
  res = await fetch(`${BASE_URL}/courses/${course.id}/sections/${section.id}/lessons/${currentList[3].id}`, {
    method: 'DELETE', headers: { 'Authorization': `Bearer ${inst1Token}` }
  });
  console.log(`Test Delete Last Lesson: Status ${res.status} -> ${res.status === 200 ? 'PASS' : 'FAIL'}`);
  currentMap = await prisma.lesson.findMany({ where: { section_id: section.id }, orderBy: { sequence_order: 'asc' }, select: { title: true, sequence_order: true }});
  console.log('Mapping after Delete Last:');
  console.log(JSON.stringify(currentMap, null, 2));

  // Test 9: Admin delete
  // We have 1 lesson left: Lesson C (pos 1). We delete it via Admin.
  res = await fetch(`${BASE_URL}/courses/${course.id}/sections/${section.id}/lessons/${currentList[2].id}`, {
    method: 'DELETE', headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  console.log(`Test Delete Admin: Status ${res.status} -> ${res.status === 200 ? 'PASS' : 'FAIL'}`);
  currentMap = await prisma.lesson.findMany({ where: { section_id: section.id }, orderBy: { sequence_order: 'asc' }, select: { title: true, sequence_order: true }});
  console.log('Mapping after Delete Admin:');
  console.log(JSON.stringify(currentMap, null, 2));


  console.log('\n--- Cleaning up test data ---');
  await prisma.lesson.deleteMany({ where: { section_id: { in: [section.id, section2.id] } } });
  await prisma.section.deleteMany({ where: { course_id: course.id } });
  try { await prisma.course.delete({ where: { id: course.id } }); } catch(e){}
  await prisma.category.delete({ where: { id: category.id } });
  await prisma.user.deleteMany({ where: { id: { in: [admin.id, instructor1.id, instructor2.id] } } });

  console.log('--- All Done ---');
  process.exit(0);
}

runTests().catch(console.error);
