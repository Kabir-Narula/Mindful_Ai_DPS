/**
 * InsightService - Human-Friendly AI Insight Generation
 * 
 * This service generates insights that are:
 * - ACTIONABLE: Give specific, practical takeaways
 * - PERSONALIZED: Based on actual user data patterns
 * - SIMPLE: Written in plain, conversational language
 * - RELEVANT: Focus on what users care about
 * - ENCOURAGING: Supportive and motivating tone
 */

import { openai, GPT_MODEL_FAST, withRetry } from './openai'
import { parseAIJSON } from './utils'

// ============================================================================
// TYPES
// ============================================================================

export interface JournalInsight {
  feedback: string      // 1-2 sentences, warm and encouraging
  observation: string   // What pattern or theme was noticed
  nextStep: string      // One concrete action they can take
  moodContext: string   // Brief context about their mood trend
}

export interface PatternInsight {
  title: string         // Short, friendly title (e.g., "Exercise Boosts Your Mood!")
  discovery: string     // What we found, in plain language
  whyItMatters: string  // Why this is meaningful for them
  tryThis: string       // One specific thing to try
  encouragement: string // Supportive closing thought
}

export interface DailyInsight {
  greeting: string      // Personalized greeting based on time/mood
  reflection: string    // What today's data shows
  suggestion: string    // What they might try tomorrow
}

// ============================================================================
// PROMPT TEMPLATES - Designed for warm, conversational output
// ============================================================================

const INSIGHT_PERSONA = `You are a warm, supportive friend who happens to be great at noticing patterns. 
You speak casually and encouragingly, like texting a close friend - never clinical or robotic.
You focus on the positive and gently suggest improvements without being preachy.
Keep everything SHORT and SPECIFIC. No generic advice.`

/**
 * Generate insight for a journal entry
 */
export async function generateJournalInsight(
  content: string,
  title: string,
  moodRating: number,
  activities: string[],
  recentMoodAvg: number | null,
  userName?: string
): Promise<JournalInsight> {
  const moodTrend = recentMoodAvg 
    ? (moodRating > recentMoodAvg + 0.5 ? 'up from usual' : 
       moodRating < recentMoodAvg - 0.5 ? 'lower than usual' : 'about average')
    : 'unknown'

  const prompt = `You're responding to someone's journal entry. Be warm and specific to THEIR content.

THEIR ENTRY:
Title: "${title}"
Content: "${content.substring(0, 500)}"
Mood: ${moodRating}/10 (${moodTrend})
${activities.length > 0 ? `Activities: ${activities.join(', ')}` : ''}
${userName ? `Their name: ${userName}` : ''}

Respond in JSON:
{
  "feedback": "1-2 sentences acknowledging what they shared. Be specific to their content, not generic. Reference something they actually wrote.",
  "observation": "One thing you noticed about their mood/thinking. Be specific! Example: 'You mentioned feeling energized after your walk' NOT 'Exercise affects mood'",
  "nextStep": "One tiny, specific action for tomorrow. Example: 'Try that 10-min walk again before noon' NOT 'Keep exercising'",
  "moodContext": "Brief, encouraging note about their mood. Example: 'Today's a 7 - that's higher than your usual!' or 'A 5 is totally okay - some days are just like that.'"
}

RULES:
- Reference SPECIFIC things from their entry
- Keep each field under 25 words
- Sound like a friend texting, not a therapist
- NO generic advice like "keep journaling" or "take care of yourself"
- If mood is low, be extra gentle and validating`

  try {
    const response = await withRetry(
      () => openai.chat.completions.create({
        model: GPT_MODEL_FAST,
        messages: [
          { role: 'system', content: INSIGHT_PERSONA },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 300,
        response_format: { type: 'json_object' }
      }),
      'Journal insight generation'
    )

    return parseAIJSON<JournalInsight>(
      response.choices[0].message.content || '{}',
      {
        feedback: "Thanks for sharing today. Your thoughts matter.",
        observation: "I noticed you took time to reflect - that's valuable.",
        nextStep: "Tomorrow, try writing for just 2 minutes when you wake up.",
        moodContext: `You rated today a ${moodRating} - every day is different.`
      }
    )
  } catch (error) {
    console.error('[InsightService] Journal insight error:', error)
    return {
      feedback: "Thanks for sharing today. Your thoughts matter.",
      observation: "I noticed you took time to reflect - that's valuable.",
      nextStep: "Tomorrow, try writing for just 2 minutes when you wake up.",
      moodContext: `You rated today a ${moodRating} - every day is different.`
    }
  }
}

/**
 * Generate pattern insight - what we found and why it matters
 */
export async function generatePatternInsight(
  patternType: string,
  patternData: {
    activities: string[]
    moodScores: number[]
    dayOfWeek?: string
    frequency: number
    avgMoodWith: number
    avgMoodWithout: number
  },
  userName?: string
): Promise<PatternInsight> {
  const moodDiff = patternData.avgMoodWith - patternData.avgMoodWithout

  const prompt = `Generate a friendly insight about a pattern we found in someone's data.

PATTERN DATA:
Type: ${patternType}
${patternData.activities.length > 0 ? `Activities involved: ${patternData.activities.join(', ')}` : ''}
${patternData.dayOfWeek ? `Day pattern: ${patternData.dayOfWeek}` : ''}
Times observed: ${patternData.frequency}
Mood when this happens: ${patternData.avgMoodWith.toFixed(1)}/10
Mood otherwise: ${patternData.avgMoodWithout.toFixed(1)}/10
Mood difference: ${moodDiff > 0 ? '+' : ''}${moodDiff.toFixed(1)} points
${userName ? `User's name: ${userName}` : ''}

Respond in JSON:
{
  "title": "Short, catchy title with emoji. Example: '🏃 Movement = Better Mood!' or '📅 Mondays Hit Different'",
  "discovery": "What we found, in plain language. Example: 'On the 4 days you went for walks, your mood averaged 7.2 - that's 2 points higher than days without!'",
  "whyItMatters": "Why this matters for THEM specifically. Example: 'Your body is telling you something - even short walks shift your whole day.'",
  "tryThis": "One specific action. Example: 'This week, try a 10-minute walk on 2 mornings and see what happens.'",
  "encouragement": "Supportive closing. Example: 'You're already doing something right - this just makes it visible!'"
}

RULES:
- Use actual numbers from their data
- Be specific, not generic
- Sound excited about their discovery
- Keep each field under 30 words
- Make "tryThis" very concrete and doable`

  try {
    const response = await withRetry(
      () => openai.chat.completions.create({
        model: GPT_MODEL_FAST,
        messages: [
          { role: 'system', content: INSIGHT_PERSONA },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 400,
        response_format: { type: 'json_object' }
      }),
      'Pattern insight generation'
    )

    return parseAIJSON<PatternInsight>(
      response.choices[0].message.content || '{}',
      {
        title: "🔍 Pattern Found",
        discovery: "We noticed something interesting in your data.",
        whyItMatters: "Understanding your patterns helps you feel better.",
        tryThis: "Pay attention to what activities affect your mood this week.",
        encouragement: "You're building self-awareness - that's huge!"
      }
    )
  } catch (error) {
    console.error('[InsightService] Pattern insight error:', error)
    return {
      title: "🔍 Pattern Found",
      discovery: "We noticed something interesting in your data.",
      whyItMatters: "Understanding your patterns helps you feel better.",
      tryThis: "Pay attention to what activities affect your mood this week.",
      encouragement: "You're building self-awareness - that's huge!"
    }
  }
}

/**
 * Generate daily summary insight
 */
export async function generateDailyInsight(
  entriesCount: number,
  avgMood: number,
  activities: string[],
  morningIntention?: string,
  timeOfDay: 'morning' | 'afternoon' | 'evening' = 'evening',
  userName?: string
): Promise<DailyInsight> {
  const prompt = `Generate a brief daily insight for someone's journaling practice.

TODAY'S DATA:
Time: ${timeOfDay}
Entries today: ${entriesCount}
Average mood: ${avgMood.toFixed(1)}/10
Activities: ${activities.length > 0 ? activities.join(', ') : 'none tracked'}
${morningIntention ? `Their morning intention was: "${morningIntention}"` : ''}
${userName ? `Their name: ${userName}` : ''}

Respond in JSON:
{
  "greeting": "Brief, time-appropriate greeting. Example: 'Wrapping up the day!' or 'Hey there 👋'",
  "reflection": "What today showed. Example: 'You checked in ${entriesCount} times with an average mood of ${avgMood.toFixed(1)} - pretty solid day!' ${morningIntention ? `Reference their intention if relevant.` : ''}",
  "suggestion": "One thing for tomorrow. Example: 'Tomorrow, try checking in once before lunch.' Be specific!"
}

RULES:
- Keep it SHORT - each field under 20 words
- Reference their actual data
- Be encouraging regardless of mood
- Sound like a friend, not an app`

  try {
    const response = await withRetry(
      () => openai.chat.completions.create({
        model: GPT_MODEL_FAST,
        messages: [
          { role: 'system', content: INSIGHT_PERSONA },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 200,
        response_format: { type: 'json_object' }
      }),
      'Daily insight generation'
    )

    return parseAIJSON<DailyInsight>(
      response.choices[0].message.content || '{}',
      {
        greeting: timeOfDay === 'evening' ? 'Wrapping up the day!' : 'Hey there 👋',
        reflection: `You made ${entriesCount} ${entriesCount === 1 ? 'entry' : 'entries'} today. Every bit of reflection counts.`,
        suggestion: 'Tomorrow, try a quick check-in when you wake up.'
      }
    )
  } catch (error) {
    console.error('[InsightService] Daily insight error:', error)
    return {
      greeting: timeOfDay === 'evening' ? 'Wrapping up the day!' : 'Hey there 👋',
      reflection: `You made ${entriesCount} ${entriesCount === 1 ? 'entry' : 'entries'} today. Every bit of reflection counts.`,
      suggestion: 'Tomorrow, try a quick check-in when you wake up.'
    }
  }
}

// ============================================================================
// COACH MESSAGES - Proactive, friendly nudges
// ============================================================================

export interface CoachMessage {
  message: string
  type: 'encouragement' | 'insight' | 'nudge' | 'celebration'
  emoji: string
}

/**
 * Generate proactive coach messages based on user data
 */
export function generateCoachMessages(data: {
  daysSinceEntry: number
  recentMoodAvg: number | null
  previousMoodAvg: number | null
  streakDays: number
  cbtExercisesCount: number
  hasPatterns: boolean
  patternDescription?: string
  userName?: string
}): CoachMessage[] {
  const messages: CoachMessage[] = []
  const name = data.userName || ''
  const greeting = name ? `${name}, ` : ''

  // Inactivity messages - warm, not guilt-inducing
  if (data.daysSinceEntry >= 3 && data.daysSinceEntry < 7) {
    messages.push({
      message: `${greeting}it's been a few days! Even a one-sentence check-in counts. How are you really doing?`,
      type: 'nudge',
      emoji: '👋'
    })
  } else if (data.daysSinceEntry >= 7 && data.daysSinceEntry < 14) {
    messages.push({
      message: `${greeting}a week has flown by! No pressure - whenever you're ready to chat, I'm here.`,
      type: 'nudge',
      emoji: '💙'
    })
  } else if (data.daysSinceEntry >= 14) {
    messages.push({
      message: `Welcome back${name ? `, ${name}` : ''}! Life gets busy. The fact that you're here now is what matters.`,
      type: 'encouragement',
      emoji: '🌟'
    })
  }

  // Mood trend messages - specific and helpful
  if (data.recentMoodAvg !== null && data.previousMoodAvg !== null) {
    const diff = data.recentMoodAvg - data.previousMoodAvg

    if (diff > 0.5) {
      messages.push({
        message: `Your mood's been trending up lately (${data.previousMoodAvg.toFixed(1)} → ${data.recentMoodAvg.toFixed(1)})! Something's working - any idea what it is?`,
        type: 'insight',
        emoji: '📈'
      })
    } else if (diff < -0.5) {
      messages.push({
        message: `I notice things have felt heavier this week (mood dipped to ${data.recentMoodAvg.toFixed(1)}). Want to try a quick thought challenge? Sometimes it helps.`,
        type: 'nudge',
        emoji: '💭'
      })
    }
  }

  // Streak celebrations - specific milestones
  if (data.streakDays === 3) {
    messages.push({
      message: `3 days in a row! You're building something here. Keep it going!`,
      type: 'celebration',
      emoji: '🔥'
    })
  } else if (data.streakDays === 7) {
    messages.push({
      message: `A whole week of showing up for yourself! That takes real commitment.`,
      type: 'celebration',
      emoji: '🎯'
    })
  } else if (data.streakDays === 14) {
    messages.push({
      message: `Two weeks strong! This is becoming a real habit. Your future self will thank you.`,
      type: 'celebration',
      emoji: '⭐'
    })
  } else if (data.streakDays === 30) {
    messages.push({
      message: `30 DAYS! You've officially built a sustainable practice. This is huge.`,
      type: 'celebration',
      emoji: '🏆'
    })
  }

  // CBT progress
  if (data.cbtExercisesCount === 1) {
    messages.push({
      message: `You did your first thought challenge! That's literally rewiring your brain. How did it feel?`,
      type: 'celebration',
      emoji: '🧠'
    })
  } else if (data.cbtExercisesCount === 5) {
    messages.push({
      message: `5 thought challenges done! You're getting really good at catching those tricky thoughts.`,
      type: 'celebration',
      emoji: '💪'
    })
  }

  // Pattern insights - specific and actionable
  if (data.hasPatterns && data.patternDescription && data.daysSinceEntry < 3) {
    messages.push({
      message: `I spotted something: ${data.patternDescription} Tap to see what your data reveals!`,
      type: 'insight',
      emoji: '🔍'
    })
  }

  return messages
}

