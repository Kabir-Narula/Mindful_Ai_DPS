import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { PatternDetectionService } from '@/lib/pattern-detection'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: user.userId }
    })

    const patterns = await PatternDetectionService.analyzeUserPatterns(user.userId, userProfile)
    const savedPatterns = await PatternDetectionService.savePatterns(user.userId, patterns)

    return NextResponse.json({ patterns: savedPatterns })
  } catch (error) {
    console.error('Manual Pattern Detection Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

