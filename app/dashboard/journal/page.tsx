import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import JournalPageContent from '@/components/dashboard/journal-page-content'

export default async function JournalPage() {
  const authUser = await getCurrentUser()
  if (!authUser) redirect('/login')

  const entries = await prisma.journalEntry.findMany({
    where: { userId: authUser.userId },
    orderBy: { createdAt: 'desc' },
  })

  return <JournalPageContent entries={entries} />
}
