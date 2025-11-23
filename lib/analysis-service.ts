import { prisma } from '@/lib/prisma'
import OpenAI from 'openai'
import { PatternDetectionService } from '@/lib/pattern-detection'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Enhanced AI analysis for extracting insights and actions
async function generateAIAnalysis(content: string, title: string, activities: string[]) {
  try {
    const prompt = `You are a compassionate life coach analyzing a user's journal entry.

Journal Title: "${title}"
Activities: ${activities.join(', ') || 'None'}
Content: "${content}"

Extract 2 things:
1. INSIGHT: One behavioral pattern, cognitive distortion, or observation about their emotional state (max 1 sentence, 20 words)
2. ACTION: One tiny, specific, actionable micro-challenge for tomorrow (max 1 sentence, 15 words)

Examples of good outputs:
- Insight: "You often take responsibility for things outside your control."
  Action: "Tomorrow, delegate one small task before noon."

- Insight: "You're celebrating wins but not acknowledging the effort behind them."
  Action: "Write down one thing you did well and why it mattered."

- Insight: "You tend to catastrophize when facing uncertainty."
  Action: "List one worst-case scenario and one best-case scenario for tomorrow."

Respond ONLY in JSON format:
{
  "sentiment": <number between -1 and 1>,
  "sentimentLabel": "<positive|neutral|negative>",
  "feedback": "<encouraging, personalized response in 1-2 sentences>",
  "insight": "<the insight>",
  "action": "<the micro-challenge>"
}`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a professional life coach specializing in cognitive behavioral therapy and positive psychology. You help users identify patterns and suggest small, actionable steps.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 300,
      response_format: { type: 'json_object' },
    })

    const result = JSON.parse(response.choices[0].message.content || '{}')
    
    return {
      sentiment: result.sentiment || 0,
      sentimentLabel: result.sentimentLabel || 'neutral',
      feedback: result.feedback || 'Thank you for sharing your thoughts.',
      insight: result.insight || 'Keep reflecting on your experiences.',
      action: result.action || 'Take one small step toward your goals tomorrow.',
    }
  } catch (error) {
    console.error('AI Analysis error:', error)
    // Fallback to basic analysis
    return {
      sentiment: 0,
      sentimentLabel: 'neutral',
      feedback: 'Thank you for sharing your thoughts. Keep journaling to track your journey.',
      insight: 'Regular reflection helps build self-awareness.',
      action: 'Continue journaling about your experiences.',
    }
  }
}

export class AnalysisService {
  static async analyzeEntry(entryId: string) {
    const entry = await prisma.journalEntry.findUnique({
      where: { id: entryId },
      include: { user: true }
    })

    if (!entry) throw new Error('Entry not found')

    // 1. Generate AI Analysis
    const analysis = await generateAIAnalysis(entry.content, entry.title, entry.activities)

    // 2. Update Journal Entry
    await prisma.journalEntry.update({
      where: { id: entryId },
      data: {
        sentiment: analysis.sentiment,
        sentimentLabel: analysis.sentimentLabel,
        feedback: analysis.feedback,
      }
    })

    // 3. Update or Create DayLog
    const date = new Date(entry.createdAt)
    date.setHours(0, 0, 0, 0)

    await prisma.dayLog.upsert({
      where: {
        userId_date: {
          userId: entry.userId,
          date: date
        }
      },
      create: {
        userId: entry.userId,
        date: date,
        dailyInsight: analysis.insight,
        suggestedAction: analysis.action
      },
      update: {
        dailyInsight: analysis.insight,
        suggestedAction: analysis.action
      }
    })

    // 4. Trigger pattern detection periodically (every 5th entry or if user has 10+ entries)
    const totalEntries = await prisma.journalEntry.count({
      where: { userId: entry.userId }
    })

    // Run pattern detection if user has enough data and it's time for refresh
    if (totalEntries >= 5 && totalEntries % 5 === 0) {
      // Run in background (don't await - let it complete async)
      PatternDetectionService.analyzeUserPatterns(entry.userId)
        .then(patterns => PatternDetectionService.savePatterns(entry.userId, patterns))
        .catch(err => console.error('Background pattern detection failed:', err))
    }

    return analysis
  }
}
