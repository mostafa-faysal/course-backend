import http from 'http';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, './.env') });
console.log('DATABASE_URL is:', process.env.DATABASE_URL);

const prisma = new PrismaClient();
const courseId = '8c3e15c6-b88f-4762-812d-9f5a21fd6fea';

function makeGetRequest(id: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: `/api/courses/${id}`,
      method: 'GET',
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
  console.log('--- RUNNING GET COURSE DETAILS TESTS ---');

  // 1. Create a section and lessons for testing masking logic
  console.log('Creating test section & lessons...');
  const section = await prisma.section.create({
    data: {
      course_id: courseId,
      title: 'Curriculum Section',
      sequence_order: 1,
    }
  });

  const lesson1 = await prisma.lesson.create({
    data: {
      section_id: section.id,
      title: 'Free Preview Lesson',
      duration: 10,
      video_url: 'https://example.com/preview.mp4',
      is_free_preview: true,
      sequence_order: 1,
    }
  });

  const lesson2 = await prisma.lesson.create({
    data: {
      section_id: section.id,
      title: 'Paid Exclusive Lesson',
      duration: 25,
      video_url: 'https://example.com/exclusive.mp4',
      is_free_preview: false,
      sequence_order: 2,
    }
  });

  // 2. Fire request
  console.log('Fetching course details via API...');
  const res = await makeGetRequest(courseId);
  console.log(`Status: ${res.status}`);
  
  const data = JSON.parse(res.body);
  console.log('API Response Body excerpt:');
  console.log(JSON.stringify(data, null, 2));

  // 3. Clean up
  console.log('Cleaning up test data...');
  await prisma.lesson.deleteMany({ where: { section_id: section.id } });
  await prisma.section.delete({ where: { id: section.id } });

  // 4. Run validations
  const responseData = data.data;
  const lessons = responseData.sections[0].lessons;
  const freeLesson = lessons.find((l: any) => l.title === 'Free Preview Lesson');
  const paidLesson = lessons.find((l: any) => l.title === 'Paid Exclusive Lesson');

  console.log('\n--- VERIFICATION ---');
  console.log(`Free preview video_url: ${freeLesson.video_url} (Expected: https://example.com/preview.mp4)`);
  console.log(`Paid lesson video_url: ${paidLesson.video_url} (Expected: null)`);

  if (freeLesson.video_url === 'https://example.com/preview.mp4' && paidLesson.video_url === null) {
    console.log('✅ Success: Masking logic worked perfectly!');
  } else {
    console.error('❌ Failure: Masking logic failed.');
  }
}

runTests()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
