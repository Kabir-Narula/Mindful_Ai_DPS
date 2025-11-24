import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering (this route uses cookies for auth)
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Mark tutorial as completed
    const profile = await prisma.userProfile.update({
      where: { userId: user.userId },
      data: {
        tutorialCompleted: true,
        tutorialCompletedAt: new Date()
      }
    })

    return NextResponse.json({ success: true, profile })
  } catch (error) {
    console.error('Tutorial completion error:', error)
    return NextResponse.json(
      { error: 'Failed to mark tutorial as complete' },
      { status: 500 }
    )
  }
}

