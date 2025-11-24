import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getChatResponse } from '@/lib/openai'
import { UserContextService } from '@/lib/user-context-service'

// Force dynamic rendering (this route uses cookies for auth)
export const dynamic = 'force-dynamic'

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

    // Fetch basic dashboard context items (Recent moods/entries) for "Immediate Context"
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
        include: { profile: true },
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

    // Build chat context object for the OpenAI wrapper
    const chatContext = {
      recentMoods,
      recentEntries,
      userName: userData?.name || undefined,
      journalEntry: journalEntry || undefined,
    }

    // Build DEEP context from the UserContextService (Patterns, CBT, Trends)
    // This is the "Omniscience" layer.
    const deepUserContext = await UserContextService.buildContext(user.userId)

    // Get AI response
    const response = await getChatResponse(
      message,
      chatContext,
      conversationHistory || [],
      userData?.profile,
      deepUserContext // Pass the deep context here
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
