import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import DashboardContent from '@/components/dashboard/dashboard-content'

export default async function DashboardPage() {
  const authUser = await getCurrentUser()
  if (!authUser) redirect('/login')

  // Get recent mood entries
  const moodEntries = await prisma.moodEntry.findMany({
    where: { userId: authUser.userId },
    orderBy: { createdAt: 'desc' },
    take: 30,
  })

  // Get recent journal entries
  const journalEntries = await prisma.journalEntry.findMany({
    where: { userId: authUser.userId },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  // Get stats
  const totalJournals = await prisma.journalEntry.count({
    where: { userId: authUser.userId },
  })

  const user = await prisma.user.findUnique({
    where: { id: authUser.userId },
    select: { name: true, createdAt: true },
  })

  // Calculate streak (consecutive days with journal entries)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  let streak = 0
  let checkDate = new Date(today)
  
  while (true) {
    const dayStart = new Date(checkDate)
    const dayEnd = new Date(checkDate)
    dayEnd.setHours(23, 59, 59, 999)
    
    const entryExists = await prisma.journalEntry.findFirst({
      where: {
        userId: authUser.userId,
        createdAt: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
    })
    
    if (entryExists) {
      streak++
      checkDate.setDate(checkDate.getDate() - 1)
    } else {
      break
    }
    
    if (streak > 100) break // Safety limit
  }

  // Calculate average mood
  const avgMood = moodEntries.length > 0
    ? moodEntries.reduce((sum, entry) => sum + entry.moodScore, 0) / moodEntries.length
    : null

  return (
    <DashboardContent
      user={user}
      totalJournals={totalJournals}
      streak={streak}
      avgMood={avgMood}
      moodEntries={moodEntries}
      journalEntries={journalEntries}
    />
  )
}
