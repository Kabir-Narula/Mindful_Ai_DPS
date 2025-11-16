// Migration script to add ChatSession support to existing chat messages
// Run this after: npx prisma db push --accept-data-loss
// Then run: npx tsx prisma/migrate-chat-sessions.ts

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting chat session migration...')

  // Get all users with chat messages
  const usersWithMessages = await prisma.user.findMany({
    where: {
      chatMessages: {
        some: {},
      },
    },
    include: {
      chatMessages: true,
    },
  })

  console.log(`Found ${usersWithMessages.length} users with chat messages`)

  for (const user of usersWithMessages) {
    if (user.chatMessages.length === 0) continue

    // Create a default session for this user
    const session = await prisma.chatSession.create({
      data: {
        userId: user.id,
        title: 'Previous Conversation',
      },
    })

    console.log(`Created session ${session.id} for user ${user.id}`)

    // Update all messages to reference this session
    await prisma.chatMessage.updateMany({
      where: {
        userId: user.id,
        sessionId: null as any, // Temporary - will be set
      },
      data: {
        sessionId: session.id,
      },
    })

    console.log(`Migrated ${user.chatMessages.length} messages for user ${user.id}`)
  }

  console.log('Migration completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

