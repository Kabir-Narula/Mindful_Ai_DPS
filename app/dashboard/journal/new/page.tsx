'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const MOOD_EMOJIS = [
  { value: 1, emoji: '😢', label: 'Very Low' },
  { value: 2, emoji: '😟', label: 'Low' },
  { value: 3, emoji: '😐', label: 'Neutral' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '😄', label: 'Excellent' },
]

export default function NewJournalPage() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [moodRating, setMoodRating] = useState(3) // Default to Neutral (index 2 + 1?? No, value is 3)
  // Actually let's map 1-10 to 1-5 for simplicity in this new UI or keep 1-10 but show 5 options?
  // The backend expects 1-10. Let's map the 5 emojis to 2, 4, 6, 8, 10.
  const [selectedMoodIndex, setSelectedMoodIndex] = useState(2) // Neutral

  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleMoodSelect = (index: number) => {
    setSelectedMoodIndex(index)
    // Map 0-4 index to 2, 4, 6, 8, 10 rating
    setMoodRating((index + 1) * 2)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !content.trim()) {
      toast({
        title: 'Empty Page',
        description: 'Please write something before saving.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          moodRating: (selectedMoodIndex + 1) * 2,
          activities: [], // Simplified for now, or add back if needed
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create entry')
      }

      toast({
        title: '✓ Entry Saved',
        description: 'AI is analyzing your reflection...',
      })

      // Small delay to show the toast before navigating
      setTimeout(() => {
        router.push(`/dashboard/journal/${data.id}`)
        router.refresh()
      }, 500)
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

  return (
    <div className="max-w-3xl mx-auto py-12">
      <button
        onClick={() => router.back()}
        className="group flex items-center text-sm font-medium text-gray-400 hover:text-black transition-colors mb-12"
      >
        <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        Back to Journal
      </button>

      <form onSubmit={handleSubmit} className="space-y-12">
        {/* Title Input */}
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Title your thought..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-5xl md:text-6xl font-serif placeholder:text-gray-200 border-none focus:ring-0 p-0 bg-transparent text-[#1A1A1A]"
            autoFocus
          />
        </div>

        {/* Mood Selector - Minimal */}
        <div className="flex items-center gap-6 border-y border-gray-100 py-6">
          <span className="text-xs font-bold tracking-[0.2em] uppercase text-gray-400">
            Current Mood
          </span>
          <div className="flex gap-4">
            {MOOD_EMOJIS.map((mood, index) => (
              <button
                key={mood.label}
                type="button"
                onClick={() => handleMoodSelect(index)}
                className={cn(
                  "text-2xl transition-all hover:scale-110",
                  selectedMoodIndex === index ? "opacity-100 scale-110 grayscale-0" : "opacity-30 grayscale hover:opacity-70"
                )}
                title={mood.label}
              >
                {mood.emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Content Input */}
        <div className="min-h-[400px]">
          <textarea
            placeholder="Start writing..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-full min-h-[400px] resize-none text-xl leading-relaxed font-light text-gray-800 placeholder:text-gray-300 border-none focus:ring-0 p-0 bg-transparent"
          />
        </div>

        {/* Action Bar */}
        <div className="fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-md border-t border-gray-100 py-6 px-8 md:px-16 flex justify-between items-center">
          <span className="text-xs font-mono text-gray-400">
            {content.length} characters
          </span>
          <Button
            type="submit"
            disabled={loading}
            className="h-12 px-8 bg-black text-white hover:bg-gray-800 rounded-none uppercase tracking-widest text-xs font-bold"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Publish Entry'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
