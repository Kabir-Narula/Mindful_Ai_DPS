import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { analyzeSentiment } from '@/lib/openai'

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

    // Analyze sentiment using OpenAI with timeout
    let sentiment
    try {
      sentiment = await Promise.race([
        analyzeSentiment(content, title),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Sentiment analysis timeout')), 10000)
        )
      ]) as Awaited<ReturnType<typeof analyzeSentiment>>
    } catch (sentimentError) {
      console.error('Sentiment analysis error:', sentimentError)
      // Fallback to neutral sentiment if analysis fails
      sentiment = {
        score: 0,
        label: 'neutral',
        feedback: 'Thank you for sharing your thoughts. Keep journaling to track your emotional journey.',
      }
    }

    // Create journal entry
    const entry = await prisma.journalEntry.create({
      data: {
        userId: user.userId,
        title: title.trim(),
        content: content.trim(),
        moodRating: mood,
        activities: (activities || []).filter(Boolean),
        sentiment: sentiment.score,
        sentimentLabel: sentiment.label,
        feedback: sentiment.feedback,
      },
    })

    // Also create a mood entry for tracking
    await prisma.moodEntry.create({
      data: {
        userId: user.userId,
        moodScore: mood,
        note: title.trim(),
      },
    })

    return NextResponse.json(entry, { status: 201 })
  } catch (error: any) {
    console.error('Journal creation error:', error)
    
    // Handle Prisma errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A journal entry with this information already exists' },
        { status: 409 }
      )
    }

    // Handle validation errors
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

    // Get query parameters for pagination
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100) // Max 100
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

