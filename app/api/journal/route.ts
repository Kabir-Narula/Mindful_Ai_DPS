import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AnalysisService } from '@/lib/analysis-service'
import { journalSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Zod Validation
    const validation = journalSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation Failed', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { title, content, moodRating, activities } = validation.data

    // Create journal entry
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

    // Create mood entry for tracking (Unified Mood/Journal Logic)
    await prisma.moodEntry.create({
      data: {
        userId: user.userId,
        moodScore: moodRating,
        note: title,
        triggers: activities,
      },
    })

    // Also create a MoodSnapshot for the new granular tracking system
    await prisma.moodSnapshot.create({
      data: {
        userId: user.userId,
        moodScore: moodRating,
        type: 'journaling',
        context: title,
      }
    })

    // Run AI analysis in background (don't await - return immediately)
    AnalysisService.analyzeEntry(entry.id).catch((error) => {
      console.error('Background AI analysis failed:', error)
    })

    // Return immediately with the entry ID
    return NextResponse.json({
      id: entry.id,
      title: entry.title,
      createdAt: entry.createdAt,
      message: 'Journal entry created. AI analysis in progress...'
    }, { status: 201 })

  } catch (error: any) {
    console.error('Journal creation error:', error)
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A journal entry with this information already exists' },
        { status: 409 }
      )
    }

    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create journal entry. Please try again.' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100)
    const skip = (page - 1) * limit

    const [entries, total] = await Promise.all([
      prisma.journalEntry.findMany({
        where: { userId: user.userId },
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
        where: { userId: user.userId },
      }),
    ])

    return NextResponse.json({
      entries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error('Journal fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch journal entries. Please try again.' },
      { status: 500 }
    )
  }
}
