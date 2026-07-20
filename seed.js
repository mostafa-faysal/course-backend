const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const category = await prisma.category.create({
    data: { name: 'Web Development', icon: 'web' }
  });

  const instructor = await prisma.user.create({
    data: {
      full_name: 'John Doe',
      email: 'john@example.com',
      password_hash: 'hashedpassword',
      role: 'INSTRUCTOR'
    }
  });

  console.log(JSON.stringify({ categoryId: category.id, instructorId: instructor.id }));
}

main().catch(console.error).finally(() => prisma.$disconnect());
