import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface Context {
  params: {
    id: string
  }
}

export async function POST(request: NextRequest, context: Context) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { completed, note } = body

    const goal = await prisma.goal.findFirst({
      where: {
        id: context.params.id,
        userId: user.userId,
      },
    })

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    }

    const checkIn = await prisma.goalCheckIn.create({
      data: {
        goalId: context.params.id,
        completed: completed ?? true,
        note: note || null,
      },
    })

    return NextResponse.json(checkIn, { status: 201 })
  } catch (error) {
    console.error('Check-in creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

