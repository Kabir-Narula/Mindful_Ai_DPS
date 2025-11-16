import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - List all chat sessions for the user
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessions = await prisma.chatSession.findMany({
      where: { userId: user.userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        journalEntry: {
          select: {
            id: true,
            title: true,
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
    })

    return NextResponse.json(sessions)
  } catch (error: any) {
    console.error('Sessions fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch chat sessions' },
      { status: 500 }
    )
  }
}

// POST - Create a new chat session
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

    const { title, journalEntryId } = body

    // Validate journal entry if provided
    if (journalEntryId) {
      const entry = await prisma.journalEntry.findFirst({
        where: {
          id: journalEntryId,
          userId: user.userId,
        },
      })
      if (!entry) {
        return NextResponse.json(
          { error: 'Journal entry not found' },
          { status: 404 }
        )
      }
    }

    const session = await prisma.chatSession.create({
      data: {
        userId: user.userId,
        title: title?.trim() || null,
        journalEntryId: journalEntryId || null,
      },
      include: {
        journalEntry: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    return NextResponse.json(session, { status: 201 })
  } catch (error: any) {
    console.error('Session creation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create chat session' },
      { status: 500 }
    )
  }
}

// DELETE - Delete all chat sessions and messages
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete all sessions (messages will be cascade deleted)
    await prisma.chatSession.deleteMany({
      where: { userId: user.userId },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete all sessions error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete chat history' },
      { status: 500 }
    )
  }
}

