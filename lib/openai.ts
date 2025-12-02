import OpenAI from 'openai'

// ============================================================================
// CONFIGURATION & CONSTANTS
// ============================================================================

/**
 * Model configurations with their use cases and token limits
 * Using named constants for consistency across the codebase
 */
export const GPT_MODEL_REASONING = 'gpt-4o' // High reasoning for complex tasks (Pattern detection, CBT reframing)
export const GPT_MODEL_FAST = 'gpt-4o-mini' // Cost effective for chat and simple feedback
export const GPT_MODEL_STANDARD = 'gpt-4o' // Balanced model for general analysis

/**
 * Token limits by model for response budgeting
 */
export const MODEL_TOKEN_LIMITS: Record<string, number> = {
  'gpt-4o': 8192,
  'gpt-4o-mini': 4096,
}

/**
 * Retry configuration for API calls
 */
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  retryableErrors: [
    'rate_limit_exceeded',
    'timeout',
    'internal_error',
    'overloaded',
    'ECONNRESET',
    'ETIMEDOUT',
  ],
} as const

/**
 * Request timeout in milliseconds
 */
const REQUEST_TIMEOUT_MS = 30000

// ============================================================================
// OPENAI CLIENT INITIALIZATION
// ============================================================================

/**
 * Lazy-initialized OpenAI client with connection pooling
 */
let _openai: OpenAI | null = null

function getOpenAI(): OpenAI {
  if (!_openai) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new OpenAIConfigError('OPENAI_API_KEY environment variable is required')
    }

    _openai = new OpenAI({
      apiKey,
      timeout: REQUEST_TIMEOUT_MS,
      maxRetries: 0, // We handle retries ourselves for better control
    })
  }
  return _openai
}

/**
 * Proxied OpenAI client for lazy initialization
 */
export const openai = new Proxy({} as OpenAI, {
  get(_target, prop) {
    return getOpenAI()[prop as keyof OpenAI]
  }
})

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Custom error class for OpenAI configuration issues
 */
export class OpenAIConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'OpenAIConfigError'
  }
}

/**
 * Custom error class for OpenAI API errors with retry context
 */
export class OpenAIAPIError extends Error {
  public readonly isRetryable: boolean
  public readonly statusCode?: number
  public readonly errorCode?: string

  constructor(
    message: string,
    options: {
      isRetryable?: boolean
      statusCode?: number
      errorCode?: string
    } = {}
  ) {
    super(message)
    this.name = 'OpenAIAPIError'
    this.isRetryable = options.isRetryable ?? false
    this.statusCode = options.statusCode
    this.errorCode = options.errorCode
  }
}

/**
 * Determine if an error is retryable
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof OpenAI.APIError) {
    // Rate limits and server errors are retryable
    if (error.status === 429 || error.status >= 500) return true
    // Check error code
    const errorCode = (error as any).code
    return RETRY_CONFIG.retryableErrors.includes(errorCode)
  }

  if (error instanceof Error) {
    // Network errors are retryable
    return RETRY_CONFIG.retryableErrors.some(code =>
      error.message.includes(code)
    )
  }

  return false
}

/**
 * Calculate delay for exponential backoff
 */
function getRetryDelay(attempt: number): number {
  const delay = RETRY_CONFIG.baseDelayMs * Math.pow(2, attempt)
  // Add jitter to prevent thundering herd
  const jitter = Math.random() * 0.3 * delay
  return Math.min(delay + jitter, RETRY_CONFIG.maxDelayMs)
}

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// ============================================================================
// RETRY WRAPPER
// ============================================================================

/**
 * Execute an async function with retry logic
 * Uses exponential backoff with jitter
 * Exported for use in other services
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  context: string = 'API call'
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Check if we should retry
      if (attempt < RETRY_CONFIG.maxRetries && isRetryableError(error)) {
        const delay = getRetryDelay(attempt)
        console.warn(
          `[OpenAI] ${context} failed (attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries + 1}), ` +
          `retrying in ${Math.round(delay)}ms:`,
          lastError.message
        )
        await sleep(delay)
        continue
      }

      // Not retryable or max retries reached
      break
    }
  }

  // All retries exhausted
  throw new OpenAIAPIError(
    `${context} failed after ${RETRY_CONFIG.maxRetries + 1} attempts: ${lastError?.message}`,
    { isRetryable: false }
  )
}

// ============================================================================
// TOKEN ESTIMATION
// ============================================================================

/**
 * Rough token estimation for text
 * Uses the approximation of ~4 characters per token for English text
 */
export function estimateTokens(text: string): number {
  if (!text) return 0
  // More accurate estimation: count words and punctuation
  const words = text.split(/\s+/).length
  const punctuation = (text.match(/[.,!?;:'"()\[\]{}]/g) || []).length
  return Math.ceil(words * 1.3 + punctuation * 0.5)
}

/**
 * Truncate text to fit within token budget
 */
export function truncateToTokenBudget(text: string, maxTokens: number): string {
  const estimated = estimateTokens(text)
  if (estimated <= maxTokens) return text

  // Calculate approximate character limit
  const ratio = maxTokens / estimated
  const targetLength = Math.floor(text.length * ratio * 0.9) // 10% safety margin

  // Truncate at sentence boundary if possible
  const truncated = text.substring(0, targetLength)
  const lastSentence = truncated.lastIndexOf('. ')

  if (lastSentence > targetLength * 0.7) {
    return truncated.substring(0, lastSentence + 1) + '...'
  }

  return truncated + '...'
}

export interface ChatContext {
  recentMoods: Array<{ moodScore: number; createdAt: Date }>
  recentEntries: Array<{ title: string; moodRating: number; createdAt: Date }>
  userName?: string
  journalEntry?: {
    id: string
    title: string
    content: string
    moodRating: number
    sentimentLabel: string | null
    feedback: string | null
  }
}

export async function getChatResponse(
  userMessage: string,
  context: ChatContext,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  userProfile: any | null, // Using any to avoid circular dependency if needed, but preferably UserProfile
  userContext?: string  // NEW: Rich context from UserContextService
): Promise<string> {
  try {
    // Build context summary
    const avgMood = context.recentMoods.length > 0
      ? context.recentMoods.reduce((sum, m) => sum + m.moodScore, 0) / context.recentMoods.length
      : null

    let journalEntryContext = ''
    if (context.journalEntry) {
      journalEntryContext = `
The user wants to discuss a specific journal entry:
- Title: "${context.journalEntry.title}"
- Content: "${context.journalEntry.content}"
- Mood Rating: ${context.journalEntry.moodRating}/10
- Sentiment: ${context.journalEntry.sentimentLabel || 'neutral'}
${context.journalEntry.feedback ? `- Previous AI Feedback: "${context.journalEntry.feedback}"` : ''}

Please reference this entry in your responses and help them reflect on it. Ask thoughtful questions about their feelings, what they learned, or how they can grow from this experience.
`.trim()
    }

    // 1. Determine System Persona
    let systemPrompt = `You are a supportive, empathetic mental health companion. Your role is to:
- Listen without judgment
- Provide emotional support and validation
- Help users reflect on their feelings
- Suggest small, realistic steps to improve wellbeing
- Reframe negative thoughts in a constructive way`

    if (userProfile) {
      // Dynamic import to avoid circular dependencies if they exist
      const { PersonalizationService } = await import('@/lib/personalization-service')
      // Use 'supportive' as default but allow for variety in future
      systemPrompt = PersonalizationService.generateSystemPrompt(userProfile, 'supportive')
    }

    const contextPrompt = `
${systemPrompt}

User context:
${avgMood !== null ? `- Average mood recently: ${avgMood.toFixed(1)}/10` : '- No recent mood data'}
${context.recentEntries.length > 0 ? `- Recent journal entries: ${context.recentEntries.length}` : '- No recent journal entries'}
${context.userName ? `- User name: ${context.userName}` : ''}
${journalEntryContext}

${userContext || ''}

Be warm, genuine, and helpful. Keep responses concise but meaningful.
`.trim()

    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: contextPrompt },
      ...conversationHistory.slice(-6), // Keep last 6 messages for context
      { role: 'user', content: userMessage },
    ]

    const response = await openai.chat.completions.create({
      model: GPT_MODEL_STANDARD, // Use Standard for chat
      messages,
      temperature: 0.8,
      max_tokens: 300,
    })

    return response.choices[0]?.message?.content || 'I\'m here to listen. How are you feeling?'
  } catch (error) {
    console.error('Chat response error:', error)
    return 'I\'m having trouble connecting right now. But I\'m here for you. Would you like to try again?'
  }
}
