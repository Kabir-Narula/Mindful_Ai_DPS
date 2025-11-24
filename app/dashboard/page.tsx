import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import DashboardContent from '@/components/dashboard/dashboard-content'
import { StreakService } from '@/lib/streak-service'
import { FeedEntry } from '@/lib/types'

export default async function DashboardPage() {
  const authUser = await getCurrentUser()
  if (!authUser) redirect('/login')

  // 1. Standard Midnight Reset Logic
  const now = new Date()
  now.setHours(0, 0, 0, 0) 
  const endOfToday = new Date(now)
  endOfToday.setHours(23, 59, 59, 999)

  const dayLogRaw = await prisma.dayLog.findUnique({
    where: {
      userId_date: {
        userId: authUser.userId,
        date: now
      }
    }
  })

  // Map to our DayLog interface (handle type mismatch with Prisma client)
  const dayLog = dayLogRaw ? {
    id: dayLogRaw.id,
    morningIntention: dayLogRaw.morningIntention,
    dailyInsight: dayLogRaw.dailyInsight,
    suggestedAction: dayLogRaw.suggestedAction,
    eveningReflection: (dayLogRaw as any).eveningReflection ?? null
  } : null

  // 2. Fetch Feed Data (User-generated content only: Moods + Journals)
  const [moodEntries, journalEntries, user, streakData] = await Promise.all([
    prisma.moodEntry.findMany({
      where: { 
        userId: authUser.userId,
        createdAt: { gte: now } 
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.journalEntry.findMany({
      where: { 
        userId: authUser.userId,
        createdAt: { gte: now }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.user.findUnique({
      where: { id: authUser.userId },
      select: { id: true, name: true, createdAt: true, email: true },
    }),
    StreakService.getStreak(authUser.userId)
  ])

  // Merge and Sort Feed (User-generated content only)
  const feedEntries: FeedEntry[] = [
    ...moodEntries.map(m => ({ 
      id: m.id,
      type: 'mood' as const,
      createdAt: m.createdAt,
      moodScore: m.moodScore,
      note: m.note,
      triggers: m.triggers
    })),
    ...journalEntries.map(j => ({ 
      id: j.id,
      type: 'journal' as const,
      createdAt: j.createdAt,
      title: j.title,
      content: j.content,
      moodScore: j.moodRating,
      sentimentLabel: j.sentimentLabel
    }))
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  if (!user) return null // Should be handled by auth check but satisfies TS

  return (
    <DashboardContent
      user={{
        id: user.id,
        name: user.name,
        email: user.email
      }}
      streak={streakData}
      dayLog={dayLog}
      feedEntries={feedEntries}
    />
  )
}
