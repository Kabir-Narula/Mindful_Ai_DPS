import { prisma } from './prisma'
import { subWeeks, subDays } from 'date-fns'
import { anonymizeText } from '@/lib/utils'
import { formatUTCDate } from '@/lib/timezone'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Structured user context for programmatic use
 */
export interface StructuredContext {
  patterns: Array<{ type: string; description: string; confidence: number }>
  cbtExercises: Array<{ originalThought: string; reframedThought: string }>
  moodTrends: {
    currentAvg: number
    previousAvg: number
    change: number
    trend: 'improving' | 'declining' | 'stable'
    volatility: 'low' | 'moderate' | 'high'
  } | null
  topActivities: Array<{ activity: string; improvement: number }>
  weeklyReflection: {
    weekOf: Date
    bestMoment: string | null
    moodTrend: string | null
    avgMood: number | null
  } | null
  profile: {
    ageGroup: string | null
    communicationStyle: string | null
    lifeStage: string | null
    hobbies: string[]
    primaryGoals: string[]
  } | null
  engagement: {
    totalEntries: number
    entriesThisWeek: number
    currentStreak: number
    averageEntryLength: number
  }
}

/**
 * Cache entry for context data
 */
interface ContextCacheEntry {
  structured: StructuredContext
  formatted: string
  timestamp: number
  expiresAt: number
}

// ============================================================================
// CACHING
// ============================================================================

/**
 * In-memory context cache with 10-minute TTL
 * Balances freshness with API efficiency
 */
const CACHE_TTL_MS = 10 * 60 * 1000
const contextCache = new Map<string, ContextCacheEntry>()

/**
 * Get cached context if valid
 */
function getCached(userId: string): ContextCacheEntry | null {
  const entry = contextCache.get(userId)
  if (!entry) return null

  if (Date.now() > entry.expiresAt) {
    contextCache.delete(userId)
    return null
  }

  return entry
}

/**
 * Set context in cache
 */
function setCached(userId: string, structured: StructuredContext, formatted: string): void {
  const now = Date.now()
  contextCache.set(userId, {
    structured,
    formatted,
    timestamp: now,
    expiresAt: now + CACHE_TTL_MS,
  })
}

/**
 * Invalidate context cache for a user
 * Call this when user creates new entries
 */
export function invalidateContextCache(userId: string): void {
  contextCache.delete(userId)
}

/**
 * Clear all cached contexts (maintenance)
 */
export function clearAllContextCaches(): void {
  contextCache.clear()
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate mood volatility from a series of mood scores
 */
function calculateVolatility(scores: number[]): 'low' | 'moderate' | 'high' {
  if (scores.length < 3) return 'low'

  const avg = scores.reduce((a, b) => a + b, 0) / scores.length
  const variance = scores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / scores.length
  const stdDev = Math.sqrt(variance)

  if (stdDev < 1.0) return 'low'
  if (stdDev < 2.0) return 'moderate'
  return 'high'
}

/**
 * Safely truncate and sanitize text for context
 */
function safeSubstring(text: string | null | undefined, maxLength: number): string {
  if (!text) return ''
  const sanitized = anonymizeText(text)
  return sanitized.length > maxLength
    ? sanitized.substring(0, maxLength) + '...'
    : sanitized
}

// ============================================================================
// USER CONTEXT SERVICE
// ============================================================================

export class UserContextService {
  /**
   * Get structured context for programmatic use
   * Returns typed object with all context data
   */
  static async getStructuredContext(userId: string): Promise<StructuredContext> {
    // Check cache first
    const cached = getCached(userId)
    if (cached) {
      console.log(`[UserContextService] Cache hit for user ${userId}`)
      return cached.structured
    }

    console.log(`[UserContextService] Cache miss for user ${userId}, fetching...`)

    const oneWeekAgo = subDays(new Date(), 7)

    // Parallel queries for efficiency
    const [
      patterns,
      cbtExercises,
      latestReflection,
      moodTrends,
      topActivities,
      profile,
      entryStats
    ] = await Promise.all([
      this.getRecentPatterns(userId),
      this.getRecentCBTExercises(userId),
      this.getLatestReflection(userId),
      this.getMoodTrends(userId),
      this.getTopActivities(userId),
      this.getUserProfile(userId),
      this.getEntryStats(userId, oneWeekAgo),
    ])

    const structured: StructuredContext = {
      patterns,
      cbtExercises: cbtExercises.map(ex => ({
        originalThought: ex.originalThought || '',
        reframedThought: ex.reframedThought || '',
      })),
      moodTrends,
      topActivities,
      weeklyReflection: latestReflection ? {
        weekOf: latestReflection.weekOf,
        bestMoment: latestReflection.bestMoment,
        moodTrend: latestReflection.moodTrend,
        avgMood: latestReflection.avgMood,
      } : null,
      profile,
      engagement: entryStats,
    }

    // Generate formatted version and cache both
    const formatted = this.formatContext(structured)
    setCached(userId, structured, formatted)

    return structured
  }

  /**
   * Build comprehensive user context for AI interactions
   * Returns a rich, natural-language summary of user's journey
   * ENHANCED: Includes token budgeting to prevent context window overflow.
   */
  static async buildContext(userId: string): Promise<string> {
    // Check cache for pre-formatted version
    const cached = getCached(userId)
    if (cached) {
      return cached.formatted
    }

    // Get structured context (which caches both versions)
    await this.getStructuredContext(userId)

    // Return the now-cached formatted version
    return getCached(userId)?.formatted ?? ''
  }

  /**
   * Format structured context as AI-friendly string
   */
  private static formatContext(ctx: StructuredContext): string {
    let context = `\n\n=== USER JOURNEY CONTEXT ===\n`

    // Token budget management
    const MAX_CONTEXT_CHARS = 1800

    const appendIfRoom = (text: string) => {
      if (context.length + text.length < MAX_CONTEXT_CHARS) {
        context += text
        return true
      }
      return false
    }

    // Profile (high priority - helps personalization)
    if (ctx.profile) {
      let profileText = `\nUSER PROFILE:\n`
      if (ctx.profile.ageGroup) profileText += `- Age: ${ctx.profile.ageGroup}\n`
      if (ctx.profile.lifeStage) profileText += `- Life stage: ${ctx.profile.lifeStage}\n`
      if (ctx.profile.communicationStyle) profileText += `- Style: ${ctx.profile.communicationStyle}\n`
      if (ctx.profile.hobbies.length > 0) {
        profileText += `- Interests: ${ctx.profile.hobbies.slice(0, 3).join(', ')}\n`
      }
      appendIfRoom(profileText)
    }

    // Engagement metrics (useful context)
    if (ctx.engagement.totalEntries > 0) {
      let engageText = `\nENGAGEMENT:\n`
      engageText += `- Total entries: ${ctx.engagement.totalEntries}\n`
      engageText += `- This week: ${ctx.engagement.entriesThisWeek} entries\n`
      if (ctx.engagement.currentStreak > 0) {
        engageText += `- Current streak: ${ctx.engagement.currentStreak} days\n`
      }
      appendIfRoom(engageText)
    }

    // Mood Trends (high value, low tokens)
    if (ctx.moodTrends) {
      let moodText = `\nMOOD TRENDS (Last 2 weeks):\n`
      moodText += `- Current avg: ${ctx.moodTrends.currentAvg.toFixed(1)}/10\n`
      moodText += `- Change: ${ctx.moodTrends.change > 0 ? '+' : ''}${ctx.moodTrends.change.toFixed(1)} (${ctx.moodTrends.trend})\n`
      moodText += `- Stability: ${ctx.moodTrends.volatility}\n`
      appendIfRoom(moodText)
    }

    // Recent Patterns
    if (ctx.patterns.length > 0) {
      let patternText = `\nDETECTED PATTERNS:\n`
      ctx.patterns.forEach(p => {
        patternText += `- ${p.type}: "${safeSubstring(p.description, 80)}" (${p.confidence})\n`
      })
      appendIfRoom(patternText)
    }

    // CBT Exercises (shows therapeutic progress)
    if (ctx.cbtExercises.length > 0) {
      let cbtText = `\nCBT PROGRESS:\n`
      ctx.cbtExercises.slice(0, 2).forEach(ex => {
        cbtText += `- "${safeSubstring(ex.originalThought, 40)}" → "${safeSubstring(ex.reframedThought, 40)}"\n`
      })
      appendIfRoom(cbtText)
    }

    // Latest Reflection
    if (ctx.weeklyReflection) {
      let reflectionText = `\nWEEKLY REFLECTION (${formatUTCDate(ctx.weeklyReflection.weekOf, 'MMM d')}):\n`
      if (ctx.weeklyReflection.bestMoment) {
        reflectionText += `- Highlight: ${safeSubstring(ctx.weeklyReflection.bestMoment, 60)}\n`
      }
      if (ctx.weeklyReflection.moodTrend) {
        reflectionText += `- Trend: ${ctx.weeklyReflection.moodTrend}\n`
      }
      appendIfRoom(reflectionText)
    }

    // What Works
    if (ctx.topActivities.length > 0) {
      let activityText = `\nWHAT WORKS:\n`
      ctx.topActivities.slice(0, 3).forEach(a => {
        activityText += `- ${a.activity}: +${a.improvement.toFixed(1)} mood\n`
      })
      appendIfRoom(activityText)
    }

    context += `\n=== END CONTEXT ===\n`

    return context
  }

  /**
   * Get quick summary for lightweight AI calls
   */
  static async getQuickSummary(userId: string): Promise<string> {
    const ctx = await this.getStructuredContext(userId)

    let summary = ''

    if (ctx.profile?.ageGroup) {
      summary += `Age: ${ctx.profile.ageGroup}. `
    }

    if (ctx.moodTrends) {
      summary += `Mood: ${ctx.moodTrends.currentAvg.toFixed(0)}/10, ${ctx.moodTrends.trend}. `
    }

    if (ctx.profile?.communicationStyle) {
      summary += `Style: ${ctx.profile.communicationStyle}. `
    }

    return summary || 'New user.'
  }

  // ============================================================================
  // DATA FETCHING METHODS
  // ============================================================================

  private static async getUserProfile(userId: string) {
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      select: {
        ageGroup: true,
        communicationStyle: true,
        lifeStage: true,
        hobbies: true,
        primaryGoals: true,
      }
    })

    return profile ? {
      ageGroup: profile.ageGroup,
      communicationStyle: profile.communicationStyle,
      lifeStage: profile.lifeStage,
      hobbies: profile.hobbies ?? [],
      primaryGoals: profile.primaryGoals ?? [],
    } : null
  }

  private static async getEntryStats(userId: string, since: Date) {
    const [totalCount, weekCount, avgLength, streak] = await Promise.all([
      prisma.journalEntry.count({ where: { userId } }),
      prisma.journalEntry.count({ where: { userId, createdAt: { gte: since } } }),
      // Get average content length manually since Prisma doesn't support string length avg
      (async () => {
        const entries = await prisma.journalEntry.findMany({
          where: { userId },
          select: { content: true },
          take: 20,
          orderBy: { createdAt: 'desc' }
        })
        if (entries.length === 0) return 0
        return entries.reduce((sum, e) => sum + e.content.length, 0) / entries.length
      })(),
      // Get current streak (simplified calculation)
      this.getSimpleStreak(userId),
    ])

    return {
      totalEntries: totalCount,
      entriesThisWeek: weekCount,
      currentStreak: streak,
      averageEntryLength: Math.round(avgLength),
    }
  }

  private static async getSimpleStreak(userId: string): Promise<number> {
    // Simple streak check - just count consecutive days
    const entries = await prisma.journalEntry.findMany({
      where: { userId },
      select: { createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 30,
    })

    if (entries.length === 0) return 0

    // Get unique dates
    const dates = [...new Set(entries.map(e =>
      e.createdAt.toISOString().split('T')[0]
    ))].sort().reverse()

    // Count consecutive days from today
    let streak = 0
    const today = new Date().toISOString().split('T')[0]
    const yesterday = subDays(new Date(), 1).toISOString().split('T')[0]

    // Check if most recent entry is today or yesterday
    if (dates[0] !== today && dates[0] !== yesterday) {
      return 0 // Streak broken
    }

    for (let i = 0; i < dates.length - 1; i++) {
      const current = new Date(dates[i])
      const next = new Date(dates[i + 1])
      const diffDays = Math.round((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24))

      if (diffDays === 1) {
        streak++
      } else {
        break
      }
    }

    return streak + 1 // Include first day
  }

  private static async getRecentPatterns(userId: string) {
    return await prisma.pattern.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 2, // Reduced from 3
      select: {
        type: true,
        description: true,
        confidence: true
      }
    })
  }

  private static async getRecentCBTExercises(userId: string) {
    return await prisma.therapyExercise.findMany({
      where: { userId, type: 'thought-challenging' },
      orderBy: { createdAt: 'desc' },
      take: 2, // Reduced from 3
      select: {
        originalThought: true,
        reframedThought: true
      }
    })
  }

  private static async getLatestReflection(userId: string) {
    return await prisma.weeklyReflection.findFirst({
      where: { userId },
      orderBy: { weekOf: 'desc' }
    })
  }

  private static async getMoodTrends(userId: string): Promise<StructuredContext['moodTrends']> {
    const twoWeeksAgo = subWeeks(new Date(), 2)
    const oneWeekAgo = subWeeks(new Date(), 1)

    const [current, previous, recentMoods] = await Promise.all([
      prisma.moodSnapshot.aggregate({
        where: {
          userId,
          timestamp: { gte: oneWeekAgo }
        },
        _avg: { moodScore: true }
      }),
      prisma.moodSnapshot.aggregate({
        where: {
          userId,
          timestamp: { gte: twoWeeksAgo, lt: oneWeekAgo }
        },
        _avg: { moodScore: true }
      }),
      // Get raw scores for volatility calculation
      prisma.moodSnapshot.findMany({
        where: {
          userId,
          timestamp: { gte: oneWeekAgo }
        },
        select: { moodScore: true },
        take: 30
      })
    ])

    const currentAvg = current._avg.moodScore || 0
    const previousAvg = previous._avg.moodScore || 0
    const change = currentAvg - previousAvg

    // Calculate volatility from recent moods
    const moodScores = recentMoods.map(m => m.moodScore)
    const volatility = calculateVolatility(moodScores)

    const trend = change > 0.3 ? 'improving' : change < -0.3 ? 'declining' : 'stable'

    return {
      currentAvg,
      previousAvg,
      change,
      trend: trend as 'improving' | 'declining' | 'stable',
      volatility,
    }
  }

  private static async getTopActivities(userId: string) {
    const snapshots = await prisma.moodSnapshot.findMany({
      where: {
        userId,
        type: 'post-activity',
        improvement: { not: null }
      },
      orderBy: { timestamp: 'desc' },
      take: 20,
      select: {
        activityType: true,
        improvement: true
      }
    })

    // Group by activity and calculate avg improvement
    const activityMap: { [key: string]: number[] } = {}
    snapshots.forEach(s => {
      if (s.activityType && s.improvement) {
        if (!activityMap[s.activityType]) activityMap[s.activityType] = []
        activityMap[s.activityType].push(s.improvement)
      }
    })

    return Object.entries(activityMap)
      .map(([activity, improvements]) => ({
        activity,
        improvement: improvements.reduce((a, b) => a + b, 0) / improvements.length
      }))
      .sort((a, b) => b.improvement - a.improvement)
      .slice(0, 3)
  }
}
