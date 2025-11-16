import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const { title, description, targetDate } = body

    // Validation
    if (!title || typeof title !== 'string' || !title.trim()) {
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

    if (description && (typeof description !== 'string' || description.length > 1000)) {
      return NextResponse.json(
        { error: 'Description must be a string with 1000 characters or less' },
        { status: 400 }
      )
    }

    let parsedTargetDate: Date | null = null
    if (targetDate) {
      parsedTargetDate = new Date(targetDate)
      if (isNaN(parsedTargetDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid target date format' },
          { status: 400 }
        )
      }
      // Don't allow past dates
      if (parsedTargetDate < new Date()) {
        return NextResponse.json(
          { error: 'Target date cannot be in the past' },
          { status: 400 }
        )
      }
    }

    const goal = await prisma.goal.create({
      data: {
        userId: user.userId,
        title: title.trim(),
        description: description?.trim() || null,
        targetDate: parsedTargetDate,
      },
    })

    return NextResponse.json(goal, { status: 201 })
  } catch (error: any) {
    console.error('Goal creation error:', error)
    
    // Handle Prisma errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A goal with this title already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create goal. Please try again.' },
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

    const goals = await prisma.goal.findMany({
      where: { userId: user.userId },
      include: {
        checkIns: {
          orderBy: { createdAt: 'desc' },
          take: 10, // Limit check-ins to prevent large payloads
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(goals)
  } catch (error: any) {
    console.error('Goals fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch goals. Please try again.' },
      { status: 500 }
    )
  }
}

