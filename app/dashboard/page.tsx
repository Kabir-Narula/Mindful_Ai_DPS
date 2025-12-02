import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import DashboardContent from '@/components/dashboard/dashboard-content'
import { StreakService } from '@/lib/streak-service'
import { FeedEntry } from '@/lib/types'
import { getTodayInTimezone, getStartOfDayInToronto, getEndOfDayInToronto } from '@/lib/timezone'

export default async function DashboardPage() {
  const authUser = await getCurrentUser()
  if (!authUser) redirect('/login')

  // Get today's date in Toronto timezone (normalized to UTC midnight for DB key)
  const todayDate = getTodayInTimezone()

  // Get the actual time boundaries for "today" in Toronto timezone
  const todayStart = getStartOfDayInToronto()
  const todayEnd = getEndOfDayInToronto()

  // OPTIMIZED: Fetch ALL data in a single parallel batch for maximum performance
  const [dayLogRaw, moodEntries, journalEntries, user, streakData] = await Promise.all([
    // Fetch the day log for TODAY in Toronto timezone
    prisma.dayLog.findUnique({
      where: {
        userId_date: {
          userId: authUser.userId,
          date: todayDate
        }
      }
    }),
    // Fetch Feed Data (User-generated content only: Moods + Journals)
    prisma.moodEntry.findMany({
      where: {
        userId: authUser.userId,
        createdAt: { gte: todayStart, lte: todayEnd }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.journalEntry.findMany({
      where: {
        userId: authUser.userId,
        createdAt: { gte: todayStart, lte: todayEnd }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.user.findUnique({
      where: { id: authUser.userId },
      select: { id: true, name: true, createdAt: true, email: true },
    }),
    StreakService.getStreak(authUser.userId)
  ])

  // Map to our DayLog interface (handle type mismatch with Prisma client)
  const dayLog = dayLogRaw ? {
    id: dayLogRaw.id,
    morningIntention: dayLogRaw.morningIntention,
    dailyInsight: dayLogRaw.dailyInsight,
    suggestedAction: dayLogRaw.suggestedAction,
    eveningReflection: (dayLogRaw as any).eveningReflection ?? null
  } : null

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
  ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

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