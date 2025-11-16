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
    <div className="min-h-screen bg-gray-50">
      <DashboardNav user={user} />
      <main className="container mx-auto py-8 px-4 md:px-6">
        {children}
      </main>
    </div>
  )
}

