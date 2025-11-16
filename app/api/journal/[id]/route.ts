import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface Context {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, context: Context) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const entry = await prisma.journalEntry.findFirst({
      where: {
        id: context.params.id,
        userId: user.userId,
      },
    })

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    return NextResponse.json(entry)
  } catch (error) {
    console.error('Journal fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const entry = await prisma.journalEntry.findFirst({
      where: {
        id: context.params.id,
        userId: user.userId,
      },
    })

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    await prisma.journalEntry.delete({
      where: { id: context.params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Journal delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, content, moodRating, activities } = body

    const entry = await prisma.journalEntry.findFirst({
      where: {
        id: context.params.id,
        userId: user.userId,
      },
    })

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    const updated = await prisma.journalEntry.update({
      where: { id: context.params.id },
      data: {
        title,
        content,
        moodRating: Number(moodRating),
        activities: activities || [],
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Journal update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

