import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { moodSchema } from '@/lib/validations'

// Force dynamic rendering (this route uses cookies for auth)
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    
    // Zod Validation
    const validation = moodSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation Failed', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { score, type, context } = validation.data

    // OPTIMIZED: Create both entries in parallel for faster response
    const [snapshot] = await Promise.all([
      prisma.moodSnapshot.create({
        data: {
          userId: user.userId,
          moodScore: score,
          type,
          context,
        }
      }),
      // SYNC FIX: Also create a MoodEntry so it appears in the legacy Feed/Graphs
      prisma.moodEntry.create({
        data: {
          userId: user.userId,
          moodScore: score,
          note: context || 'Pulse Check',
          triggers: [],
        }
      })
    ])

    return NextResponse.json(snapshot)
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
