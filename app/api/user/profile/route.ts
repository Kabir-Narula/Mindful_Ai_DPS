import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    // 1. Auth Check
    const currentUser = await getCurrentUser()
    if (!currentUser?.email) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // 2. Get User ID
    const user = await prisma.user.findUnique({
      where: { email: currentUser.email }
    })

    if (!user) {
      return new NextResponse('User not found', { status: 404 })
    }

    // 3. Parse Data
    const data = await req.json()
    const {
      nickname, // We might want to save this to User.name if empty
      ageGroup,
      lifeStage,
      communicationStyle,
      hobbies,
      currentWellbeing,
      primaryGoals
    } = data

    // 4. Determine Persona
    let aiPersona = 'supportive-friend'
    if (communicationStyle === 'direct') aiPersona = 'motivational-coach'
    if (communicationStyle === 'reflective' || communicationStyle === 'conversational') aiPersona = 'wise-guide'

    // 5. Create Profile
    const profile = await prisma.userProfile.create({
      data: {
        userId: user.id,
        ageGroup,
        lifeStage,
        communicationStyle,
        preferredTone: communicationStyle, // Simple mapping for now
        hobbies,
        currentWellbeing,
        primaryGoals,
        aiPersona,
        onboardingComplete: true,
        onboardedAt: new Date()
      }
    })

    // 6. Update User Name if provided (optional, but nice)
    if (nickname) {
      await prisma.user.update({
        where: { id: user.id },
        data: { name: nickname }
      })
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('[PROFILE_CREATE]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
