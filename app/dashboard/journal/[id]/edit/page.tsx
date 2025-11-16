'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link href={`/dashboard/journal/${params.id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-4">Edit Journal Entry</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Update your thoughts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Give your entry a title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Your thoughts *</Label>
              <Textarea
                id="content"
                placeholder="Write about your day, your feelings, or anything that's on your mind..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={loading}
                rows={10}
                className="resize-none"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mood Rating</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Mood Rating: {moodRating}/10</Label>
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
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Very Low</span>
                <span>Excellent</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {COMMON_ACTIVITIES.map((activity) => (
                <Button
                  key={activity}
                  type="button"
                  variant={activities.includes(activity) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleActivity(activity)}
                  disabled={loading}
                >
                  {activity}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}

