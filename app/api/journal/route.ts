import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AnalysisService } from '@/lib/analysis-service'
import { journalSchema, RATE_LIMITS, validateInput } from '@/lib/validations'
import { invalidateStreakCache } from '@/lib/streak-service'
import { invalidateContextCache } from '@/lib/user-context-service'
import { z } from 'zod'

// ============================================================================
// CONFIGURATION
// ============================================================================

// Force dynamic rendering (this route uses cookies for auth)
export const dynamic = 'force-dynamic'

/**
 * Rate limiter for journal entries (10/min by default)
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(userId: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  const limit = RATE_LIMITS.journal
  const key = `journal:${userId}`

  let record = rateLimitStore.get(key)

  if (!record || now > record.resetAt) {
    record = { count: 1, resetAt: now + limit.windowMs }
    rateLimitStore.set(key, record)
    return { allowed: true, remaining: limit.requests - 1, resetIn: limit.windowMs }
  }

  if (record.count >= limit.requests) {
    return { allowed: false, remaining: 0, resetIn: record.resetAt - now }
  }

  record.count++
  return { allowed: true, remaining: limit.requests - record.count, resetIn: record.resetAt - now }
}

// ============================================================================
// LOGGING & MONITORING
// ============================================================================

function logJournalCreate(userId: string, titleLen: number, contentLen: number, mood: number) {
  console.log(`[Journal API] POST | User: ${userId.substring(0, 8)}... | Title: ${titleLen}c | Content: ${contentLen}c | Mood: ${mood}`)
}

function logJournalFetch(userId: string, page: number, limit: number, resultCount: number) {
  console.log(`[Journal API] GET | User: ${userId.substring(0, 8)}... | Page: ${page} | Limit: ${limit} | Results: ${resultCount}`)
}

// ============================================================================
// POST - Create Journal Entry
// ============================================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Authentication
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }

    // Rate limiting
    const rateLimit = checkRateLimit(user.userId)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Too many journal entries. Please wait before creating another.',
          code: 'RATE_LIMITED',
          retryAfter: Math.ceil(rateLimit.resetIn / 1000)
        },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(rateLimit.resetIn / 1000)) }
        }
      )
    }

    // Parse body
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body', code: 'INVALID_JSON' },
        { status: 400 }
      )
    }

    // Validate with enhanced schema
    const validation = validateInput(journalSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: validation.errors
        },
        { status: 400 }
      )
    }

    const { title, content, moodRating, activities } = validation.data

    // Log request
    logJournalCreate(user.userId, title.length, content.length, moodRating)

    // Check for duplicate entries (prevent double-submit)
    // Only consider it a duplicate if BOTH title AND content match within 60 seconds
    const recentDuplicate = await prisma.journalEntry.findFirst({
      where: {
        userId: user.userId,
        title: title,
        content: content,
        createdAt: { gte: new Date(Date.now() - 60 * 1000) } // Last 60 seconds only
      },
      select: { id: true }
    })

    if (recentDuplicate) {
      console.log(`[Journal API] Duplicate detected: ${recentDuplicate.id}`)
      return NextResponse.json(
        {
          error: 'This exact entry was already saved.',
          code: 'DUPLICATE_ENTRY',
          existingEntryId: recentDuplicate.id
        },
        { status: 409 }
      )
    }

    // Create journal entry with initial placeholder analysis
    const entry = await prisma.journalEntry.create({
      data: {
        userId: user.userId,
        title,
        content,
        moodRating,
        activities,
        sentiment: 0,
        sentimentLabel: 'neutral',
        feedback: 'AI is analyzing your entry...',
      },
    })

    // Create MoodSnapshot for granular tracking
    await prisma.moodSnapshot.create({
      data: {
        userId: user.userId,
        moodScore: moodRating,
        type: 'journaling',
        context: title.substring(0, 100), // Truncate context
      }
    })

    // Invalidate caches since user has new data
    invalidateStreakCache(user.userId)
    invalidateContextCache(user.userId)

    // Run AI analysis in background (don't await)
    AnalysisService.analyzeEntry(entry.id).catch((error) => {
      console.error('[Journal API] Background AI analysis failed:', error)
    })

    const responseTime = Date.now() - startTime
    console.log(`[Journal API] Entry created in ${responseTime}ms`)

    return NextResponse.json({
      id: entry.id,
      title: entry.title,
      createdAt: entry.createdAt,
      message: 'Journal entry created. AI analysis in progress...',
      meta: { analysisQueued: true }
    }, {
      status: 201,
      headers: {
        'X-Response-Time': String(responseTime),
        'X-RateLimit-Remaining': String(rateLimit.remaining)
      }
    })

  } catch (error: unknown) {
    const responseTime = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[Journal API] POST error after ${responseTime}ms:`, errorMessage)

    // Handle Prisma unique constraint violation
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A journal entry with this information already exists', code: 'DUPLICATE' },
        { status: 409 }
      )
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', code: 'VALIDATION_ERROR', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create journal entry. Please try again.', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

// ============================================================================
// GET - Fetch Journal Entries
// ============================================================================

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }

    // Parse query params with validation
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '20', 10)), 100)
    const skip = (page - 1) * limit
    const search = searchParams.get('search')?.trim()

    // Build where clause
    const whereClause: Record<string, unknown> = { userId: user.userId }

    // Add search if provided (min 2 chars)
    if (search && search.length >= 2) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Fetch entries and count in parallel
    const [entries, total] = await Promise.all([
      prisma.journalEntry.findMany({
        where: whereClause as any,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          content: true,
          moodRating: true,
          activities: true,
          sentiment: true,
          sentimentLabel: true,
          feedback: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.journalEntry.count({
        where: whereClause as any,
      }),
    ])

    // Log the request
    logJournalFetch(user.userId, page, limit, entries.length)

    const responseTime = Date.now() - startTime

    return NextResponse.json({
      entries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + entries.length < total,
      },
    }, {
      headers: {
        'X-Response-Time': String(responseTime),
        'Cache-Control': 'private, max-age=60' // Cache for 1 minute
      }
    })
  } catch (error: unknown) {
    const responseTime = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[Journal API] GET error after ${responseTime}ms:`, errorMessage)

    return NextResponse.json(
      { error: 'Failed to fetch journal entries.', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
