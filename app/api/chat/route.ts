import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getChatResponse } from '@/lib/openai'

// This route is deprecated - use /api/chat/sessions instead
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Return empty array - sessions should be fetched from /api/chat/sessions
    return NextResponse.json([])
  } catch (error) {
    console.error('Chat fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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

    const { message, sessionId, journalEntryId } = body

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { error: 'Message is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    if (message.trim().length > 2000) {
      return NextResponse.json(
        { error: 'Message must be 2000 characters or less' },
        { status: 400 }
      )
    }

    // Get or create session
    let session
    if (sessionId) {
      session = await prisma.chatSession.findFirst({
        where: {
          id: sessionId,
          userId: user.userId,
        },
      })
      if (!session) {
        return NextResponse.json(
          { error: 'Chat session not found' },
          { status: 404 }
        )
      }
    } else {
      // Create new session
      session = await prisma.chatSession.create({
        data: {
          userId: user.userId,
          journalEntryId: journalEntryId || null,
        },
      })
    }

    // Fetch journal entry if session has one
    let journalEntry = null
    if (session.journalEntryId) {
      const entry = await prisma.journalEntry.findFirst({
        where: {
          id: session.journalEntryId,
          userId: user.userId,
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
      if (entry) {
        journalEntry = entry
      }
    }

    // Save user message
    await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        userId: user.userId,
        role: 'user',
        content: message.trim(),
      },
    })

    // Get conversation history from this session only
    const recentMessages = await prisma.chatMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    const conversationHistory = recentMessages
      .reverse()
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))

    // Get context data
    const recentMoods = await prisma.moodEntry.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: 'desc' },
      take: 7,
      select: { moodScore: true, createdAt: true },
    })

    const recentEntries = await prisma.journalEntry.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { title: true, moodRating: true, createdAt: true },
    })

    const userData = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { name: true },
    })

    // Get AI response with timeout
    let aiResponse
    try {
      aiResponse = await Promise.race([
        getChatResponse(
          message.trim(),
          {
            recentMoods,
            recentEntries,
            userName: userData?.name || undefined,
            journalEntry: journalEntry || undefined,
          },
          conversationHistory
        ),
        new Promise<string>((_, reject) =>
          setTimeout(() => reject(new Error('AI response timeout')), 30000)
        ),
      ]) as string
    } catch (aiError: any) {
      console.error('AI response error:', aiError)
      
      // Fallback response if AI fails
      aiResponse = journalEntry
        ? `I'm having trouble processing your request right now, but I'm here for you. You mentioned your journal entry "${journalEntry.title}". Would you like to tell me more about how you're feeling about it?`
        : "I'm having trouble connecting right now, but I'm here for you. How are you feeling today?"
    }

    // Save AI response
    const assistantMessage = await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        userId: user.userId,
        role: 'assistant',
        content: aiResponse,
      },
    })

    // Update session updatedAt
    await prisma.chatSession.update({
      where: { id: session.id },
      data: { updatedAt: new Date() },
    })

    return NextResponse.json({
      ...assistantMessage,
      sessionId: session.id,
    })
  } catch (error: any) {
    console.error('Chat error:', error)
    
    // Handle Prisma errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A message with this content already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to process your message. Please try again.' },
      { status: 500 }
    )
  }
}

