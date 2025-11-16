import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Edit, Trash2 } from 'lucide-react'
import { formatDate, getMoodEmoji } from '@/lib/utils'
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
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/dashboard/journal">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Journal
          </Button>
        </Link>
        <div className="flex gap-2">
          <Link href={`/dashboard/journal/${entry.id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <DeleteEntryButton entryId={entry.id} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">{entry.title}</CardTitle>
              <p className="text-sm text-muted-foreground">{formatDate(entry.createdAt)}</p>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-4xl mb-1">{getMoodEmoji(entry.moodRating)}</span>
              <span className="text-sm font-medium">{entry.moodRating}/10</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Entry</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{entry.content}</p>
          </div>

          {entry.activities.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Activities</h3>
              <div className="flex flex-wrap gap-2">
                {entry.activities.map((activity) => (
                  <span
                    key={activity}
                    className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm"
                  >
                    {activity}
                  </span>
                ))}
              </div>
            </div>
          )}

          {entry.feedback && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold mb-2 flex items-center text-purple-900">
                <span className="mr-2">💭</span>
                AI Insights
              </h3>
              <p className="text-sm text-purple-800">{entry.feedback}</p>
              {entry.sentimentLabel && (
                <div className="mt-3">
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      entry.sentimentLabel === 'positive'
                        ? 'bg-green-100 text-green-800'
                        : entry.sentimentLabel === 'negative'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    Sentiment: {entry.sentimentLabel}
                  </span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

