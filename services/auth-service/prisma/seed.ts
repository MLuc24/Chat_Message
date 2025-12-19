import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding auth database...');

  // Clear existing data
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  // Create sample users
  const password = await bcrypt.hash('password123', 12);

  const users = await Promise.all([
    prisma.user.create({
      data: {
        id: '11111111-1111-1111-1111-111111111111',
        email: 'alice@example.com',
        passwordHash: password,
        name: 'Alice Johnson',
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        id: '22222222-2222-2222-2222-222222222222',
        email: 'bob@example.com',
        passwordHash: password,
        name: 'Bob Smith',
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        id: '33333333-3333-3333-3333-333333333333',
        email: 'charlie@example.com',
        passwordHash: password,
        name: 'Charlie Brown',
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        id: '44444444-4444-4444-4444-444444444444',
        email: 'diana@example.com',
        passwordHash: password,
        name: 'Diana Prince',
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        id: '55555555-5555-5555-5555-555555555555',
        email: 'edward@example.com',
        passwordHash: password,
        name: 'Edward Norton',
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} users`);
  console.log('📧 All users have password: password123');
  console.log('');
  console.log('Sample users:');
  users.forEach((user) => {
    console.log(`  - ${user.email} (${user.name})`);
  });
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
