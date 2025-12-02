'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Sun, ArrowRight, Sparkles, CheckCircle2, Pencil } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getTodayString } from '@/lib/timezone'

interface MorningAlignmentProps {
  existingIntention?: string | null
}

export default function MorningAlignment({ existingIntention }: MorningAlignmentProps) {
  const [intention, setIntention] = useState(existingIntention || '')
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(!existingIntention)
  const [isFocused, setIsFocused] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!intention.trim()) return

    setLoading(true)
    try {
      // Get today's date in Toronto timezone as YYYY-MM-DD string
      // Using centralized timezone utility for consistency
      const todayInToronto = getTodayString()

      const res = await fetch('/api/day-log/intention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intention, localDate: todayInToronto }),
      })

      if (!res.ok) throw new Error('Failed to save intention')

      toast({
        title: 'Alignment Set',
        description: 'Your focus for the day is locked in.',
      })
      setIsEditing(false)
      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not save intention.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (!isEditing && intention) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div
          className="relative overflow-hidden bg-gradient-to-br from-amber-50/80 via-orange-50/50 to-yellow-50/80 p-6 rounded-2xl border border-amber-200/50 cursor-pointer group transition-all duration-300 hover:shadow-lg hover:shadow-amber-100/50 hover:border-amber-300/50"
          onClick={() => setIsEditing(true)}
        >
          {/* Subtle sun rays decoration */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-amber-200/20 to-orange-200/10 blur-3xl rounded-full" />

          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-100/80 rounded-xl">
                  <Sun className="h-4 w-4 text-amber-600" />
                </div>
                <span className="font-bold uppercase tracking-widest text-xs text-amber-700/80">Today's Focus</span>
              </div>
              <motion.div
                className="flex items-center gap-1.5 text-xs text-amber-600/60 opacity-0 group-hover:opacity-100 transition-opacity"
                whileHover={{ scale: 1.05 }}
              >
                <Pencil className="h-3 w-3" />
                <span>Edit</span>
              </motion.div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-amber-500 mt-1 shrink-0" />
              <h2 className="text-xl md:text-2xl font-serif font-medium text-gray-900 leading-relaxed group-hover:text-amber-900 transition-colors">
                {intention}
              </h2>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className={`relative overflow-hidden bg-white p-8 rounded-2xl border shadow-sm transition-all duration-300 ${isFocused ? 'border-amber-300 shadow-lg shadow-amber-100/30' : 'border-gray-200'
        }`}>
        {/* Ambient decoration */}
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-gradient-to-br from-amber-100/40 to-orange-100/20 blur-3xl rounded-full" />

        <div className="relative">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="p-2 bg-amber-50 rounded-xl">
              <Sparkles className="h-4 w-4 text-amber-600" />
            </div>
            <span className="font-bold uppercase tracking-widest text-xs text-gray-500">Morning Alignment</span>
          </div>

          <h2 className="text-2xl md:text-3xl font-serif font-medium text-gray-900 mb-6 leading-snug">
            What's the <span className="italic text-amber-600">one thing</span> you want to focus on today?
          </h2>

          <form onSubmit={handleSubmit} className="flex gap-3">
            <Input
              value={intention}
              onChange={(e) => setIntention(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="e.g., Finish the presentation, exercise, call mom..."
              className="flex-1 h-14 text-lg px-5 bg-gray-50/50 border-gray-200 rounded-xl focus:bg-white focus:border-amber-300 focus:ring-2 focus:ring-amber-100 transition-all placeholder:text-gray-400"
              autoFocus
            />
            <Button
              type="submit"
              size="lg"
              disabled={loading || !intention.trim()}
              className="h-14 px-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 rounded-xl font-medium shadow-sm hover:shadow-md transition-all duration-300 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <ArrowRight className="h-5 w-5" />
              )}
            </Button>
          </form>

          <p className="text-xs text-gray-400 mt-3">
            Setting an intention helps anchor your day with purpose.
          </p>
        </div>
      </div>
    </motion.div>
  )
}

