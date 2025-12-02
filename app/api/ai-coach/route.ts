import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { subDays, differenceInDays } from 'date-fns'

// ============================================================================
// CONFIGURATION
// ============================================================================

// Force dynamic rendering (this route uses cookies for auth)
export const dynamic = 'force-dynamic'

/**
 * Message types for the AI coach
 */
type MessageType = 'inactivity' | 'improvement' | 'decline' | 'achievement' | 'pattern' | 'streak' | 'welcome'

/**
 * Coach message structure
 */
interface CoachMessage {
  id: string
  type: MessageType
  message: string
  priority: number // Higher = more important
  icon?: string
}

/**
 * Suggested action structure
 */
interface SuggestedAction {
  text: string
  link: string
  icon?: string
}

/**
 * Response structure
 */
interface CoachResponse {
  messages: CoachMessage[]
  suggestedAction: SuggestedAction | null
  meta: {
    userId: string
    generatedAt: string
    cacheHint: number // Seconds until data might change
  }
}

// ============================================================================
// CACHING
// ============================================================================

/**
 * Simple cache for coach responses
 * These insights don't change frequently, so we can cache for a few minutes
 */
interface CacheEntry {
  response: CoachResponse
  timestamp: number
}

const responseCache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

function getCachedResponse(userId: string): CoachResponse | null {
  const entry = responseCache.get(userId)
  if (!entry) return null

  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    responseCache.delete(userId)
    return null
  }

  return entry.response
}

function cacheResponse(userId: string, response: CoachResponse): void {
  responseCache.set(userId, { response, timestamp: Date.now() })
}

// ============================================================================
// MESSAGE GENERATORS - Warm, friendly, specific messages
// ============================================================================

/**
 * Generate unique message ID
 */
function generateMessageId(): string {
  return Math.random().toString(36).substring(2, 10)
}

/**
 * Check for inactivity and generate warm, welcoming message
 */
function checkInactivity(daysSinceLastEntry: number): CoachMessage | null {
  if (daysSinceLastEntry < 3) return null

  // Warm, not guilt-inducing messages
  const messages = [
    {
      days: 3,
      msg: "Hey! It's been a few days. Even a quick one-sentence check-in counts - how are you really doing?",
      priority: 3
    },
    {
      days: 7,
      msg: "A week has flown by! No pressure at all - whenever you want to chat, I'm here. What's been on your mind?",
      priority: 4
    },
    {
      days: 14,
      msg: "Welcome back! Life gets busy, and that's okay. The fact that you're here now is what matters. 💙",
      priority: 5
    },
    {
      days: 30,
      msg: "It's been a while - I'm genuinely glad to see you back. Ready to start fresh whenever you are.",
      priority: 5
    },
  ]

  const match = [...messages].reverse().find(m => daysSinceLastEntry >= m.days) || messages[0]

  return {
    id: generateMessageId(),
    type: 'inactivity',
    message: match.msg,
    priority: match.priority,
    icon: '👋'
  }
}

/**
 * Check mood trends and generate specific, actionable insight
 */
function checkMoodTrend(recentAvg: number | null, previousAvg: number | null): CoachMessage | null {
  if (!recentAvg || !previousAvg) return null

  const diff = recentAvg - previousAvg

  if (diff > 0.5) {
    return {
      id: generateMessageId(),
      type: 'improvement',
      message: `Your mood's been trending up! (${previousAvg.toFixed(1)} → ${recentAvg.toFixed(1)}) Something's working - any idea what it might be?`,
      priority: 4,
      icon: '📈'
    }
  }

  if (diff < -0.5) {
    return {
      id: generateMessageId(),
      type: 'decline',
      message: `Things have felt a bit heavier this week (mood at ${recentAvg.toFixed(1)}). That's okay - want to try a quick thought challenge? Sometimes it helps shift things.`,
      priority: 3,
      icon: '💙'
    }
  }

  return null
}

/**
 * Check for achievements and milestones - celebrate specifically!
 */
function checkAchievements(cbtCount: number, streak: number): CoachMessage[] {
  const messages: CoachMessage[] = []

  // CBT milestones - specific and encouraging
  if (cbtCount === 1) {
    messages.push({
      id: generateMessageId(),
      type: 'achievement',
      message: "You did your first thought challenge! That's literally rewiring your brain. How did it feel?",
      priority: 4,
      icon: '🧠'
    })
  } else if (cbtCount === 5) {
    messages.push({
      id: generateMessageId(),
      type: 'achievement',
      message: "5 thought challenges complete! You're getting really good at catching those tricky thoughts.",
      priority: 3,
      icon: '🎯'
    })
  } else if (cbtCount === 10) {
    messages.push({
      id: generateMessageId(),
      type: 'achievement',
      message: "10 thought challenges! You've built a real skill here. Your brain literally works differently now.",
      priority: 4,
      icon: '🏆'
    })
  }

  // Streak milestones - make them feel earned
  if (streak === 3) {
    messages.push({
      id: generateMessageId(),
      type: 'streak',
      message: "3 days in a row! You're building momentum. Keep showing up for yourself!",
      priority: 3,
      icon: '🔥'
    })
  } else if (streak === 7) {
    messages.push({
      id: generateMessageId(),
      type: 'streak',
      message: "A whole week of showing up for yourself! That takes real commitment. Proud of you.",
      priority: 4,
      icon: '⭐'
    })
  } else if (streak === 14) {
    messages.push({
      id: generateMessageId(),
      type: 'streak',
      message: "Two weeks strong! This is becoming a real habit. Your future self will thank you.",
      priority: 4,
      icon: '✨'
    })
  } else if (streak === 30) {
    messages.push({
      id: generateMessageId(),
      type: 'streak',
      message: "30 DAYS! 🎉 You've officially built a sustainable practice. This is huge.",
      priority: 5,
      icon: '🏅'
    })
  }

  return messages
}

/**
 * Get contextual suggested action
 */
function getSuggestedAction(
  daysSinceLastEntry: number,
  moodTrend: 'up' | 'down' | 'stable',
  hasPatterns: boolean
): SuggestedAction | null {
  if (daysSinceLastEntry >= 3) {
    return {
      text: 'Quick Check-In (30 sec)',
      link: '/dashboard',
      icon: '✏️'
    }
  }

  if (moodTrend === 'down') {
    return {
      text: 'Try a Thought Challenge',
      link: '/dashboard/cbt',
      icon: '💭'
    }
  }

  if (hasPatterns) {
    return {
      text: 'See Your Patterns',
      link: '/dashboard/insights',
      icon: '✨'
    }
  }

  return null
}

// ============================================================================
// ROUTE HANDLER
// ============================================================================

export async function GET() {
  const startTime = Date.now()

  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }

    // Check cache first
    const cached = getCachedResponse(user.userId)
    if (cached) {
      console.log(`[AI Coach] Cache hit for user ${user.userId.substring(0, 8)}...`)
      return NextResponse.json(cached)
    }

    const now = new Date()
    const weekAgo = subDays(now, 7)
    const twoWeeksAgo = subDays(now, 14)

    // Fetch all data in parallel
    const [lastEntry, recentMood, previousMood, cbtCount, recentPattern, streak] = await Promise.all([
      prisma.journalEntry.findFirst({
        where: { userId: user.userId },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true }
      }),
      prisma.moodSnapshot.aggregate({
        where: { userId: user.userId, timestamp: { gte: weekAgo } },
        _avg: { moodScore: true }
      }),
      prisma.moodSnapshot.aggregate({
        where: { userId: user.userId, timestamp: { gte: twoWeeksAgo, lt: weekAgo } },
        _avg: { moodScore: true }
      }),
      prisma.therapyExercise.count({
        where: { userId: user.userId, type: 'thought-challenging' }
      }),
      prisma.pattern.findFirst({
        where: { userId: user.userId, confidence: { gte: 0.7 } },
        orderBy: { createdAt: 'desc' },
        select: { description: true }
      }),
      // Get simple streak count
      prisma.journalEntry.findMany({
        where: { userId: user.userId },
        select: { createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 30
      }).then(entries => {
        if (entries.length === 0) return 0
        let streak = 1
        for (let i = 0; i < entries.length - 1; i++) {
          const diff = differenceInDays(entries[i].createdAt, entries[i + 1].createdAt)
          if (diff === 1) streak++
          else break
        }
        return streak
      })
    ])

    const daysSinceLastEntry = lastEntry ? differenceInDays(now, lastEntry.createdAt) : 999
    const moodTrend: 'up' | 'down' | 'stable' =
      recentMood._avg.moodScore && previousMood._avg.moodScore
        ? (recentMood._avg.moodScore - previousMood._avg.moodScore > 0.5 ? 'up' :
           recentMood._avg.moodScore - previousMood._avg.moodScore < -0.5 ? 'down' : 'stable')
        : 'stable'

    // Generate messages
    const messages: CoachMessage[] = []

    const inactivityMsg = checkInactivity(daysSinceLastEntry)
    if (inactivityMsg) messages.push(inactivityMsg)

    const moodMsg = checkMoodTrend(recentMood._avg.moodScore, previousMood._avg.moodScore)
    if (moodMsg) messages.push(moodMsg)

    messages.push(...checkAchievements(cbtCount, streak))

    if (recentPattern && daysSinceLastEntry < 3) {
      // Make pattern message more engaging
      const patternMsg = recentPattern.description.length > 100
        ? recentPattern.description.substring(0, 100) + '...'
        : recentPattern.description
      messages.push({
        id: generateMessageId(),
        type: 'pattern',
        message: `I spotted something interesting: ${patternMsg} Tap to learn more!`,
        priority: 3,
        icon: '✨'
      })
    }

    // Sort by priority (highest first) and take top 3
    messages.sort((a, b) => b.priority - a.priority)
    const topMessages = messages.slice(0, 3)

    const suggestedAction = getSuggestedAction(daysSinceLastEntry, moodTrend, !!recentPattern)

    const response: CoachResponse = {
      messages: topMessages,
      suggestedAction,
      meta: {
        userId: user.userId,
        generatedAt: now.toISOString(),
        cacheHint: 300 // 5 minutes
      }
    }

    // Cache the response
    cacheResponse(user.userId, response)

    const responseTime = Date.now() - startTime
    console.log(`[AI Coach] Generated insights in ${responseTime}ms for user ${user.userId.substring(0, 8)}...`)

    return NextResponse.json(response, {
      headers: {
        'X-Response-Time': String(responseTime),
        'Cache-Control': 'private, max-age=300'
      }
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[AI Coach] Error:', errorMessage)

    return NextResponse.json({
      messages: [],
      suggestedAction: null,
      meta: {
        userId: '',
        generatedAt: new Date().toISOString(),
        cacheHint: 60
      }
    })
  }
}
