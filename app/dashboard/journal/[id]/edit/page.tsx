'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const COMMON_ACTIVITIES = [
  'Exercise', 'Work', 'Social', 'Family', 'Meditation', 'Reading',
  'Cooking', 'Sleep', 'Hobby', 'Nature', 'Music', 'Therapy'
]

export default function EditJournalPage() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [moodRating, setMoodRating] = useState(5)
  const [activities, setActivities] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()

  useEffect(() => {
    const fetchEntry = async () => {
      try {
        const res = await fetch(`/api/journal/${params.id}`)
        if (!res.ok) throw new Error('Failed to fetch entry')

        const data = await res.json()
        setTitle(data.title)
        setContent(data.content)
        setMoodRating(data.moodRating)
        setActivities(data.activities || [])
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        })
        router.push('/dashboard/journal')
      } finally {
        setFetching(false)
      }
    }

    fetchEntry()
  }, [params.id, router, toast])

  const toggleActivity = (activity: string) => {
    setActivities(prev =>
      prev.includes(activity)
        ? prev.filter(a => a !== activity)
        : [...prev, activity]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !content.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      const res = await fetch(`/api/journal/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          moodRating,
          activities,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to update entry')
      }

      toast({
        title: 'Entry updated!',
        description: 'Your journal entry has been saved.',
      })

      router.push(`/dashboard/journal/${params.id}`)
      router.refresh()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <Link href={`/dashboard/journal/${params.id}`} className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors">
          ← Cancel Editing
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-12">
        {/* Title Input */}
        <div className="space-y-2">
          <Input
            id="title"
            placeholder="Title your story..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading}
            className="text-5xl md:text-6xl font-serif border-none px-0 placeholder:text-gray-200 focus-visible:ring-0 bg-transparent h-auto py-4"
          />
        </div>

        {/* Mood Selection */}
        <div className="space-y-4 border-y border-gray-100 py-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
              Current Mood
            </span>
            <span className="text-2xl">
              {moodRating >= 9 ? '😄' : moodRating >= 7 ? '😊' : moodRating >= 5 ? '😐' : moodRating >= 3 ? '😟' : '😢'}
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={moodRating}
            onChange={(e) => setMoodRating(Number(e.target.value))}
            disabled={loading}
            className="w-full h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-black"
          />
          <div className="flex justify-between text-xs font-mono text-gray-400 uppercase">
            <span>Low</span>
            <span>High</span>
          </div>
        </div>

        {/* Content Input */}
        <div className="space-y-2">
          <Textarea
            id="content"
            placeholder="Start writing..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={loading}
            rows={15}
            className="resize-none border-none px-0 text-xl leading-relaxed font-light font-serif focus-visible:ring-0 bg-transparent placeholder:text-gray-200"
          />
        </div>

        {/* Activities */}
        <div className="space-y-4 pt-8 border-t border-gray-100">
          <span className="text-xs font-bold uppercase tracking-widest text-gray-400 block mb-4">
            Activities
          </span>
          <div className="flex flex-wrap gap-2">
            {COMMON_ACTIVITIES.map((activity) => (
              <button
                key={activity}
                type="button"
                onClick={() => toggleActivity(activity)}
                disabled={loading}
                className={cn(
                  "px-4 py-2 text-xs uppercase tracking-wider transition-all border",
                  activities.includes(activity)
                    ? "bg-black text-white border-black"
                    : "bg-transparent text-gray-500 border-gray-200 hover:border-black hover:text-black"
                )}
              >
                {activity}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-8">
          <Button
            type="submit"
            disabled={loading}
            className="bg-black text-white hover:bg-gray-800 rounded-none uppercase tracking-widest text-xs font-bold h-12 px-8"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  )
}

