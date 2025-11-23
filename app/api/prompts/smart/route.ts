import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { PatternDetectionService } from '@/lib/pattern-detection'

/**
 * GET /api/prompts/smart
 * Generate a smart, context-aware journaling prompt using AI
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const prompt = await PatternDetectionService.generateSmartPrompt(user.userId)

    return NextResponse.json({
      prompt: prompt || 'How are you feeling today? What\'s on your mind?',
      hasContext: !!prompt,
    })
  } catch (error: any) {
    console.error('Smart prompt generation error:', error)
    return NextResponse.json(
      { 
        prompt: 'How are you feeling today? What\'s on your mind?',
        hasContext: false,
        error: 'Failed to generate contextual prompt'
      },
      { status: 200 } // Still return 200 with fallback
    )
  }
}
