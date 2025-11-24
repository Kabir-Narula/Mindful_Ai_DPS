import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { CBTService } from '@/lib/cbt-service'

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { thought, step, conversation } = await req.json()

    if (step === 'validate') {
      // Step 1: Generate Questions
      const questions = await CBTService.generateChallengeQuestions(thought, user.userId)
      return NextResponse.json({ questions })
    } 
    
    if (step === 'reframe') {
      // Step 2: Generate Reframe
      const reframe = await CBTService.generateReframe(thought, conversation, user.userId)
      return NextResponse.json({ reframe })
    }

    return NextResponse.json({ error: 'Invalid step' }, { status: 400 })
  } catch (error) {
    console.error('CBT API error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
