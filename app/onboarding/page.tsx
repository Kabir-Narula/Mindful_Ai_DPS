import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard'
import { Metadata } from 'next'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
    title: 'Welcome to MindfulAI',
    description: 'Let\'s get to know you better.',
}

export default async function OnboardingPage() {
    const authUser = await getCurrentUser()

    if (!authUser) {
        redirect('/login')
    }

    const user = await prisma.user.findUnique({
        where: { id: authUser.userId },
        include: { profile: true }
    })

    if (user?.profile?.onboardingComplete) {
        redirect('/dashboard')
    }

    return <OnboardingWizard />
}
