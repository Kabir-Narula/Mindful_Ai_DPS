import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import ChatPageContent from '@/components/dashboard/chat-page-content'

export default async function ChatPage() {
  const authUser = await getCurrentUser()
  if (!authUser) redirect('/login')

  // Get recent journal entries with feedback
  const recentEntries = await prisma.journalEntry.findMany({
    where: { userId: authUser.userId },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      title: true,
      content: true,
      moodRating: true,
      sentimentLabel: true,
      feedback: true,
      createdAt: true,
    },
  })

  return <ChatPageContent recentEntries={recentEntries} />
}
