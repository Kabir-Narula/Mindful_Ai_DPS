import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import DashboardNav from '@/components/dashboard/dashboard-nav'
import LivingAICompanion from '@/components/dashboard/living-ai-companion'
import TutorialWrapper from '@/components/tutorial/tutorial-wrapper'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const authUser = await getCurrentUser()

  if (!authUser) {
    redirect('/login')
  }

  const user = await prisma.user.findUnique({
    where: { id: authUser.userId },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      profile: {
        select: {
          onboardingComplete: true,
          tutorialCompleted: true
        }
      }
    },
  })

  if (!user) {
    redirect('/login')
  }

  if (!user.profile?.onboardingComplete) {
    redirect('/onboarding')
  }

  return (
    <TutorialWrapper 
      tutorialCompleted={user.profile?.tutorialCompleted ?? false}
      userCreatedAt={user.createdAt}
    >
      <div className="min-h-screen bg-[#F9F8F5]">
        <DashboardNav user={{ id: user.id, name: user.name, email: user.email }} />
        <main className="px-8 md:px-16 py-12">
          {children}
        </main>
      </div>

      {/* Living AI Companion - Always accessible */}
      <LivingAICompanion />
    </TutorialWrapper>
  )
}