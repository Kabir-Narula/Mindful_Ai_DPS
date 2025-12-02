import { prisma } from '@/lib/prisma'
import { openai, GPT_MODEL_FAST, withRetry, estimateTokens, truncateToTokenBudget } from '@/lib/openai'
import { PatternDetectionService } from '@/lib/pattern-detection'
import { parseAIJSON } from '@/lib/utils'
import { subDays } from 'date-fns'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Analysis result structure
 */
export interface AnalysisResult {
  sentiment: number
  sentimentLabel: 'positive' | 'neutral' | 'negative'
  feedback: string
  insight: string
  action: string
  confidenceScore?: number
  processingTimeMs?: number
}

/**
 * Analysis configuration
 */
interface AnalysisConfig {
  maxContentTokens: number
  temperature: number
  maxRetries: number
  patternDetectionThreshold: number
  patternDetectionInterval: number
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG: AnalysisConfig = {
  maxContentTokens: 1000,        // Max tokens for content analysis
  temperature: 0.7,             // Creativity level
  maxRetries: 3,                // Retry attempts for AI calls
  patternDetectionThreshold: 5, // Min entries before pattern detection
  patternDetectionInterval: 5,  // Run pattern detection every N entries
}

/**
 * Default fallback analysis when AI fails - warm and specific
 */
const FALLBACK_ANALYSIS: AnalysisResult = {
  sentiment: 0,
  sentimentLabel: 'neutral',
  feedback: "Thanks for taking a moment to check in with yourself today. That takes intention, and it matters.",
  insight: "You showed up for yourself today - that's the foundation everything else builds on.",
  action: "Tomorrow, try writing just one sentence about how you're feeling right when you wake up.",
  confidenceScore: 0,
}

// ============================================================================
// CACHING
// ============================================================================

/**
 * Simple in-memory cache for recent analyses
 * Prevents re-analyzing the same content within a short window
 */
interface AnalysisCache {
  result: AnalysisResult
  timestamp: number
}

const analysisCache = new Map<string, AnalysisCache>()
const CACHE_TTL_MS = 30 * 60 * 1000 // 30 minutes

/**
 * Generate cache key from content
 */
function getCacheKey(content: string, title: string): string {
  // Simple hash based on first 100 chars + length
  const combined = `${title}:${content.substring(0, 100)}:${content.length}`
  let hash = 0
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return String(hash)
}

/**
 * Check cache for existing analysis
 */
function getCachedAnalysis(content: string, title: string): AnalysisResult | null {
  const key = getCacheKey(content, title)
  const cached = analysisCache.get(key)

  if (!cached) return null
  if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
    analysisCache.delete(key)
    return null
  }

  console.log('[AnalysisService] Cache hit for content analysis')
  return cached.result
}

/**
 * Store analysis in cache
 */
function cacheAnalysis(content: string, title: string, result: AnalysisResult): void {
  const key = getCacheKey(content, title)
  analysisCache.set(key, { result, timestamp: Date.now() })

  // Cleanup old entries occasionally
  if (Math.random() < 0.01) {
    cleanupCache()
  }
}

/**
 * Cleanup expired cache entries
 */
function cleanupCache(): void {
  const now = Date.now()
  for (const [key, entry] of analysisCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL_MS) {
      analysisCache.delete(key)
    }
  }
}

// ============================================================================
// ANALYSIS FUNCTIONS
// ============================================================================

/**
 * Sanitize content before sending to AI
 */
function sanitizeContent(content: string): string {
  return content
    .replace(/\[system\]/gi, '')
    .replace(/\[assistant\]/gi, '')
    .replace(/ignore.*instructions/gi, '')
    .trim()
}

/**
 * Enhanced AI analysis for extracting insights and actions
 * Redesigned for warm, conversational, actionable feedback
 */
async function generateAIAnalysis(
  content: string,
  title: string,
  activities: string[],
  userProfile: any | null,
  recentMoodAvg?: number | null
): Promise<AnalysisResult> {
  const startTime = Date.now()

  try {
    // Check cache first
    const cached = getCachedAnalysis(content, title)
    if (cached) {
      return { ...cached, processingTimeMs: 0 }
    }

    // Sanitize and truncate content to fit token budget
    const sanitized = sanitizeContent(content)
    const truncatedContent = truncateToTokenBudget(sanitized, CONFIG.maxContentTokens)

    console.log(`[AnalysisService] Analyzing entry: "${title.substring(0, 30)}..." (${estimateTokens(truncatedContent)} estimated tokens)`)

    // Warm, supportive system prompt
    const systemPrompt = `You are a warm, supportive friend who's great at noticing patterns and offering encouragement.
You speak casually like texting a close friend - never clinical or robotic.
You focus on specific things from their entry, not generic advice.
Be encouraging but authentic. If they're struggling, validate their feelings first.`

    const userPrompt = `Someone just shared a journal entry with you. Respond warmly and specifically to what they wrote.

THEIR ENTRY:
Title: "${title}"
Content: "${truncatedContent}"
${activities.length > 0 ? `They did these today: ${activities.join(', ')}` : ''}

YOUR JOB: Give them warm, specific feedback. Reference actual things they wrote.

Respond in JSON:
{
  "sentiment": <number from -1 to 1>,
  "sentimentLabel": "positive" or "neutral" or "negative",
  "feedback": "1-2 sentences responding specifically to what they shared. Mention something specific from their entry. Sound like a supportive friend texting them.",
  "insight": "One specific thing you noticed about their mood or thinking. Example: 'Sounds like that morning walk really set the tone for your day!' NOT generic stuff like 'Exercise affects mood.'",
  "action": "One tiny, specific thing to try tomorrow. Example: 'Try that 10-min walk again before noon!' NOT 'Keep exercising'",
  "confidenceScore": 0.8
}

CRITICAL RULES:
- Reference SPECIFIC things from their entry - no generic responses!
- Keep feedback under 40 words, insight under 25 words, action under 15 words
- Sound warm and friendly, not like an app or therapist
- If their mood seems low, be extra gentle and validating
- NO phrases like "keep journaling", "take care of yourself", or "remember to..."
- Make the action so specific they can picture doing it`

    // Use retry wrapper for resilience
    const response = await withRetry(
      async () => {
        return openai.chat.completions.create({
          model: GPT_MODEL_FAST,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.8,
          max_tokens: 350,
          response_format: { type: 'json_object' },
        })
      },
      'Journal entry analysis'
    )

    const result = parseAIJSON<AnalysisResult>(
      response.choices[0].message.content || '{}',
      FALLBACK_ANALYSIS
    )

    // Validate and normalize result
    const normalizedResult: AnalysisResult = {
      sentiment: Math.max(-1, Math.min(1, result.sentiment ?? 0)),
      sentimentLabel: ['positive', 'neutral', 'negative'].includes(result.sentimentLabel)
        ? result.sentimentLabel
        : 'neutral',
      feedback: result.feedback?.substring(0, 500) || FALLBACK_ANALYSIS.feedback,
      insight: result.insight?.substring(0, 200) || FALLBACK_ANALYSIS.insight,
      action: result.action?.substring(0, 200) || FALLBACK_ANALYSIS.action,
      confidenceScore: Math.max(0, Math.min(1, result.confidenceScore ?? 0.8)),
      processingTimeMs: Date.now() - startTime,
    }

    // Cache the result
    cacheAnalysis(content, title, normalizedResult)

    console.log(`[AnalysisService] Analysis complete in ${normalizedResult.processingTimeMs}ms (confidence: ${normalizedResult.confidenceScore})`)

    return normalizedResult
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[AnalysisService] AI Analysis error after ${Date.now() - startTime}ms:`, errorMessage)

    return {
      ...FALLBACK_ANALYSIS,
      processingTimeMs: Date.now() - startTime,
    }
  }
}

// ============================================================================
// ANALYSIS SERVICE
// ============================================================================

export class AnalysisService {
  /**
   * Analyze a journal entry with AI
   * Includes retry logic, caching, and background pattern detection
   */
  static async analyzeEntry(entryId: string): Promise<AnalysisResult> {
    const startTime = Date.now()

    console.log(`[AnalysisService] Starting analysis for entry: ${entryId}`)

    // Fetch entry with user profile
    const entry = await prisma.journalEntry.findUnique({
      where: { id: entryId },
      include: {
        user: {
          include: { profile: true }
        }
      }
    })

    if (!entry) {
      console.error(`[AnalysisService] Entry not found: ${entryId}`)
      throw new Error('Entry not found')
    }

    // Generate AI Analysis
    const analysis = await generateAIAnalysis(
      entry.content,
      entry.title,
      entry.activities,
      entry.user.profile
    )

    // Update Journal Entry with analysis results
    await prisma.journalEntry.update({
      where: { id: entryId },
      data: {
        sentiment: analysis.sentiment,
        sentimentLabel: analysis.sentimentLabel,
        feedback: analysis.feedback,
      }
    })

    // Update or Create DayLog with insights
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

    // Trigger pattern detection periodically
    await this.maybeRunPatternDetection(entry.userId, entry.user.profile)

    const totalTime = Date.now() - startTime
    console.log(`[AnalysisService] Entry analysis complete in ${totalTime}ms`)

    return analysis
  }

  /**
   * Run pattern detection if user has enough data
   * Runs in background to not block the response
   */
  private static async maybeRunPatternDetection(userId: string, profile: any): Promise<void> {
    try {
      const totalEntries = await prisma.journalEntry.count({
        where: { userId }
      })

      // Run pattern detection if:
      // 1. User has at least CONFIG.patternDetectionThreshold entries
      // 2. It's time based on CONFIG.patternDetectionInterval
      if (totalEntries >= CONFIG.patternDetectionThreshold &&
          totalEntries % CONFIG.patternDetectionInterval === 0) {

        console.log(`[AnalysisService] Triggering pattern detection for user (${totalEntries} entries)`)

        // Run in background - don't await
        PatternDetectionService.analyzeUserPatterns(userId, profile)
          .then(patterns => PatternDetectionService.savePatterns(userId, patterns))
          .catch(err => console.error('[AnalysisService] Background pattern detection failed:', err))
      }
    } catch (error) {
      console.error('[AnalysisService] Error checking pattern detection eligibility:', error)
    }
  }

  /**
   * Batch analyze multiple entries (for catch-up processing)
   * Useful when AI was unavailable and entries queued up
   */
  static async batchAnalyzeEntries(entryIds: string[]): Promise<Map<string, AnalysisResult>> {
    const results = new Map<string, AnalysisResult>()

    console.log(`[AnalysisService] Starting batch analysis of ${entryIds.length} entries`)

    // Process sequentially to avoid rate limiting
    for (const entryId of entryIds) {
      try {
        const result = await this.analyzeEntry(entryId)
        results.set(entryId, result)

        // Small delay between entries to be nice to the API
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (error) {
        console.error(`[AnalysisService] Failed to analyze entry ${entryId}:`, error)
        results.set(entryId, FALLBACK_ANALYSIS)
      }
    }

    console.log(`[AnalysisService] Batch analysis complete: ${results.size}/${entryIds.length} successful`)

    return results
  }

  /**
   * Get pending entries that need analysis
   */
  static async getPendingEntries(userId: string, limit: number = 10): Promise<string[]> {
    const entries = await prisma.journalEntry.findMany({
      where: {
        userId,
        OR: [
          { feedback: 'AI is analyzing your entry...' },
          { feedback: null },
          { sentimentLabel: 'neutral', feedback: { contains: 'analyzing' } }
        ]
      },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    return entries.map(e => e.id)
  }

  /**
   * Clear analysis cache (for testing or maintenance)
   */
  static clearCache(): void {
    analysisCache.clear()
    console.log('[AnalysisService] Cache cleared')
  }
}
