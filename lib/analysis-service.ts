import { prisma } from '@/lib/prisma'
import { openai, GPT_MODEL_FAST } from '@/lib/openai'
import { PatternDetectionService } from '@/lib/pattern-detection'
import { parseAIJSON } from '@/lib/utils'

// Enhanced AI analysis for extracting insights and actions
async function generateAIAnalysis(content: string, title: string, activities: string[], userProfile: any | null) {
  try {
    // 1. Determine System Persona
    let systemPrompt = 'You are a professional life coach specializing in cognitive behavioral therapy and positive psychology. You help users identify patterns and suggest small, actionable steps.'
    
    if (userProfile) {
      // Use the personalized system prompt if profile exists
      const { PersonalizationService } = await import('@/lib/personalization-service')
      systemPrompt = PersonalizationService.generateSystemPrompt(userProfile)
    }

    const userPrompt = `Analyze this journal entry.
Journal Title: "${title}"
Activities: ${activities.join(', ') || 'None'}
Content: "${content}"

Extract 2 things:
1. INSIGHT: One behavioral pattern, cognitive distortion, or observation about their emotional state (max 1 sentence, 20 words)
2. ACTION: One tiny, specific, actionable micro-challenge for tomorrow (max 1 sentence, 15 words)

Respond ONLY in JSON format:
{
  "sentiment": <number between -1 and 1>,
  "sentimentLabel": "<positive|neutral|negative>",
  "feedback": "<encouraging, personalized response in 1-2 sentences>",
  "insight": "<the insight>",
  "action": "<the micro-challenge>"
}`

    const response = await openai.chat.completions.create({
      model: GPT_MODEL_FAST,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 300,
      response_format: { type: 'json_object' },
    })

    const result = parseAIJSON(response.choices[0].message.content || '{}', {})
    
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
      include: { 
        user: {
          include: { profile: true }
        } 
      }
    })

    if (!entry) throw new Error('Entry not found')

    // 1. Generate AI Analysis
    const analysis = await generateAIAnalysis(
      entry.content, 
      entry.title, 
      entry.activities,
      entry.user.profile
    )

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
      // We need to refactor pattern detection to avoid circular dependency if we import types differently
      // But for now, we just call it.
      PatternDetectionService.analyzeUserPatterns(entry.userId, entry.user.profile)
        .then(patterns => PatternDetectionService.savePatterns(entry.userId, patterns))
        .catch(err => console.error('Background pattern detection failed:', err))
    }

    return analysis
  }
}
