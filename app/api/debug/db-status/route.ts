import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * DEBUG ENDPOINT - Check database status for current user
 * GET /api/debug/db-status
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const twentyEightDaysAgo = new Date()
    twentyEightDaysAgo.setDate(twentyEightDaysAgo.getDate() - 28)

    // Check all data for the user
    const [
      totalJournals,
      recentJournals,
      totalMoods,
      recentMoods,
      totalGoals,
      recentGoals,
      totalPatterns,
      activePatterns,
      recentJournalSamples,
    ] = await Promise.all([
      prisma.journalEntry.count({ where: { userId: user.userId } }),
      prisma.journalEntry.count({
        where: {
          userId: user.userId,
          createdAt: { gte: twentyEightDaysAgo },
        },
      }),
      prisma.moodEntry.count({ where: { userId: user.userId } }),
      prisma.moodEntry.count({
        where: {
          userId: user.userId,
          createdAt: { gte: twentyEightDaysAgo },
        },
      }),
      prisma.goal.count({ where: { userId: user.userId } }),
      prisma.goal.count({
        where: {
          userId: user.userId,
          createdAt: { gte: twentyEightDaysAgo },
        },
      }),
      prisma.pattern.count({ where: { userId: user.userId } }),
      prisma.pattern.count({
        where: {
          userId: user.userId,
          isActive: true,
          dismissed: false,
        },
      }),
      prisma.journalEntry.findMany({
        where: { userId: user.userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          moodRating: true,
          activities: true,
          sentiment: true,
          sentimentLabel: true,
          createdAt: true,
        },
      }),
    ])

    const canDetectPatterns = recentJournals >= 5

    return NextResponse.json({
      user: {
        userId: user.userId,
        email: user.email,
      },
      database: {
        journals: {
          total: totalJournals,
          last28Days: recentJournals,
          minimumRequired: 5,
          canDetectPatterns,
        },
        moods: {
          total: totalMoods,
          last28Days: recentMoods,
        },
        goals: {
          total: totalGoals,
          last28Days: recentGoals,
        },
        patterns: {
          total: totalPatterns,
          active: activePatterns,
        },
      },
      recentJournals: recentJournalSamples,
      message: canDetectPatterns
        ? '✅ You have enough data to detect patterns!'
        : `⚠️ You need ${5 - recentJournals} more journal entries (from the last 28 days) to detect patterns.`,
    })
  } catch (error: any) {
    console.error('Debug DB status error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to check database status',
        stack: error.stack,
      },
      { status: 500 }
    )
  }
}
