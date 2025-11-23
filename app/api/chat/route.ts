import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getChatResponse } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { message, conversationHistory, context } = await request.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Fetch user context
    const [recentMoods, recentEntries, userData] = await Promise.all([
      prisma.moodEntry.findMany({
        where: { userId: user.userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          moodScore: true,
          createdAt: true,
        },
      }),
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
      prisma.user.findUnique({
        where: { id: user.userId },
        select: { name: true },
      }),
    ])

    // If viewing a specific journal entry, fetch it
    let journalEntry = null
    if (context?.entryId) {
      journalEntry = await prisma.journalEntry.findUnique({
        where: { id: context.entryId },
        select: {
          id: true,
          title: true,
          content: true,
          moodRating: true,
          sentimentLabel: true,
          feedback: true,
        },
      })
    }

    // Build chat context
    const chatContext = {
      recentMoods,
      recentEntries,
      userName: userData?.name || undefined,
      journalEntry: journalEntry || undefined,
    }

    // Get AI response
    const response = await getChatResponse(
      message,
      chatContext,
      conversationHistory || []
    )

    return NextResponse.json({ response })
  } catch (error: any) {
    console.error('Chat error:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
}
