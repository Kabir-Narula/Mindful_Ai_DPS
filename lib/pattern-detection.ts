import { prisma } from '@/lib/prisma'
import { openai, GPT_MODEL_STANDARD, GPT_MODEL_FAST } from '@/lib/openai'
import { subDays } from 'date-fns'
import { anonymizeText, parseAIJSON } from '@/lib/utils'
import { getTodayInTimezone, formatInToronto } from '@/lib/timezone'

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
    // Use Toronto timezone for consistent date boundaries
    const since = subDays(new Date(), days)

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
   * Redesigned for friendly, actionable insights
   */
  private static async detectPatternsWithAI(userData: any, userProfile: any | null): Promise<DetectedPattern[]> {
    try {
      // Prepare data summary for AI
      const dataSummary = this.prepareDataSummary(userData)

      // Warm, friendly system prompt
      const systemPrompt = `You are a supportive friend who's great at spotting patterns in someone's life.
You communicate discoveries with excitement and warmth, like telling a friend "Hey, I noticed something cool!"
You focus on patterns that are actually useful and actionable.
You never sound clinical or like a robot - you sound like a real person who genuinely cares.`

      const prompt = `Look through this person's journal data and find patterns that could actually help them feel better.

THEIR DATA:
${dataSummary}

FIND PATTERNS THAT ARE:
1. 🏃 ACTIVITY PATTERNS: "On days you [did X], your mood was [Y] points higher!"
2. 📅 TIME PATTERNS: "Your [day of week] tend to be [higher/lower] - here's what might help"
3. 💭 THEME PATTERNS: "I notice [topic] comes up a lot - let's explore that"
4. 🔗 CONNECTIONS: "When [A] happens, [B] tends to follow"

MAKE THEM EXCITING & USEFUL:
- BAD: "Correlation detected between exercise and mood improvement"
- GOOD: "Here's something cool: on days you exercised, your mood was 2.3 points higher! 🎯"

- BAD: "Weekly pattern: lower mood on Mondays"
- GOOD: "Mondays seem rough (avg 5.2) - but Tuesdays bounce back (avg 7.1). What if we made Monday mornings easier?"

Respond in JSON:
{
  "patterns": [
    {
      "type": "activity|temporal|theme|correlation",
      "name": "Short, catchy name with emoji (max 40 chars). Example: '🏃 Exercise = Better Days!'",
      "description": "What you found, in plain language. Use actual numbers. Sound excited! (2 sentences max)",
      "confidence": 0.85,
      "evidence": {
        "dates": ["2024-11-04"],
        "moodScores": [7, 8],
        "sentimentScores": [0.5],
        "activities": ["walking"],
        "dayOfWeek": "Monday",
        "context": "Brief evidence summary"
      },
      "insights": "Why this matters for THEM. What their data is telling them. Be specific! (1-2 sentences)",
      "suggestions": "ONE specific thing to try this week. Make it so concrete they can picture doing it. Example: 'Try a 10-min walk before breakfast on 2 mornings this week.'"
    }
  ]
}

RULES:
- Use real numbers from their data
- Sound like an excited friend sharing a discovery
- Make each "suggestions" so specific they can do it tomorrow
- Max 3 patterns - only the most useful ones
- If there's not enough data, return fewer patterns (that's okay!)`

      const response = await openai.chat.completions.create({
        model: GPT_MODEL_STANDARD,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 1500,
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
        return `${formatInToronto(entry.createdAt, 'MMM dd')}: "${safeTitle}" (mood: ${entry.moodRating}/10, sentiment: ${entry.sentimentLabel || 'neutral'})`
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
- Date range: ${formatInToronto(entries[0]?.createdAt || new Date(), 'MMM dd')} to ${formatInToronto(entries[entries.length - 1]?.createdAt || new Date(), 'MMM dd')}
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
   * Redesigned for warm, conversational prompts
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

      const systemPrompt = `You're a supportive friend helping someone reflect on their day.
You sound warm and casual, like texting a close friend.
You ask questions that make people think, not just "how was your day?"
Keep it short - one question that gets right to the point.`

      const prompt = `Create ONE journaling prompt for this person. Make it specific to them!

WHAT WE KNOW:
${activePatterns.length > 0 ? `Patterns we've noticed: ${activePatterns.map((p: { name: string }) => p.name).join(', ')}` : ''}
${todayLog?.morningIntention ? `Their intention today: "${todayLog.morningIntention}"` : ''}
${lastEntry ? `Last entry: "${lastEntry.title}" (mood: ${lastEntry.moodRating}/10)` : ''}
${activeGoals.length > 0 ? `Goals they're working on: ${activeGoals.map((g: { title: string }) => g.title).join(', ')}` : ''}

GENERATE A PROMPT THAT:
- References something specific to THEM (their intention, pattern, or last entry)
- Asks something they can answer in 2-3 sentences
- Sounds like a friend checking in, not an app

EXAMPLES:
- "You said you wanted to focus on [intention] today - how's that going so far?"
- "Your mood was a [X] last time - what's shifted since then?"
- "We noticed [pattern]. Did you experience that today?"
- "What's one thing that surprised you today?"

Return ONLY the prompt (1-2 sentences max). No quotes, no intro, just the prompt.`

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
    // Use Toronto timezone for consistent date handling
    const today = getTodayInTimezone()

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
