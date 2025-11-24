import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create minimal profile with defaults to allow skipping
    const profile = await prisma.userProfile.upsert({
      where: { userId: user.userId },
      create: {
        userId: user.userId,
        ageGroup: '25-34', // Default
        lifeStage: 'working', // Default
        communicationStyle: 'conversational', // Default
        preferredTone: 'conversational', // Required field - derived from communicationStyle
        hobbies: [],
        currentWellbeing: 5, // Neutral
        primaryGoals: [],
        aiPersona: 'supportive-friend', // Default
        onboardingComplete: true,
        onboardedAt: new Date()
      },
      update: {
        onboardingComplete: true,
        onboardedAt: new Date()
      }
    })

    return NextResponse.json({ success: true, profile })
  } catch (error) {
    console.error('Skip onboarding error:', error)
    return NextResponse.json(
      { error: 'Failed to skip onboarding' },
      { status: 500 }
    )
  }
}

