import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Edit } from 'lucide-react'
import { format } from 'date-fns'
import { getMoodEmoji } from '@/lib/utils'
import DeleteEntryButton from '@/components/dashboard/delete-entry-button'

interface Props {
  params: {
    id: string
  }
}

export default async function JournalEntryPage({ params }: Props) {
  const authUser = await getCurrentUser()
  if (!authUser) redirect('/login')

  const entry = await prisma.journalEntry.findFirst({
    where: {
      id: params.id,
      userId: authUser.userId,
    },
  })

  if (!entry) {
    notFound()
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      {/* Editorial Header */}
      <div className="space-y-8 border-b border-gray-200 pb-8">
        <div className="flex items-center justify-between">
          <Link href="/dashboard/journal" className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors">
            ← Back to Journal
          </Link>
          <div className="flex gap-4">
            <Link href={`/dashboard/journal/${entry.id}/edit`}>
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors cursor-pointer">
                Edit
              </span>
            </Link>
            <DeleteEntryButton entryId={entry.id} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-4 text-sm text-gray-500 font-serif italic">
            <span>{format(new Date(entry.createdAt), 'MMMM dd, yyyy')}</span>
            <span>•</span>
            <span className="flex items-center gap-2">
              Mood: {getMoodEmoji(entry.moodRating)}
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-serif text-[#1A1A1A] leading-tight">
            {entry.title}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-12">
        <div className="prose prose-lg prose-gray max-w-none">
          <p className="text-xl leading-relaxed font-light text-gray-800 whitespace-pre-wrap font-serif">
            {entry.content}
          </p>
        </div>

        {/* Sidebar */}
        <div className="space-y-12">
          {entry.activities.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-gray-400 border-b border-gray-100 pb-2">
                Activities
              </h3>
              <div className="flex flex-wrap gap-2">
                {entry.activities.map((activity) => (
                  <span
                    key={activity}
                    className="px-3 py-1 border border-gray-200 text-gray-600 text-xs uppercase tracking-wider"
                  >
                    {activity}
                  </span>
                ))}
              </div>
            </div>
          )}

          {entry.feedback && (
            <div className="space-y-4 bg-gray-50 p-6">
              <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-gray-400 border-b border-gray-200 pb-2">
                AI Reflection
              </h3>
              <p className="text-sm leading-relaxed text-gray-600 italic font-serif">
                "{entry.feedback}"
              </p>
              {entry.sentimentLabel && (
                <div className="pt-2">
                  <span className="text-xs font-mono text-gray-400 uppercase">
                    Sentiment: {entry.sentimentLabel}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

