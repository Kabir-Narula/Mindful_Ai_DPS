import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AnalysisService } from '@/lib/analysis-service'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, content, moodRating, activities } = body

    // Validation
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Title is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    if (title.trim().length > 200) {
      return NextResponse.json(
        { error: 'Title must be 200 characters or less' },
        { status: 400 }
      )
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Content is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    if (content.trim().length > 10000) {
      return NextResponse.json(
        { error: 'Content must be 10,000 characters or less' },
        { status: 400 }
      )
    }

    const mood = Number(moodRating)
    if (!moodRating || isNaN(mood) || mood < 1 || mood > 10) {
      return NextResponse.json(
        { error: 'Mood rating must be a number between 1 and 10' },
        { status: 400 }
      )
    }

    if (activities && (!Array.isArray(activities) || activities.some(a => typeof a !== 'string'))) {
      return NextResponse.json(
        { error: 'Activities must be an array of strings' },
        { status: 400 }
      )
    }

    // Create journal entry
    const entry = await prisma.journalEntry.create({
      data: {
        userId: user.userId,
        title: title.trim(),
        content: content.trim(),
        moodRating: mood,
        activities: (activities || []).filter(Boolean),
        sentiment: 0,
        sentimentLabel: 'neutral',
        feedback: 'AI is analyzing your entry...',
      },
    })

    // Create mood entry for tracking
    await prisma.moodEntry.create({
      data: {
        userId: user.userId,
        moodScore: mood,
        note: title.trim(),
      },
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
