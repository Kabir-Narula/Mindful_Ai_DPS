/**
 * Database Cleanup Script
 * Deletes all users and their associated data for testing purposes
 * 
 * Usage: npx ts-node scripts/cleanup-db.ts
 * Or via npm: npm run db:cleanup
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🗑️  Starting database cleanup...\n')
  
  // Count before deletion
  const userCount = await prisma.user.count()
  console.log(`Found ${userCount} user(s) to delete\n`)
  
  if (userCount === 0) {
    console.log('✅ Database is already clean!')
    return
  }

  console.log('Deleting all data in order (respecting foreign keys)...\n')

  // Delete in reverse dependency order
  const tables = [
    { name: 'ChatMessages', fn: () => prisma.chatMessage.deleteMany() },
    { name: 'ChatSessions', fn: () => prisma.chatSession.deleteMany() },
    { name: 'ActionTrackings', fn: () => prisma.actionTracking.deleteMany() },
    { name: 'MoodSnapshots', fn: () => prisma.moodSnapshot.deleteMany() },
    { name: 'TherapyExercises', fn: () => prisma.therapyExercise.deleteMany() },
    { name: 'WeeklyReflections', fn: () => prisma.weeklyReflection.deleteMany() },
    { name: 'Patterns', fn: () => prisma.pattern.deleteMany() },
    { name: 'Goals', fn: () => prisma.goal.deleteMany() },
    { name: 'MoodEntries', fn: () => prisma.moodEntry.deleteMany() },
    { name: 'JournalEntries', fn: () => prisma.journalEntry.deleteMany() },
    { name: 'DayLogs', fn: () => prisma.dayLog.deleteMany() },
    { name: 'UserProfiles', fn: () => prisma.userProfile.deleteMany() },
    { name: 'Users', fn: () => prisma.user.deleteMany() },
  ]

  for (const table of tables) {
    const result = await table.fn()
    console.log(`  ✓ ${table.name}: ${result.count} deleted`)
  }

  console.log('\n✅ Database cleanup complete!')
  console.log('   All users and their data have been deleted.')
  console.log('   You can now test the full signup → onboarding → dashboard flow.\n')
}

main()
  .catch((e) => {
    console.error('❌ Error during cleanup:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

