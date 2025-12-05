import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding user database...');

  // Clear existing data
  await prisma.user.deleteMany();

  // Create sample user profiles (matching auth-service users)
  const users = await Promise.all([
    prisma.user.create({
      data: {
        id: '11111111-1111-1111-1111-111111111111',
        email: 'alice@example.com',
        name: 'Alice Johnson',
        bio: 'Software engineer passionate about building great products',
        avatarUrl: 'https://i.pravatar.cc/150?img=1',
      },
    }),
    prisma.user.create({
      data: {
        id: '22222222-2222-2222-2222-222222222222',
        email: 'bob@example.com',
        name: 'Bob Smith',
        bio: 'Product designer | UI/UX enthusiast',
        avatarUrl: 'https://i.pravatar.cc/150?img=2',
      },
    }),
    prisma.user.create({
      data: {
        id: '33333333-3333-3333-3333-333333333333',
        email: 'charlie@example.com',
        name: 'Charlie Brown',
        bio: 'Full-stack developer | Coffee lover ☕',
        avatarUrl: 'https://i.pravatar.cc/150?img=3',
      },
    }),
    prisma.user.create({
      data: {
        id: '44444444-4444-4444-4444-444444444444',
        email: 'diana@example.com',
        name: 'Diana Prince',
        bio: 'Data scientist | Machine learning researcher',
        avatarUrl: 'https://i.pravatar.cc/150?img=4',
      },
    }),
    prisma.user.create({
      data: {
        id: '55555555-5555-5555-5555-555555555555',
        email: 'edward@example.com',
        name: 'Edward Norton',
        bio: 'DevOps engineer | Cloud infrastructure specialist',
        avatarUrl: 'https://i.pravatar.cc/150?img=5',
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} user profiles`);
  console.log('');
  console.log('Sample user profiles:');
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
