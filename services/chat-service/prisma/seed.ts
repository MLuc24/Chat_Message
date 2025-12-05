import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding chat database...');

  // Clear existing data
  await prisma.messageStatus.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversationMember.deleteMany();
  await prisma.conversation.deleteMany();

  // User IDs (matching auth and user services)
  const alice = '11111111-1111-1111-1111-111111111111';
  const bob = '22222222-2222-2222-2222-222222222222';
  const charlie = '33333333-3333-3333-3333-333333333333';
  const diana = '44444444-4444-4444-4444-444444444444';
  const edward = '55555555-5555-5555-5555-555555555555';

  // Create direct conversations
  const conv1 = await prisma.conversation.create({
    data: {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      type: 'direct',
      createdBy: alice,
      members: {
        create: [
          { userId: alice, role: 'member' },
          { userId: bob, role: 'member' },
        ],
      },
    },
  });

  const conv2 = await prisma.conversation.create({
    data: {
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      type: 'direct',
      createdBy: alice,
      members: {
        create: [
          { userId: alice, role: 'member' },
          { userId: charlie, role: 'member' },
        ],
      },
    },
  });

  // Create a group conversation
  const groupConv = await prisma.conversation.create({
    data: {
      id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      type: 'group',
      name: 'Team Discussion',
      avatarUrl: 'https://i.pravatar.cc/150?img=10',
      createdBy: alice,
      members: {
        create: [
          { userId: alice, role: 'admin' },
          { userId: bob, role: 'member' },
          { userId: charlie, role: 'member' },
          { userId: diana, role: 'member' },
        ],
      },
    },
  });

  console.log('✅ Created 3 conversations');

  // Create messages for conversation 1 (Alice & Bob)
  const messages1 = await Promise.all([
    prisma.message.create({
      data: {
        conversationId: conv1.id,
        senderId: alice,
        type: 'text',
        text: 'Hey Bob! How are you?',
        createdAt: new Date('2024-12-01T10:00:00Z'),
      },
    }),
    prisma.message.create({
      data: {
        conversationId: conv1.id,
        senderId: bob,
        type: 'text',
        text: "Hi Alice! I'm doing great, thanks for asking!",
        createdAt: new Date('2024-12-01T10:05:00Z'),
      },
    }),
    prisma.message.create({
      data: {
        conversationId: conv1.id,
        senderId: alice,
        type: 'text',
        text: 'Are you free for a call later today?',
        createdAt: new Date('2024-12-01T10:10:00Z'),
      },
    }),
    prisma.message.create({
      data: {
        conversationId: conv1.id,
        senderId: bob,
        type: 'text',
        text: 'Sure! How about 3 PM?',
        createdAt: new Date('2024-12-01T10:15:00Z'),
      },
    }),
  ]);

  // Create messages for conversation 2 (Alice & Charlie)
  const messages2 = await Promise.all([
    prisma.message.create({
      data: {
        conversationId: conv2.id,
        senderId: charlie,
        type: 'text',
        text: 'Alice, did you see the new design mockups?',
        createdAt: new Date('2024-12-02T09:00:00Z'),
      },
    }),
    prisma.message.create({
      data: {
        conversationId: conv2.id,
        senderId: alice,
        type: 'text',
        text: 'Yes! They look amazing! 🎨',
        createdAt: new Date('2024-12-02T09:10:00Z'),
      },
    }),
  ]);

  // Create messages for group conversation
  const groupMessages = await Promise.all([
    prisma.message.create({
      data: {
        conversationId: groupConv.id,
        senderId: alice,
        type: 'text',
        text: 'Welcome to the team discussion group!',
        createdAt: new Date('2024-12-03T08:00:00Z'),
      },
    }),
    prisma.message.create({
      data: {
        conversationId: groupConv.id,
        senderId: bob,
        type: 'text',
        text: 'Thanks for creating this! 👍',
        createdAt: new Date('2024-12-03T08:05:00Z'),
      },
    }),
    prisma.message.create({
      data: {
        conversationId: groupConv.id,
        senderId: charlie,
        type: 'text',
        text: 'Great idea! This will help us collaborate better.',
        createdAt: new Date('2024-12-03T08:10:00Z'),
      },
    }),
    prisma.message.create({
      data: {
        conversationId: groupConv.id,
        senderId: diana,
        type: 'text',
        text: "I'm excited to work with you all! 🚀",
        createdAt: new Date('2024-12-03T08:15:00Z'),
      },
    }),
    prisma.message.create({
      data: {
        conversationId: groupConv.id,
        senderId: alice,
        type: 'text',
        text: "Let's schedule our first team meeting for next week.",
        createdAt: new Date('2024-12-03T08:20:00Z'),
      },
    }),
  ]);

  const totalMessages = messages1.length + messages2.length + groupMessages.length;
  console.log(`✅ Created ${totalMessages} messages`);

  // Create message statuses
  const allMessages = [...messages1, ...messages2, ...groupMessages];
  
  for (const message of allMessages) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: message.conversationId },
      include: { members: true },
    });

    if (conversation) {
      // Create statuses for all members except the sender
      const otherMembers = conversation.members.filter(
        (member) => member.userId !== message.senderId
      );

      for (const member of otherMembers) {
        await prisma.messageStatus.create({
          data: {
            messageId: message.id,
            userId: member.userId,
            status: 'delivered',
            timestamp: new Date(message.createdAt.getTime() + 1000),
          },
        });
      }
    }
  }

  console.log('✅ Created message statuses');
  console.log('');
  console.log('Sample data created:');
  console.log('  - 2 direct conversations');
  console.log('  - 1 group conversation (4 members)');
  console.log(`  - ${totalMessages} messages`);
  console.log('  - Message statuses for all messages');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
