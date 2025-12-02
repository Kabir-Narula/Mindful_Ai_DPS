'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Zap, HeartPulse, AlertCircle, Clock, CheckCircle2, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import ThoughtChallenge from '@/components/cbt/thought-challenge'

interface PulseCheckProps {
  morningIntention?: string | null
  lastMoodEntryTime?: Date | string
}

// Mood emoji mapping for visual feedback
const getMoodEmoji = (score: number) => {
  if (score >= 9) return '🌟'
  if (score >= 7) return '😊'
  if (score >= 5) return '😐'
  if (score >= 3) return '😔'
  return '😢'
}

const getMoodLabel = (score: number) => {
  if (score >= 9) return 'Excellent'
  if (score >= 7) return 'Good'
  if (score >= 5) return 'Okay'
  if (score >= 3) return 'Low'
  return 'Struggling'
}

const getMoodColor = (score: number) => {
  if (score >= 7) return 'text-emerald-500'
  if (score >= 5) return 'text-amber-500'
  return 'text-rose-500'
}

export default function PulseCheck({ morningIntention, lastMoodEntryTime }: PulseCheckProps) {
  const [step, setStep] = useState<'mood' | 'intervention' | 'complete'>('mood')
  const [mood, setMood] = useState(5)
  const [loading, setLoading] = useState(false)
  const [showCBT, setShowCBT] = useState(false)
  const [minutesRemaining, setMinutesRemaining] = useState<number>(0)
  const { toast } = useToast()
  const router = useRouter()

  // Check if user can check in (limit 1 per 15 seconds for dev, 1 per hour for prod)
  const canCheckIn = minutesRemaining <= 0

  // Memoize mood visual properties
  const moodVisuals = useMemo(() => ({
    emoji: getMoodEmoji(mood),
    label: getMoodLabel(mood),
    color: getMoodColor(mood)
  }), [mood])

  useEffect(() => {
    if (!lastMoodEntryTime) {
      setMinutesRemaining(0)
      return
    }

    const checkTime = () => {
      const lastTime = new Date(lastMoodEntryTime).getTime()
      const now = new Date().getTime()
      const diffSeconds = (now - lastTime) / 1000

      if (diffSeconds < 15) {
        setMinutesRemaining(Math.ceil(15 - diffSeconds))
      } else {
        setMinutesRemaining(0)
      }
    }

    checkTime()
    // Update every second
    const interval = setInterval(checkTime, 1000)
    return () => clearInterval(interval)
  }, [lastMoodEntryTime])

  const handleCheckIn = async () => {
    if (!canCheckIn) return

    // Optimistic update
    const previousStep = step
    setStep(mood < 5 ? 'intervention' : 'complete')
    setLoading(true) // Keep loading true to prevent double clicks but we already changed UI

    try {
      // 1. Save Mood Snapshot
      const res = await fetch('/api/mood/snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: mood,
          type: 'pulse-check',
          context: morningIntention ? `Context: ${morningIntention}` : 'Routine Check-in'
        }),
      })

      if (!res.ok) throw new Error('Failed to save')

      if (mood >= 5) {
        setTimeout(() => {
          setStep('mood') // Reset after delay
          setMood(5)
        }, 3000)
        router.refresh()
      }
    } catch (error) {
      // Rollback on error
      setStep(previousStep)
      toast({ title: 'Error', description: 'Failed to save check-in', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  if (!canCheckIn) {
    return (
      <Card className="p-6 border border-gray-200 shadow-sm bg-gray-50/50">
        <div className="flex items-center gap-2 text-gray-400 font-bold uppercase tracking-widest text-xs mb-4">
          <HeartPulse className="h-4 w-4" />
          <span>Pulse Check</span>
        </div>
        <div className="text-center py-6 space-y-2">
          <div className="mx-auto h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
            <Clock className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium">Check back in {minutesRemaining}s</p>
          <p className="text-xs text-gray-400">We limit check-ins to keep it meaningful.</p>
        </div>
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className="relative overflow-hidden p-6 border border-gray-200/80 shadow-sm bg-white hover:shadow-md transition-shadow duration-300">
        {/* Subtle gradient accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-violet-500 to-purple-600" />

        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-50 rounded-xl">
              <HeartPulse className="h-4 w-4 text-purple-600" />
            </div>
            <span className="font-bold uppercase tracking-widest text-xs text-gray-500">Pulse Check</span>
          </div>
          {step === 'mood' && (
            <motion.div
              className="flex items-center gap-1.5"
              key={mood}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <span className="text-2xl">{moodVisuals.emoji}</span>
            </motion.div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {step === 'mood' && (
            <motion.div
              key="mood"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              <div>
                <div className="flex justify-between items-baseline mb-2">
                  <h3 className="text-lg font-serif font-medium text-gray-900">How are you feeling right now?</h3>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-2xl font-bold ${moodVisuals.color}`}>
                      {mood}
                    </span>
                    <span className="text-sm text-gray-400">/10</span>
                  </div>
                </div>
                <p className={`text-sm font-medium ${moodVisuals.color}`}>
                  {moodVisuals.label}
                </p>
              </div>

              {/* Enhanced Slider with visual scale */}
              <div className="space-y-3">
                <Slider
                  value={[mood]}
                  onValueChange={(val) => setMood(val[0])}
                  max={10}
                  min={1}
                  step={1}
                  className="py-2"
                />
                <div className="flex justify-between text-[10px] font-medium text-gray-400 px-1">
                  <span>Struggling</span>
                  <span>Neutral</span>
                  <span>Thriving</span>
                </div>
              </div>

              <Button
                onClick={handleCheckIn}
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-purple-600 to-violet-600 text-white hover:from-purple-700 hover:to-violet-700 rounded-xl font-medium transition-all duration-300 shadow-sm hover:shadow-md"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Log Check-in
                  </span>
                )}
              </Button>
            </motion.div>
          )}

          {step === 'intervention' && !showCBT && (
            <motion.div
              key="intervention"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="bg-red-50 p-4 rounded-lg border border-red-100 flex gap-3 items-start">
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-red-700">Friction Detected</h4>
                  <p className="text-sm text-red-600/80 mt-1">
                    You seem stressed.
                    {morningIntention && <span> Is this related to <strong>"{morningIntention}"</strong>?</span>}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={() => {
                  setStep('complete')
                  router.refresh()
                }}>
                  No, I'm fine
                </Button>
                <Button
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
                  onClick={() => setShowCBT(true)}
                >
                  <Zap className="h-4 w-4" />
                  Fix This
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'intervention' && showCBT && (
            <motion.div
              key="cbt"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <ThoughtChallenge
                onClose={() => {
                  setShowCBT(false)
                  setStep('complete')
                  router.refresh()
                }}
              />
            </motion.div>
          )}

          {step === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <motion.div
                className="mx-auto h-14 w-14 bg-gradient-to-br from-emerald-100 to-green-100 rounded-2xl flex items-center justify-center mb-4 shadow-sm"
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.1 }}
              >
                <Sparkles className="h-7 w-7 text-emerald-600" />
              </motion.div>
              <h3 className="font-serif font-bold text-xl text-gray-900 mb-1">Logged!</h3>
              <p className="text-sm text-gray-500">Great job staying self-aware.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  )
}