import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api`;

async function getToken(userId: string, email: string, role: string) {
  const jwt = require('jsonwebtoken');
  return jwt.sign({ id: userId, email, role }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1h' });
}

async function runTests() {
  console.log('--- Setting up test data for Sections ---');
  
  const admin = await prisma.user.create({ data: { full_name: 'Admin', email: `admin_sec_${Date.now()}@test.com`, password_hash: 'hash', role: 'ADMIN' } });
  const instructor1 = await prisma.user.create({ data: { full_name: 'Inst1', email: `inst1_sec_${Date.now()}@test.com`, password_hash: 'hash', role: 'INSTRUCTOR' } });
  const instructor2 = await prisma.user.create({ data: { full_name: 'Inst2', email: `inst2_sec_${Date.now()}@test.com`, password_hash: 'hash', role: 'INSTRUCTOR' } });

  const adminToken = await getToken(admin.id, admin.email, admin.role);
  const inst1Token = await getToken(instructor1.id, instructor1.email, instructor1.role);
  const inst2Token = await getToken(instructor2.id, instructor2.email, instructor2.role);

  const category = await prisma.category.create({ data: { name: 'Section Category' } });

  const course = await prisma.course.create({
    data: { title: 'Test Course for Sections', description: 'Desc', price: 10, instructor_id: instructor1.id, category_id: category.id }
  });

  console.log('--- Running Section Tests ---');

  let res, text;

  // Test: Invalid UUID
  res = await fetch(`${BASE_URL}/courses/123/sections`, {
    method: 'POST', headers: { 'Authorization': `Bearer ${inst1Token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Title 1' })
  });
  text = await res.text();
  console.log(`Test Invalid UUID: Status ${res.status} -> ${res.status === 400 ? 'PASS' : 'FAIL'} | Response: ${text}`);

  // Test: Course Not Found
  const fakeId = '00000000-0000-0000-0000-000000000000';
  res = await fetch(`${BASE_URL}/courses/${fakeId}/sections`, {
    method: 'POST', headers: { 'Authorization': `Bearer ${inst1Token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Title 1' })
  });
  text = await res.text();
  console.log(`Test Course Not Found: Status ${res.status} -> ${res.status === 404 ? 'PASS' : 'FAIL'} | Response: ${text}`);

  // Test: Non-owner instructor
  res = await fetch(`${BASE_URL}/courses/${course.id}/sections`, {
    method: 'POST', headers: { 'Authorization': `Bearer ${inst2Token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Title 1' })
  });
  text = await res.text();
  console.log(`Test Non-owner Instructor: Status ${res.status} -> ${res.status === 403 ? 'PASS' : 'FAIL'} | Response: ${text}`);

  // Test: Owner instructor (Auto sequence_order)
  res = await fetch(`${BASE_URL}/courses/${course.id}/sections`, {
    method: 'POST', headers: { 'Authorization': `Bearer ${inst1Token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Section A' })
  });
  text = await res.text();
  let data = JSON.parse(text);
  console.log(`Test Auto sequence_order (Owner): Status ${res.status} -> ${res.status === 201 && data.data?.sequence_order === 1 ? 'PASS' : 'FAIL'} | Response: ${text}`);

  // Test: Admin creation (Auto sequence_order)
  res = await fetch(`${BASE_URL}/courses/${course.id}/sections`, {
    method: 'POST', headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Section B' })
  });
  text = await res.text();
  data = JSON.parse(text);
  console.log(`Test Admin creation: Status ${res.status} -> ${res.status === 201 && data.data?.sequence_order === 2 ? 'PASS' : 'FAIL'} | Response: ${text}`);

  // Test: Duplicate title
  res = await fetch(`${BASE_URL}/courses/${course.id}/sections`, {
    method: 'POST', headers: { 'Authorization': `Bearer ${inst1Token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: ' section a ' }) // Should trigger case-insensitive trim duplicate
  });
  text = await res.text();
  console.log(`Test Duplicate title: Status ${res.status} -> ${res.status === 400 ? 'PASS' : 'FAIL'} | Response: ${text}`);

  // Test: Manual insertion in the middle (Insert at 1)
  res = await fetch(`${BASE_URL}/courses/${course.id}/sections`, {
    method: 'POST', headers: { 'Authorization': `Bearer ${inst1Token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Section C (New First)', sequence_order: 1 })
  });
  text = await res.text();
  data = JSON.parse(text);
  console.log(`Test Manual insertion in middle: Status ${res.status} -> ${res.status === 201 && data.data?.sequence_order === 1 ? 'PASS' : 'FAIL'} | Response: ${text}`);
  
  // Verify shift happened
  const allSections = await prisma.section.findMany({ where: { course_id: course.id }, orderBy: { sequence_order: 'asc' }, select: { title: true, sequence_order: true } });
  
  console.log('  Actual Mapping:');
  console.log(JSON.stringify(allSections, null, 2));

  // Assertions
  const expectedMapping = [
    { title: 'Section C (New First)', sequence_order: 1 },
    { title: 'Section A', sequence_order: 2 },
    { title: 'Section B', sequence_order: 3 }
  ];

  let mappingIsCorrect = true;
  let isContinuous = true;
  let hasDuplicates = false;
  
  const seenOrders = new Set();
  
  for (let i = 0; i < allSections.length; i++) {
    const sec = allSections[i];
    if (sec.title !== expectedMapping[i]?.title || sec.sequence_order !== expectedMapping[i]?.sequence_order) {
      mappingIsCorrect = false;
    }
    if (sec.sequence_order !== i + 1) {
      isContinuous = false;
    }
    if (seenOrders.has(sec.sequence_order)) {
      hasDuplicates = true;
    }
    seenOrders.add(sec.sequence_order);
  }

  console.log(`  Mapping Correct: ${mappingIsCorrect ? 'YES' : 'NO'}`);
  console.log(`  Is Continuous (1..N): ${isContinuous ? 'YES' : 'NO'}`);
  console.log(`  Has Duplicates: ${hasDuplicates ? 'YES' : 'NO'}`);
  
  const shiftPass = mappingIsCorrect && isContinuous && !hasDuplicates;
  console.log(`  Shift Test Passed: ${shiftPass ? 'YES' : 'NO'}`);

  console.log(`  Shift Test Passed: ${shiftPass ? 'YES' : 'NO'}`);

  console.log('\n--- Running Update Section Tests ---');
  
  // Get the section we just created ("Section A" should be at index 1 now, "Section C" at 0, "Section B" at 2)
  const sectionA = allSections.find(s => s.title === 'Section A')!;
  const sectionIdA = data.data.id; // wait, data.data is Section C here. We need to fetch it from db.
  const sectionRecordA = await prisma.section.findFirst({ where: { course_id: course.id, title: 'Section A' } });
  
  // Test: Update title only
  res = await fetch(`${BASE_URL}/courses/${course.id}/sections/${sectionRecordA!.id}`, {
    method: 'PUT', headers: { 'Authorization': `Bearer ${inst1Token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Section A Updated' })
  });
  text = await res.text();
  console.log(`Test Update title only: Status ${res.status} -> ${res.status === 200 ? 'PASS' : 'FAIL'} | Response: ${text}`);

  // Test: Update to duplicate title
  res = await fetch(`${BASE_URL}/courses/${course.id}/sections/${sectionRecordA!.id}`, {
    method: 'PUT', headers: { 'Authorization': `Bearer ${inst1Token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Section B' }) // already exists
  });
  text = await res.text();
  console.log(`Test Update duplicate title: Status ${res.status} -> ${res.status === 400 ? 'PASS' : 'FAIL'} | Response: ${text}`);

  // Test: Update sequence_order backwards (Shift up)
  // Section B is at 3, move to 1.
  const sectionRecordB = await prisma.section.findFirst({ where: { course_id: course.id, title: 'Section B' } });
  res = await fetch(`${BASE_URL}/courses/${course.id}/sections/${sectionRecordB!.id}`, {
    method: 'PUT', headers: { 'Authorization': `Bearer ${inst1Token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ sequence_order: 1 })
  });
  text = await res.text();
  console.log(`Test Update order backwards (3 -> 1): Status ${res.status} -> ${res.status === 200 ? 'PASS' : 'FAIL'} | Response: ${text}`);

  // Verify backward shift
  const finalSections = await prisma.section.findMany({ where: { course_id: course.id }, orderBy: { sequence_order: 'asc' }, select: { title: true, sequence_order: true } });
  console.log('  Actual Mapping after backward shift:');
  console.log(JSON.stringify(finalSections, null, 2));

  // Assert backward shift: B goes to 1. C (was 1) goes to 2. A (was 2) goes to 3.
  const expectedMappingAfterShift = [
    { title: 'Section B', sequence_order: 1 },
    { title: 'Section C (New First)', sequence_order: 2 },
    { title: 'Section A Updated', sequence_order: 3 }
  ];
  let backwardShiftCorrect = true;
  for (let i = 0; i < finalSections.length; i++) {
    if (finalSections[i].title !== expectedMappingAfterShift[i]?.title || finalSections[i].sequence_order !== expectedMappingAfterShift[i]?.sequence_order) backwardShiftCorrect = false;
  }
  console.log(`  Backward Shift Correct: ${backwardShiftCorrect ? 'YES' : 'NO'}`);

  // Test: Update sequence_order forwards (Shift down)
  // Move B (currently at 1) to 2.
  res = await fetch(`${BASE_URL}/courses/${course.id}/sections/${sectionRecordB!.id}`, {
    method: 'PUT', headers: { 'Authorization': `Bearer ${inst1Token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ sequence_order: 2 })
  });
  text = await res.text();
  console.log(`Test Update order forwards (1 -> 2): Status ${res.status} -> ${res.status === 200 ? 'PASS' : 'FAIL'} | Response: ${text}`);

  const finalSectionsForwards = await prisma.section.findMany({ where: { course_id: course.id }, orderBy: { sequence_order: 'asc' }, select: { title: true, sequence_order: true } });
  console.log('  Actual Mapping after forward shift:');
  console.log(JSON.stringify(finalSectionsForwards, null, 2));

  // ==========================================
  // --- Delete Section Tests ---
  // ==========================================
  console.log('\n--- Running Delete Section Tests ---');
  // Current Mapping: C=1, B=2, A=3

  // Test 1: Invalid UUID
  res = await fetch(`${BASE_URL}/courses/${course.id}/sections/invalid-uuid`, {
    method: 'DELETE', headers: { 'Authorization': `Bearer ${inst1Token}` }
  });
  text = await res.text();
  console.log(`Test Invalid UUID (DELETE): Status ${res.status} -> ${res.status === 400 ? 'PASS' : 'FAIL'} | Response: ${text}`);

  // Test 2: Course not found
  const fakeCourseId = crypto.randomUUID();
  res = await fetch(`${BASE_URL}/courses/${fakeCourseId}/sections/${sectionRecordB!.id}`, {
    method: 'DELETE', headers: { 'Authorization': `Bearer ${inst1Token}` }
  });
  text = await res.text();
  console.log(`Test Course Not Found (DELETE): Status ${res.status} -> ${res.status === 404 ? 'PASS' : 'FAIL'} | Response: ${text}`);

  // Test 3: Section not found
  const fakeSectionId = crypto.randomUUID();
  res = await fetch(`${BASE_URL}/courses/${course.id}/sections/${fakeSectionId}`, {
    method: 'DELETE', headers: { 'Authorization': `Bearer ${inst1Token}` }
  });
  text = await res.text();
  console.log(`Test Section Not Found (DELETE): Status ${res.status} -> ${res.status === 404 ? 'PASS' : 'FAIL'} | Response: ${text}`);

  // Test 4: Unauthorized instructor
  res = await fetch(`${BASE_URL}/courses/${course.id}/sections/${sectionRecordB!.id}`, {
    method: 'DELETE', headers: { 'Authorization': `Bearer ${inst2Token}` }
  });
  text = await res.text();
  console.log(`Test Unauthorized Instructor (DELETE): Status ${res.status} -> ${res.status === 403 ? 'PASS' : 'FAIL'} | Response: ${text}`);

  // Test 5: Owner deletes middle section
  // Add a 4th section (D) to test middle deletion properly. C=1, B=2, A=3, D=4
  const sectionD = await prisma.section.create({ data: { course_id: course.id, title: 'Section D', sequence_order: 4 } });
  
  // Now delete B (which is currently at 2)
  res = await fetch(`${BASE_URL}/courses/${course.id}/sections/${sectionRecordB!.id}`, {
    method: 'DELETE', headers: { 'Authorization': `Bearer ${inst1Token}` }
  });
  text = await res.text();
  console.log(`Test Owner deletes middle section: Status ${res.status} -> ${res.status === 200 ? 'PASS' : 'FAIL'} | Response: ${text}`);

  const mappingAfterMiddleDelete = await prisma.section.findMany({ where: { course_id: course.id }, orderBy: { sequence_order: 'asc' }, select: { title: true, sequence_order: true } });
  console.log('  Actual Mapping after middle delete (Expect C=1, A=2, D=3):');
  console.log(JSON.stringify(mappingAfterMiddleDelete, null, 2));

  // Test 6: Delete first section
  // Delete C (which is currently at 1)
  const sectionRecordC = await prisma.section.findFirst({ where: { course_id: course.id, title: 'Section C (New First)' } });
  res = await fetch(`${BASE_URL}/courses/${course.id}/sections/${sectionRecordC!.id}`, {
    method: 'DELETE', headers: { 'Authorization': `Bearer ${inst1Token}` }
  });
  text = await res.text();
  console.log(`Test Delete first section: Status ${res.status} -> ${res.status === 200 ? 'PASS' : 'FAIL'} | Response: ${text}`);

  const mappingAfterFirstDelete = await prisma.section.findMany({ where: { course_id: course.id }, orderBy: { sequence_order: 'asc' }, select: { title: true, sequence_order: true } });
  console.log('  Actual Mapping after first delete (Expect A=1, D=2):');
  console.log(JSON.stringify(mappingAfterFirstDelete, null, 2));

  // Test 7: Delete last section
  // Delete D (which is currently at 2)
  res = await fetch(`${BASE_URL}/courses/${course.id}/sections/${sectionD.id}`, {
    method: 'DELETE', headers: { 'Authorization': `Bearer ${inst1Token}` }
  });
  text = await res.text();
  console.log(`Test Delete last section: Status ${res.status} -> ${res.status === 200 ? 'PASS' : 'FAIL'} | Response: ${text}`);

  const mappingAfterLastDelete = await prisma.section.findMany({ where: { course_id: course.id }, orderBy: { sequence_order: 'asc' }, select: { title: true, sequence_order: true } });
  console.log('  Actual Mapping after last delete (Expect A=1):');
  console.log(JSON.stringify(mappingAfterLastDelete, null, 2));

  // Test 8: Admin deletion
  // Delete A (which is currently at 1) using Admin token
  res = await fetch(`${BASE_URL}/courses/${course.id}/sections/${sectionRecordA!.id}`, {
    method: 'DELETE', headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  text = await res.text();
  console.log(`Test Admin deletion: Status ${res.status} -> ${res.status === 200 ? 'PASS' : 'FAIL'} | Response: ${text}`);

  const mappingAfterAdminDelete = await prisma.section.findMany({ where: { course_id: course.id }, orderBy: { sequence_order: 'asc' }, select: { title: true, sequence_order: true } });
  console.log('  Actual Mapping after admin delete (Expect Empty []):');
  console.log(JSON.stringify(mappingAfterAdminDelete, null, 2));

  // Test 9: Verify lessons behavior
  // Create Section -> Create Lesson -> Delete Section -> Verify Lesson is gone
  const testSectionForLessons = await prisma.section.create({ data: { course_id: course.id, title: 'Section with Lessons', sequence_order: 1 } });
  const testLesson = await prisma.lesson.create({ data: { section_id: testSectionForLessons.id, title: 'Lesson 1', duration: 10, sequence_order: 1 } });
  
  res = await fetch(`${BASE_URL}/courses/${course.id}/sections/${testSectionForLessons.id}`, {
    method: 'DELETE', headers: { 'Authorization': `Bearer ${inst1Token}` }
  });
  text = await res.text();
  console.log(`Test Delete section with lessons: Status ${res.status} -> ${res.status === 200 ? 'PASS' : 'FAIL'} | Response: ${text}`);

  const survivingLessons = await prisma.lesson.findMany({ where: { section_id: testSectionForLessons.id } });
  console.log(`  Lessons surviving: ${survivingLessons.length} (Expect 0)`);


  console.log('\n--- Cleaning up test data ---');
  await prisma.section.deleteMany({ where: { course_id: course.id } });
  try {
    await prisma.course.delete({ where: { id: course.id } });
  } catch (e) {
    // Ignore if Prisma times out during delete cleanup
  }
  await prisma.category.delete({ where: { id: category.id } });
  await prisma.user.deleteMany({ where: { id: { in: [admin.id, instructor1.id, instructor2.id] } } });

  console.log('--- All Done ---');
  process.exit(0);
}

runTests().catch(console.error);
