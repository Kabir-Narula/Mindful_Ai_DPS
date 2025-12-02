import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getChatResponse } from '@/lib/openai'
import { UserContextService } from '@/lib/user-context-service'
import { RATE_LIMITS, CONTENT_LIMITS } from '@/lib/validations'
import { z } from 'zod'

// ============================================================================
// CONFIGURATION
// ============================================================================

// Force dynamic rendering (this route uses cookies for auth)
export const dynamic = 'force-dynamic'

/**
 * In-memory rate limiter for chat requests
 * In production, use Redis or a proper rate limiting service
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

/**
 * Check if user has exceeded rate limit
 */
function checkRateLimit(userId: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  const limit = RATE_LIMITS.chat
  const key = `chat:${userId}`

  let record = rateLimitStore.get(key)

  // Clean up expired entries periodically
  if (Math.random() < 0.01) {
    cleanupRateLimitStore()
  }

  if (!record || now > record.resetAt) {
    // New window
    record = { count: 1, resetAt: now + limit.windowMs }
    rateLimitStore.set(key, record)
    return { allowed: true, remaining: limit.requests - 1, resetIn: limit.windowMs }
  }

  if (record.count >= limit.requests) {
    // Rate limited
    return {
      allowed: false,
      remaining: 0,
      resetIn: record.resetAt - now
    }
  }

  // Increment count
  record.count++
  return {
    allowed: true,
    remaining: limit.requests - record.count,
    resetIn: record.resetAt - now
  }
}

/**
 * Cleanup expired rate limit entries
 */
function cleanupRateLimitStore() {
  const now = Date.now()
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetAt) {
      rateLimitStore.delete(key)
    }
  }
}

/**
 * Sanitize user message to prevent prompt injection
 */
function sanitizeMessage(message: string): string {
  // Remove potentially dangerous patterns
  let sanitized = message
    .replace(/\[system\]/gi, '[FILTERED]')
    .replace(/\[assistant\]/gi, '[FILTERED]')
    .replace(/ignore.*previous.*instructions/gi, '[FILTERED]')
    .replace(/you are now/gi, '[FILTERED]')

  // Truncate if too long
  if (sanitized.length > CONTENT_LIMITS.CHAT_MESSAGE_MAX) {
    sanitized = sanitized.substring(0, CONTENT_LIMITS.CHAT_MESSAGE_MAX)
  }

  return sanitized.trim()
}

/**
 * Validate conversation history to prevent abuse
 */
function validateConversationHistory(
  history: unknown
): Array<{ role: 'user' | 'assistant'; content: string }> {
  if (!Array.isArray(history)) return []

  // Take only last 20 messages to prevent context overflow
  const validHistory = history
    .filter((msg): msg is { role: string; content: string } =>
      typeof msg === 'object' &&
      msg !== null &&
      typeof msg.role === 'string' &&
      typeof msg.content === 'string' &&
      (msg.role === 'user' || msg.role === 'assistant')
    )
    .slice(-20)
    .map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content.substring(0, CONTENT_LIMITS.CHAT_MESSAGE_MAX)
    }))

  return validHistory
}

// ============================================================================
// REQUEST LOGGING
// ============================================================================

/**
 * Log chat request for monitoring (in production, use proper logging service)
 */
function logChatRequest(
  userId: string,
  messageLength: number,
  historyLength: number,
  context?: { page?: string; entryId?: string }
) {
  console.log(`[Chat API] User: ${userId.substring(0, 8)}... | Message: ${messageLength} chars | History: ${historyLength} | Context: ${context?.page || 'none'}`)
}

// ============================================================================
// ROUTE HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Authentication check
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }

    // Rate limiting check
    const rateLimit = checkRateLimit(user.userId)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Please wait before sending more messages.',
          code: 'RATE_LIMITED',
          retryAfter: Math.ceil(rateLimit.resetIn / 1000)
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(rateLimit.resetIn / 1000)),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(rateLimit.resetIn / 1000))
          }
        }
      )
    }

    // Parse and validate request body
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body', code: 'INVALID_JSON' },
        { status: 400 }
      )
    }

    // Extract and validate message
    const { message, conversationHistory, context } = body as Record<string, unknown>

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string', code: 'INVALID_MESSAGE' },
        { status: 400 }
      )
    }

    // Sanitize the message
    const sanitizedMessage = sanitizeMessage(message)

    if (sanitizedMessage.length < 1) {
      return NextResponse.json(
        { error: 'Message cannot be empty', code: 'EMPTY_MESSAGE' },
        { status: 400 }
      )
    }

    // Validate conversation history
    const validatedHistory = validateConversationHistory(conversationHistory)

    // Validate context
    const validatedContext = {
      page: typeof (context as any)?.page === 'string' ? (context as any).page : undefined,
      entryId: typeof (context as any)?.entryId === 'string' ? (context as any).entryId : undefined,
    }

    // Log request for monitoring
    logChatRequest(user.userId, sanitizedMessage.length, validatedHistory.length, validatedContext)

    // Fetch data in parallel for efficiency
    const [recentMoods, recentEntries, userData, journalEntry] = await Promise.all([
      // Recent mood entries
      prisma.moodEntry.findMany({
        where: { userId: user.userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          moodScore: true,
          createdAt: true,
        },
      }),

      // Recent journal entries
      prisma.journalEntry.findMany({
        where: { userId: user.userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          title: true,
          moodRating: true,
          createdAt: true,
        },
      }),

      // User data with profile
      prisma.user.findUnique({
        where: { id: user.userId },
        include: { profile: true },
      }),

      // Specific journal entry if viewing one
      validatedContext.entryId
        ? prisma.journalEntry.findUnique({
            where: {
              id: validatedContext.entryId,
              userId: user.userId // Ensure user owns this entry
            },
            select: {
              id: true,
              title: true,
              content: true,
              moodRating: true,
              sentimentLabel: true,
              feedback: true,
            },
          })
        : Promise.resolve(null),
    ])

    // Build chat context for OpenAI
    const chatContext = {
      recentMoods,
      recentEntries,
      userName: userData?.name || undefined,
      journalEntry: journalEntry || undefined,
    }

    // Get deep user context (patterns, CBT history, trends)
    // This is cached in UserContextService for efficiency
    const deepUserContext = await UserContextService.buildContext(user.userId)

    // Get AI response
    const response = await getChatResponse(
      sanitizedMessage,
      chatContext,
      validatedHistory,
      userData?.profile,
      deepUserContext
    )

    // Log response time
    const responseTime = Date.now() - startTime
    console.log(`[Chat API] Response generated in ${responseTime}ms`)

    // Return response with rate limit headers
    return NextResponse.json(
      { response },
      {
        headers: {
          'X-RateLimit-Remaining': String(rateLimit.remaining),
          'X-Response-Time': String(responseTime)
        }
      }
    )
  } catch (error: unknown) {
    const responseTime = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    console.error(`[Chat API] Error after ${responseTime}ms:`, errorMessage)

    // Check for specific error types
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          code: 'VALIDATION_ERROR',
          details: error.errors
        },
        { status: 400 }
      )
    }

    // Generic error response
    return NextResponse.json(
      {
        error: 'Failed to process message. Please try again.',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}
