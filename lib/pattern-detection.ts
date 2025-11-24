import { prisma } from '@/lib/prisma'
import { openai, GPT_MODEL_STANDARD, GPT_MODEL_FAST } from '@/lib/openai'
import { startOfWeek, subWeeks, format } from 'date-fns'
import { anonymizeText, parseAIJSON } from '@/lib/utils'

interface PatternEvidence {
  dates: string[]
  moodScores: number[]
  sentimentScores: number[]
  activities: string[]
  dayOfWeek?: string
  context: string
}

interface DetectedPattern {
  type: 'temporal' | 'activity' | 'theme' | 'correlation'
  name: string
  description: string
  confidence: number
  evidence: PatternEvidence
  insights: string
  suggestions: string
}

export class PatternDetectionService {
  /**
   * Main entry point: Analyze all patterns for a user using AI
   */
  static async analyzeUserPatterns(userId: string, userProfile: any | null): Promise<DetectedPattern[]> {
    // Gather user data from last 4 weeks
    const userData = await this.gatherUserData(userId, 28)
    
    console.log('[Pattern Detection] User data gathered:', {
      userId,
      entriesCount: userData.entries.length,
      moodsCount: userData.moods.length,
      goalsCount: userData.goals.length,
      dayLogsCount: userData.dayLogs.length
    })
    
    // TESTING MODE: Lowered threshold from 5 to 3 for same-day testing
    if (userData.entries.length < 3) {
      console.log('[Pattern Detection] Not enough entries. Need at least 3, found:', userData.entries.length)
      // Not enough data to detect meaningful patterns
      return []
    }

    // Use OpenAI to detect patterns
    const detectedPatterns = await this.detectPatternsWithAI(userData, userProfile)
    
    console.log('[Pattern Detection] Patterns detected:', detectedPatterns.length)
    
    return detectedPatterns
  }

  /**
   * Gather comprehensive user data for analysis
   */
  private static async gatherUserData(userId: string, days: number) {
    const since = new Date()
    since.setDate(since.getDate() - days)

    console.log('[Pattern Detection] Querying for userId:', userId, 'since:', since)

    // Fetch all relevant data in parallel
    const [journalEntries, moodEntries, goals, dayLogs] = await Promise.all([
      prisma.journalEntry.findMany({
        where: {
          userId,
          createdAt: { gte: since },
        },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          title: true,
          content: true,
          moodRating: true,
          sentiment: true,
          sentimentLabel: true,
          activities: true,
          createdAt: true,
        },
      }),
      prisma.moodEntry.findMany({
        where: {
          userId,
          createdAt: { gte: since },
        },
        orderBy: { createdAt: 'asc' },
        select: {
          moodScore: true,
          triggers: true,
          createdAt: true,
        },
      }),
      prisma.goal.findMany({
        where: {
          userId,
          createdAt: { gte: since },
        },
        select: {
          title: true,
          completed: true,
          createdAt: true,
        },
      }),
      prisma.dayLog.findMany({
        where: {
          userId,
          date: { gte: since },
        },
        orderBy: { date: 'asc' },
        select: {
          date: true,
          morningIntention: true,
          dailyInsight: true,
          suggestedAction: true,
        },
      }),
    ])

    return {
      entries: journalEntries,
      moods: moodEntries,
      goals,
      dayLogs,
    }
  }

  /**
   * Use OpenAI to detect patterns from user data
   */
  private static async detectPatternsWithAI(userData: any, userProfile: any | null): Promise<DetectedPattern[]> {
    try {
      // Prepare data summary for AI
      const dataSummary = this.prepareDataSummary(userData)

      // 1. Determine System Persona
      let systemPrompt = 'You are an expert cognitive behavioral therapist and data analyst specializing in identifying behavioral patterns from journal data.'
      
      if (userProfile) {
        const { PersonalizationService } = await import('@/lib/personalization-service')
        systemPrompt = PersonalizationService.generateSystemPrompt(userProfile)
        // Add specific instruction for pattern detection role
        systemPrompt += '\n\nROLE: You are acting as an expert analyst identifying behavioral patterns. Use the persona above to frame your INSIGHTS and SUGGESTIONS, but remain objective in your detection.'
      }

      const prompt = `Analyze the user's behavioral patterns from their journal entries, mood data, and daily activities.

DATA SUMMARY:
${dataSummary}

IMPORTANT: This may be a limited dataset (possibly same-day entries). Focus on identifying ANY meaningful patterns, even from limited data.

Your task is to identify behavioral patterns. Look for:

1. ACTIVITY CORRELATIONS: Activities that correlate with mood changes
   Example: "Exercise-Mood Link" - exercising correlates with better mood
   (Look for at least 2 occurrences of same activity with mood data)

2. THEME PATTERNS: Emotional or topical themes in journal entries
   Example: "Work Anxiety Theme" - mentions of work-related stress
   (Even 2-3 entries can show a theme if consistent)

3. MOOD VARIANCE: Significant mood changes between entries
   Example: "Mood Volatility Pattern" - fluctuating between high and low moods
   (Look at mood score differences)

4. CORRELATION PATTERNS: Multiple factors that combine to affect mood
   Example: "Activity-Mood Link" - certain activities + mood patterns
   (Look for any correlations, even with minimal data)

REQUIREMENTS:
- Identify patterns even with limited data (2-3 occurrences acceptable for testing)
- For same-day entries, focus on activity correlations and themes rather than temporal patterns
- Calculate confidence scores (0.0-1.0) - lower confidence (0.5-0.7) is OK for limited data
- Provide specific, actionable insights
- Include evidence (dates, mood scores, specific examples)
- Even with limited data, try to find at least 1-2 meaningful patterns if possible

Respond in JSON format with an array of patterns:
{
  "patterns": [
    {
      "type": "temporal|activity|theme|correlation",
      "name": "Short descriptive name (max 40 chars)",
      "description": "Detailed explanation of the pattern (2-3 sentences)",
      "confidence": 0.85,
      "evidence": {
        "dates": ["2024-11-04", "2024-11-11", "2024-11-18"],
        "moodScores": [4, 3, 4],
        "sentimentScores": [-0.3, -0.4, -0.2],
        "activities": ["work", "meetings"],
        "dayOfWeek": "Monday",
        "context": "Brief description of evidence"
      },
      "insights": "Why this pattern matters and what it reveals about user's behavior (2-3 sentences)",
      "suggestions": "Specific, actionable steps to address this pattern (2-3 concrete suggestions)"
    }
  ]
}

Return ONLY valid JSON. Include 2-5 most significant patterns (or empty array if none found).`

      const response = await openai.chat.completions.create({
        model: GPT_MODEL_STANDARD, // Use Standard for better pattern recognition
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3, // Lower temperature for more consistent analysis
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      })

      const result = parseAIJSON<{ patterns: DetectedPattern[] }>(
        response.choices[0].message.content || '', 
        { patterns: [] }
      )
      
      return result.patterns || []
    } catch (error) {
      console.error('Pattern detection error:', error)
      return []
    }
  }

  /**
   * Prepare a concise data summary for AI analysis
   */
  private static prepareDataSummary(userData: any): string {
    const { entries, moods, goals, dayLogs } = userData

    // Group entries by day of week
    const dayOfWeekData: { [key: string]: { moods: number[], count: number } } = {}
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    
    entries.forEach((entry: any) => {
      const dayName = daysOfWeek[entry.createdAt.getDay()]
      if (!dayOfWeekData[dayName]) {
        dayOfWeekData[dayName] = { moods: [], count: 0 }
      }
      dayOfWeekData[dayName].moods.push(entry.moodRating)
      dayOfWeekData[dayName].count++
    })

    // Calculate averages
    const dayOfWeekSummary = Object.entries(dayOfWeekData)
      .map(([day, data]) => {
        const avgMood = data.moods.reduce((a, b) => a + b, 0) / data.moods.length
        return `${day}: ${data.count} entries, avg mood ${avgMood.toFixed(1)}/10`
      })
      .join('\n')

    // Activity frequency
    const activityCounts: { [key: string]: { count: number, totalMood: number } } = {}
    entries.forEach((entry: any) => {
      entry.activities.forEach((activity: string) => {
        if (!activityCounts[activity]) {
          activityCounts[activity] = { count: 0, totalMood: 0 }
        }
        activityCounts[activity].count++
        activityCounts[activity].totalMood += entry.moodRating
      })
    })

    const topActivities = Object.entries(activityCounts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 8)
      .map(([activity, data]) => {
        const avgMood = data.totalMood / data.count
        return `${activity}: ${data.count} times, avg mood ${avgMood.toFixed(1)}/10`
      })
      .join('\n')

    // Recent journal themes (sample entries)
    const recentThemes = entries
      .slice(-10)
      .map((entry: any) => {
        // Anonymize and truncate content for privacy and token limits
        const safeTitle = anonymizeText(entry.title).substring(0, 50)
        return `${format(entry.createdAt, 'MMM dd')}: "${safeTitle}" (mood: ${entry.moodRating}/10, sentiment: ${entry.sentimentLabel || 'neutral'})`
      })
      .join('\n')

    // Overall statistics
    const avgMood = entries.reduce((sum: number, e: any) => sum + e.moodRating, 0) / entries.length
    const avgSentiment = entries
      .filter((e: any) => e.sentiment !== null)
      .reduce((sum: number, e: any) => sum + (e.sentiment || 0), 0) / entries.filter((e: any) => e.sentiment !== null).length

    const summary = `
OVERVIEW:
- Total journal entries: ${entries.length}
- Date range: ${format(entries[0]?.createdAt || new Date(), 'MMM dd')} to ${format(entries[entries.length - 1]?.createdAt || new Date(), 'MMM dd')}
- Average mood: ${avgMood.toFixed(1)}/10
- Average sentiment: ${avgSentiment.toFixed(2)} (-1 to 1 scale)
- Goals set: ${goals.length} (${goals.filter((g: any) => g.completed).length} completed)

DAY OF WEEK PATTERNS:
${dayOfWeekSummary}

ACTIVITY CORRELATIONS:
${topActivities || 'No activities tracked'}

RECENT JOURNAL THEMES (Anonymized):
${recentThemes}

INSIGHTS FROM DAILY LOGS:
${dayLogs.slice(-5).map((log: any) => anonymizeText(log.dailyInsight || '')).filter(Boolean).join('\n') || 'No recent insights'}
`.trim()

    return summary
  }

  /**
   * Save detected patterns to database
   */
  static async savePatterns(userId: string, patterns: DetectedPattern[]) {
    // 1. Archive existing active patterns
    await prisma.pattern.updateMany({
      where: {
        userId,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    })

    // 2. CLEANUP: Delete old inactive patterns (older than 60 days) to prevent "Zombie Data"
    const cleanupDate = new Date()
    cleanupDate.setDate(cleanupDate.getDate() - 60)
    
    // We run this asynchronously and don't wait for it to prevent slowing down the main request
    prisma.pattern.deleteMany({
      where: {
        userId,
        isActive: false,
        createdAt: { lt: cleanupDate }
      }
    }).catch(err => console.error('Pattern cleanup failed:', err))

    // 3. Create new patterns
    const createdPatterns = await Promise.all(
      patterns.map((pattern) =>
        prisma.pattern.create({
          data: {
            userId,
            type: pattern.type,
            name: pattern.name,
            description: pattern.description,
            confidence: pattern.confidence,
            evidence: pattern.evidence as any, // JSON type casting
            insights: pattern.insights,
            suggestions: pattern.suggestions,
            isActive: true,
          },
        })
      )
    )

    return createdPatterns
  }

  /**
   * Get active patterns for a user (for display)
   */
  static async getActivePatterns(userId: string) {
    return await prisma.pattern.findMany({
      where: {
        userId,
        isActive: true,
        dismissed: false,
      },
      orderBy: [
        { confidence: 'desc' },
        { createdAt: 'desc' },
      ],
    })
  }

  /**
   * Dismiss a pattern
   */
  static async dismissPattern(patternId: string, userId: string) {
    return await prisma.pattern.update({
      where: {
        id: patternId,
        userId, // Security: ensure user owns this pattern
      },
      data: {
        dismissed: true,
        dismissedAt: new Date(),
      },
    })
  }

  /**
   * AI-powered smart prompt generation based on patterns
   */
  static async generateSmartPrompt(userId: string, userProfile: any | null): Promise<string | null> {
    try {
      const [activePatterns, todayLog, lastEntry, activeGoals] = await Promise.all([
        this.getActivePatterns(userId),
        this.getTodayLog(userId),
        this.getLastEntry(userId),
        this.getActiveGoals(userId),
      ])

      if (activePatterns.length === 0 && !todayLog?.morningIntention && activeGoals.length === 0) {
        return null // No context to generate smart prompt
      }

      // 1. Determine System Persona
      let systemPrompt = 'You are a warm, supportive life coach who helps people reflect on their experiences.'
      
      if (userProfile) {
        const { PersonalizationService } = await import('@/lib/personalization-service')
        systemPrompt = PersonalizationService.generateSystemPrompt(userProfile)
      }

      const prompt = `Generate ONE concise journaling prompt for today.

CONTEXT:
${activePatterns.length > 0 ? `
Active Behavioral Patterns:
${activePatterns.map((p: { name: string; insights: string }) => `- ${p.name}: ${p.insights}`).join('\n')}
` : ''}

${activeGoals.length > 0 ? `
Active Goals:
${activeGoals.map((g: { title: string; targetDate: Date | null }) => `- ${g.title}${g.targetDate ? ` (Target: ${format(g.targetDate, 'MMM dd, yyyy')})` : ''}`).join('\n')}
` : ''}

${todayLog?.morningIntention ? `Today's Intention: "${todayLog.morningIntention}"` : ''}

${lastEntry ? `Last Journal Entry (${format(lastEntry.createdAt, 'MMM dd')}): "${lastEntry.title}" (mood: ${lastEntry.moodRating}/10)` : ''}

Generate a thoughtful, personalized prompt that:
1. Acknowledges their patterns or intention if mentioned
2. Encourages reflection
3. Is specific and actionable
4. Is 1-2 sentences max
5. Feels conversational, not clinical

Examples:
- "You mentioned wanting to [intention]. What small step could you take today?"
- "We noticed [pattern]. How are you feeling about that today?"
- "Reflect on one thing that brought you joy recently. What made it special?"

Return ONLY the prompt text, nothing else.`

      const response = await openai.chat.completions.create({
        model: GPT_MODEL_FAST,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 100,
      })

      return response.choices[0].message.content?.trim() || null
    } catch (error) {
      console.error('Smart prompt generation error:', error)
      return null
    }
  }

  private static async getTodayLog(userId: string) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return await prisma.dayLog.findUnique({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
    })
  }

  private static async getLastEntry(userId: string) {
    return await prisma.journalEntry.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        title: true,
        moodRating: true,
        createdAt: true,
      },
    })
  }

  private static async getActiveGoals(userId: string) {
    return await prisma.goal.findMany({
      where: {
        userId,
        completed: false,
      },
      orderBy: { targetDate: 'asc' },
      select: {
        title: true,
        targetDate: true,
      },
      take: 5, // Limit to 5 most urgent goals
    })
  }
}
