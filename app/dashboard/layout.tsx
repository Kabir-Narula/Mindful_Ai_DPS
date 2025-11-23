import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import DashboardNav from '@/components/dashboard/dashboard-nav'

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
    },
  })

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-[#F9F8F5]">
      <DashboardNav user={user} />
      <main className="max-w-[1600px] mx-auto py-12 px-8 md:px-16">
        {children}
      </main>
    </div>
  )
}

