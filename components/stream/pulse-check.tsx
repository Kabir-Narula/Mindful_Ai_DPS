'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Zap, HeartPulse, AlertCircle, Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import ThoughtChallenge from '@/components/cbt/thought-challenge'

interface PulseCheckProps {
  userId: string
  morningIntention?: string | null
  lastMoodEntryTime?: Date | string
}

export default function PulseCheck({ userId, morningIntention, lastMoodEntryTime }: PulseCheckProps) {
  const [step, setStep] = useState<'mood' | 'intervention' | 'complete'>('mood')
  const [mood, setMood] = useState(5)
  const [loading, setLoading] = useState(false)
  const [showCBT, setShowCBT] = useState(false)
  const [minutesRemaining, setMinutesRemaining] = useState<number>(0)
  const { toast } = useToast()
  const router = useRouter()

  // Check if user can check in (limit 1 per hour)
  const canCheckIn = minutesRemaining <= 0

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
    <Card className="p-6 border border-gray-200 shadow-sm bg-white">
      <div className="flex items-center gap-2 text-purple-600 font-bold uppercase tracking-widest text-xs mb-4">
        <HeartPulse className="h-4 w-4" />
        <span>Pulse Check</span>
      </div>

      <AnimatePresence mode="wait">
        {step === 'mood' && (
          <motion.div
            key="mood"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">How's it going right now?</h3>
              <span className={`text-2xl font-bold ${mood < 5 ? 'text-red-500' : 'text-green-500'}`}>
                {mood}/10
              </span>
            </div>

            <Slider
              value={[mood]}
              onValueChange={(val) => setMood(val[0])}
              max={10}
              min={1}
              step={1}
              className="py-2"
            />

            <Button 
              onClick={handleCheckIn} 
              disabled={loading}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Check In'}
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
                    userId={userId} 
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
            <div className="mx-auto h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
              <Zap className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-bold text-gray-900">Logged.</h3>
            <p className="text-sm text-gray-500">Way to stay self-aware.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}