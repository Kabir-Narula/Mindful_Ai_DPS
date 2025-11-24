import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { PatternDetectionService } from '@/lib/pattern-detection'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/patterns
 * Get all active patterns for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const patterns = await PatternDetectionService.getActivePatterns(user.userId)

    return NextResponse.json({ patterns })
  } catch (error: any) {
    console.error('Get patterns error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch patterns' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/patterns
 * Trigger pattern detection for the current user
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user profile for personalization
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: user.userId }
    })

    console.log('[Pattern Detection] Starting for user:', user.userId)

    // Detect patterns using AI
    const detectedPatterns = await PatternDetectionService.analyzeUserPatterns(user.userId, userProfile)

    console.log('[Pattern Detection] Detected patterns:', detectedPatterns.length)

    // Save patterns to database
    const savedPatterns = await PatternDetectionService.savePatterns(user.userId, detectedPatterns)

    return NextResponse.json({
      message: `Detected ${savedPatterns.length} patterns`,
      patterns: savedPatterns,
    })
  } catch (error: any) {
    console.error('[Pattern Detection] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to detect patterns' },
      { status: 500 }
    )
  }
}
