import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering (this route uses cookies for auth)
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { intention, userDate } = await request.json()

    if (!intention || typeof intention !== 'string') {
      return NextResponse.json(
        { error: 'Intention is required' },
        { status: 400 }
      )
    }

    // Use user-provided date if available to fix timezone issues (e.g. IST vs UTC)
    // Otherwise fall back to server time
    let targetDate = new Date()
    if (userDate) {
       targetDate = new Date(userDate)
    }
    
    // Normalize to midnight UTC for DB uniqueness
    // This ensures "Nov 25" in Client becomes "Nov 25 00:00:00 UTC" in DB
    targetDate.setUTCHours(0, 0, 0, 0)

    const dayLog = await prisma.dayLog.upsert({
      where: {
        userId_date: {
          userId: user.userId,
          date: targetDate
        }
      },
      create: {
        userId: user.userId,
        date: targetDate,
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
