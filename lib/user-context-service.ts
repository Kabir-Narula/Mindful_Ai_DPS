import { prisma } from './prisma'
import { format, subWeeks } from 'date-fns'
import { anonymizeText } from '@/lib/utils'

export class UserContextService {
  /**
   * Build comprehensive user context for AI interactions
   * Returns a rich, natural-language summary of user's journey
   * ENHANCED: Includes token budgeting to prevent context window overflow.
   */
  static async buildContext(userId: string): Promise<string> {
    // Fetch data... (Reduced take limits to save tokens)
    const [patterns, cbtExercises, latestReflection, moodTrends, topActivities] = await Promise.all([
      this.getRecentPatterns(userId), // Takes 2 (was 3)
      this.getRecentCBTExercises(userId), // Takes 2 (was 3)
      this.getLatestReflection(userId),
      this.getMoodTrends(userId),
      this.getTopActivities(userId)
    ])

    let context = `\n\n=== USER JOURNEY CONTEXT ===\n`

    // Helper to safely append text within a soft budget
    // (We aim for ~1500 characters max for context to leave room for conversation)
    const MAX_CONTEXT_CHARS = 1500
    
    const appendIfRoom = (text: string) => {
      if (context.length + text.length < MAX_CONTEXT_CHARS) {
        context += text
      }
    }

    // Recent Patterns
    if (patterns.length > 0) {
      let patternText = `\nDETECTED PATTERNS:\n`
      patterns.forEach(p => {
        patternText += `- ${p.type}: "${anonymizeText(p.description).substring(0, 100)}..." (Confidence: ${p.confidence})\n`
      })
      appendIfRoom(patternText)
    }

    // CBT Exercises
    if (cbtExercises.length > 0) {
      let cbtText = `\nCOMPLETED CBT EXERCISES:\n`
      cbtExercises.forEach(ex => {
        cbtText += `- Challenged thought: "${anonymizeText(ex.originalThought || '').substring(0, 50)}..." → "${anonymizeText(ex.reframedThought || '').substring(0, 50)}..."\n`
      })
      appendIfRoom(cbtText)
    }

    // Latest Reflection
    if (latestReflection) {
      let reflectionText = `\nLATEST WEEKLY REFLECTION (${format(latestReflection.weekOf, 'MMM d')}):\n`
      reflectionText += `- Best moment: ${anonymizeText(latestReflection.bestMoment || '').substring(0, 80)}...\n`
      // Only add if we have plenty of room
      if (context.length < 800) {
         reflectionText += `- Mood trend: ${latestReflection.moodTrend} (Avg: ${latestReflection.avgMood?.toFixed(1)})\n`
      }
      appendIfRoom(reflectionText)
    }

    // Mood Trends (High value, low tokens, prioritize this)
    if (moodTrends) {
      let moodText = `\nMOOD TRENDS (Last 2 weeks):\n`
      moodText += `- Change: ${moodTrends.change > 0 ? '+' : ''}${moodTrends.change.toFixed(1)} (${moodTrends.trend})\n`
      appendIfRoom(moodText)
    }

    // What Works
    if (topActivities.length > 0) {
      let activityText = `\nWHAT WORKS FOR THIS USER:\n`
      topActivities.forEach(a => {
        activityText += `- ${a.activity}: +${a.improvement.toFixed(1)} mood\n`
      })
      appendIfRoom(activityText)
    }

    context += `\n=== END CONTEXT ===\n`
    
    return context
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

  private static async getMoodTrends(userId: string) {
    const twoWeeksAgo = subWeeks(new Date(), 2)
    const oneWeekAgo = subWeeks(new Date(), 1)

    const [current, previous] = await Promise.all([
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
      })
    ])

    const currentAvg = current._avg.moodScore || 0
    const previousAvg = previous._avg.moodScore || 0
    const change = currentAvg - previousAvg

    return {
      currentAvg,
      previousAvg,
      change,
      trend: change > 0.3 ? 'improving' : change < -0.3 ? 'declining' : 'stable'
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
