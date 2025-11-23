import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { PatternDetectionService } from '@/lib/pattern-detection'

/**
 * POST /api/patterns/[id]/dismiss
 * Dismiss a pattern
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const patternId = params.id

    const pattern = await PatternDetectionService.dismissPattern(patternId, user.userId)

    return NextResponse.json({
      message: 'Pattern dismissed',
      pattern,
    })
  } catch (error: any) {
    console.error('Dismiss pattern error:', error)
    return NextResponse.json(
      { error: 'Failed to dismiss pattern' },
      { status: 500 }
    )
  }
}
