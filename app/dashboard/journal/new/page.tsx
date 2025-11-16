'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, PenLine, Sparkles, Heart, Check } from 'lucide-react'
import { motion } from 'framer-motion'

const COMMON_ACTIVITIES = [
  { name: 'Exercise', emoji: '💪' },
  { name: 'Work', emoji: '💼' },
  { name: 'Social', emoji: '👥' },
  { name: 'Family', emoji: '👨‍👩‍👧‍👦' },
  { name: 'Meditation', emoji: '🧘' },
  { name: 'Reading', emoji: '📚' },
  { name: 'Cooking', emoji: '🍳' },
  { name: 'Sleep', emoji: '😴' },
  { name: 'Hobby', emoji: '🎨' },
  { name: 'Nature', emoji: '🌳' },
  { name: 'Music', emoji: '🎵' },
  { name: 'Therapy', emoji: '💭' },
]

const MOOD_EMOJIS = [
  { range: [1, 2], emoji: '😢', color: 'from-red-500 to-rose-500', label: 'Very Low' },
  { range: [3, 4], emoji: '😟', color: 'from-orange-500 to-amber-500', label: 'Low' },
  { range: [5, 6], emoji: '😐', color: 'from-yellow-500 to-amber-500', label: 'Neutral' },
  { range: [7, 8], emoji: '😊', color: 'from-green-500 to-emerald-500', label: 'Good' },
  { range: [9, 10], emoji: '😄', color: 'from-blue-500 to-cyan-500', label: 'Excellent' },
]

export default function NewJournalPage() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [moodRating, setMoodRating] = useState(5)
  const [activities, setActivities] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const getMoodInfo = (rating: number) => {
    return MOOD_EMOJIS.find(m => rating >= m.range[0] && rating <= m.range[1]) || MOOD_EMOJIS[2]
  }

  const currentMood = getMoodInfo(moodRating)

  const toggleActivity = (activity: string) => {
    setActivities(prev =>
      prev.includes(activity)
        ? prev.filter(a => a !== activity)
        : [...prev, activity]
    )
  }

  const [errors, setErrors] = useState<{
    title?: string
    content?: string
    moodRating?: string
  }>({})

  const validateForm = () => {
    const newErrors: typeof errors = {}

    if (!title.trim()) {
      newErrors.title = 'Title is required'
    } else if (title.trim().length > 200) {
      newErrors.title = 'Title must be 200 characters or less'
    }

    if (!content.trim()) {
      newErrors.content = 'Content is required'
    } else if (content.trim().length > 10000) {
      newErrors.content = 'Content must be 10,000 characters or less'
    }

    if (!moodRating || moodRating < 1 || moodRating > 10) {
      newErrors.moodRating = 'Please select a valid mood rating'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors in the form',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    setErrors({})

    try {
      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          moodRating,
          activities,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create entry')
      }

      toast({
        title: 'Entry created!',
        description: 'Your journal entry has been saved.',
      })

      router.push(`/dashboard/journal/${data.id}`)
      router.refresh()
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to create entry. Please try again.'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
      
      // Set field-specific errors if available
      if (errorMessage.includes('Title')) {
        setErrors(prev => ({ ...prev, title: errorMessage }))
      } else if (errorMessage.includes('Content')) {
        setErrors(prev => ({ ...prev, content: errorMessage }))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 p-8 md:p-10 shadow-2xl"
        >
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-64 h-64 bg-pink-400 rounded-full blur-3xl animate-pulse" />
          </div>
          
          <div className="relative z-10 flex items-center gap-4">
            <PenLine className="h-12 w-12 text-white" />
            <div>
              <h1 className="text-4xl font-bold text-white drop-shadow-lg">
                New Journal Entry
              </h1>
              <p className="text-lg text-white/90 drop-shadow">
                Take a moment to reflect on your day
              </p>
            </div>
          </div>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Main Content Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Card className="border-none shadow-xl bg-white/70 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-purple-600" />
                  What's on your mind?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="title" className="text-base font-semibold">Title *</Label>
                    <span className="text-sm text-gray-500">{title.length}/200</span>
                  </div>
                  <Input
                    id="title"
                    placeholder="Give your entry a title..."
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value)
                      if (errors.title) setErrors(prev => ({ ...prev, title: undefined }))
                    }}
                    disabled={loading}
                    className={`h-14 text-lg border-2 ${
                      errors.title 
                        ? 'border-red-500 focus:border-red-500' 
                        : 'focus:border-purple-500'
                    }`}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-600">{errors.title}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="content" className="text-base font-semibold">Your thoughts *</Label>
                    <span className={`text-sm ${
                      content.length > 10000 ? 'text-red-600' : 'text-gray-500'
                    }`}>
                      {content.length}/10,000
                    </span>
                  </div>
                  <Textarea
                    id="content"
                    placeholder="Write about your day, your feelings, or anything that's on your mind..."
                    value={content}
                    onChange={(e) => {
                      setContent(e.target.value)
                      if (errors.content) setErrors(prev => ({ ...prev, content: undefined }))
                    }}
                    disabled={loading}
                    rows={12}
                    className={`resize-none text-base border-2 leading-relaxed ${
                      errors.content 
                        ? 'border-red-500 focus:border-red-500' 
                        : 'focus:border-purple-500'
                    }`}
                  />
                  {errors.content && (
                    <p className="text-sm text-red-600">{errors.content}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Mood Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="border-none shadow-xl bg-white/70 backdrop-blur-xl overflow-hidden">
              {/* Gradient Header */}
              <div className={`bg-gradient-to-r ${currentMood.color} p-1`} />
              
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Heart className="h-6 w-6 text-pink-600" />
                  How are you feeling?
                </CardTitle>
                <CardDescription className="text-base">
                  Rate your overall mood today
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-center gap-6 p-6 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100">
                  <div className="text-8xl">
                    {currentMood.emoji}
                  </div>
                  <div>
                    <div className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                      {moodRating}/10
                    </div>
                    <div className="text-lg font-semibold text-gray-700 mt-1">
                      {currentMood.label}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={moodRating}
                    onChange={(e) => setMoodRating(Number(e.target.value))}
                    disabled={loading}
                    className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                  <div className="flex justify-between text-sm font-medium text-gray-600">
                    <span>😢 Very Low</span>
                    <span>😄 Excellent</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Activities Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card className="border-none shadow-xl bg-white/70 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  🎯 Activities
                </CardTitle>
                <CardDescription className="text-base">
                  What did you do today? ({activities.length} selected)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {COMMON_ACTIVITIES.map((activity, index) => (
                    <motion.div
                      key={activity.name}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Button
                        type="button"
                        variant={activities.includes(activity.name) ? 'default' : 'outline'}
                        size="lg"
                        onClick={() => toggleActivity(activity.name)}
                        disabled={loading}
                        className={`group relative overflow-hidden ${
                          activities.includes(activity.name)
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg'
                            : 'hover:border-purple-500'
                        }`}
                      >
                        <span className="text-xl mr-2">{activity.emoji}</span>
                        {activity.name}
                        {activities.includes(activity.name) && (
                          <Check className="h-4 w-4 ml-2" />
                        )}
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Submit Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex gap-4"
          >
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 h-14 text-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-xl hover:shadow-2xl transition-all group"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Saving your thoughts...
                </>
              ) : (
                <>
                  <PenLine className="mr-2 h-5 w-5" />
                  Save Entry
                  <Sparkles className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
              className="h-14 px-8 text-lg border-2"
            >
              Cancel
            </Button>
          </motion.div>
        </form>
      </div>
  )
}
