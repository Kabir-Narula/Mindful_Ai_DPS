import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { subDays, differenceInDays } from 'date-fns'

// Force dynamic rendering (this route uses cookies for auth)
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const messages: any[] = []
    let suggestedAction = null

    // Check for inactivity
    const lastEntry = await prisma.journalEntry.findFirst({
      where: { userId: user.userId },
      orderBy: { createdAt: 'desc' }
    })

    const daysSinceLastEntry = lastEntry ? differenceInDays(new Date(), lastEntry.createdAt) : 999

    if (daysSinceLastEntry >= 3) {
      messages.push({
        type: 'inactivity',
        message: `I haven't seen you in ${daysSinceLastEntry} days. Everything okay? Journaling helps most when it's consistent.`
      })
      suggestedAction = {
        text: 'Write a Quick Check-In',
        link: '/dashboard'
      }
    }

    // Check for improvement
    const weekAgo = subDays(new Date(), 7)
    const twoWeeksAgo = subDays(new Date(), 14)

    const [recentMood, previousMood] = await Promise.all([
      prisma.moodSnapshot.aggregate({
        where: { userId: user.userId, timestamp: { gte: weekAgo } },
        _avg: { moodScore: true }
      }),
      prisma.moodSnapshot.aggregate({
        where: { userId: user.userId, timestamp: { gte: twoWeeksAgo, lt: weekAgo } },
        _avg: { moodScore: true }
      })
    ])

    if (recentMood._avg.moodScore && previousMood._avg.moodScore) {
      const improvement = recentMood._avg.moodScore - previousMood._avg.moodScore
      if (improvement > 0.5) {
        messages.push({
          type: 'improvement',
          message: `Your mood is trending upward! From ${previousMood._avg.moodScore.toFixed(1)} to ${recentMood._avg.moodScore.toFixed(1)}. You're making real progress.`
        })
      } else if (improvement < -0.5) {
        messages.push({
          type: 'pattern',
          message: "Your mood has dropped a bit. Want to talk about what's been challenging lately?"
        })
        suggestedAction = {
          text: 'Start Journaling',
          link: '/dashboard/journal/new'
        }
      }
    }

    // Check for CBT achievements
    const cbtCount = await prisma.therapyExercise.count({
      where: { userId: user.userId, type: 'thought-challenging' }
    })

    if (cbtCount >= 3 && cbtCount % 3 === 0) {
      messages.push({
        type: 'achievement',
        message: `You've completed ${cbtCount} thought-challenging exercises! You're building real cognitive skills.`
      })
    }

    // Check for patterns
    const recentPattern = await prisma.pattern.findFirst({
      where: { userId: user.userId, confidence: { gte: 0.7 } },
      orderBy: { createdAt: 'desc' }
    })

    if (recentPattern && daysSinceLastEntry < 3) {
      messages.push({
        type: 'pattern',
        message: `Pattern detected: ${recentPattern.description}. Being aware is the first step to change.`
      })
    }

    return NextResponse.json({ messages, suggestedAction })
  } catch (error) {
    console.error('AI Coach error:', error)
    return NextResponse.json({ messages: [], suggestedAction: null })
  }
}
