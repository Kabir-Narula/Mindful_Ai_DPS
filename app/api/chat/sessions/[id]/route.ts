import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Get messages for a specific session
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const session = await prisma.chatSession.findFirst({
      where: {
        id: params.id,
        userId: user.userId,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        journalEntry: {
          select: {
            id: true,
            title: true,
            content: true,
            moodRating: true,
            sentimentLabel: true,
            feedback: true,
          },
        },
      },
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Chat session not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(session)
  } catch (error: any) {
    console.error('Session fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch chat session' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a specific session
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const session = await prisma.chatSession.findFirst({
      where: {
        id: params.id,
        userId: user.userId,
      },
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Chat session not found' },
        { status: 404 }
      )
    }

    // Delete session (messages will be cascade deleted)
    await prisma.chatSession.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Session delete error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete chat session' },
      { status: 500 }
    )
  }
}

