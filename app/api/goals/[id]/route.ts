import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface Context {
  params: {
    id: string
  }
}

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { completed } = body

    const goal = await prisma.goal.findFirst({
      where: {
        id: context.params.id,
        userId: user.userId,
      },
    })

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    }

    const updated = await prisma.goal.update({
      where: { id: context.params.id },
      data: {
        completed: completed ?? goal.completed,
        completedAt: completed ? new Date() : null,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Goal update error:', error)
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

    const goal = await prisma.goal.findFirst({
      where: {
        id: context.params.id,
        userId: user.userId,
      },
    })

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    }

    await prisma.goal.delete({
      where: { id: context.params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Goal delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

