import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { intention } = await request.json()

    if (!intention || typeof intention !== 'string') {
      return NextResponse.json(
        { error: 'Intention is required' },
        { status: 400 }
      )
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const dayLog = await prisma.dayLog.upsert({
      where: {
        userId_date: {
          userId: user.userId,
          date: today
        }
      },
      create: {
        userId: user.userId,
        date: today,
        morningIntention: intention
      },
      update: {
        morningIntention: intention
      }
    })

    return NextResponse.json({ 
      success: true, 
      dayLog,
      message: 'Morning intention saved'
    }, { status: 200 })
  } catch (error: any) {
    console.error('Error saving intention:', error)
    return NextResponse.json(
      { error: 'Failed to save intention' },
      { status: 500 }
    )
  }
}
