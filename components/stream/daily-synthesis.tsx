'use client'

import { useState, useCallback, memo } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Moon, Sparkles, Check, ChevronDown, Star } from 'lucide-react'
import { useRouter } from 'next/navigation'

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

interface DailySynthesisProps {
  dayLogId: string
  morningIntention: string | null
  entriesCount: number
}

// Reflection prompts to inspire users
const REFLECTION_PROMPTS = [
  "I learned that...",
  "Today surprised me when...",
  "I'm grateful for...",
  "Tomorrow I want to...",
  "The best part of today was...",
]

// ============================================================================
// PROMPT SUGGESTION COMPONENT
// ============================================================================

const PromptSuggestion = memo(function PromptSuggestion({
  prompt,
  onSelect,
  index,
}: {
  prompt: string
  onSelect: (prompt: string) => void
  index: number
}) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <motion.button
      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => onSelect(prompt)}
      className="px-3 py-1.5 text-xs bg-background/20 hover:bg-background/30 rounded-full transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-secondary/50"
      type="button"
    >
      {prompt}
    </motion.button>
  )
})

// ============================================================================
// CHARACTER COUNTER
// ============================================================================

const CharacterCounter = memo(function CharacterCounter({
  current,
  max = 500,
}: {
  current: number
  max?: number
}) {
  const percentage = Math.min((current / max) * 100, 100)
  const isNearLimit = current > max * 0.8
  const isOverLimit = current > max

  return (
    <div className="flex items-center gap-2 text-xs">
      <div className="w-16 h-1.5 bg-background/20 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${isOverLimit ? 'bg-red-400' : isNearLimit ? 'bg-amber-400' : 'bg-secondary/60'
            }`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      <span className={`${isOverLimit ? 'text-red-300' : 'text-muted-foreground/60'}`}>
        {current}/{max}
      </span>
    </div>
  )
})

// ============================================================================
// SUCCESS ANIMATION
// ============================================================================

const SuccessAnimation = memo(function SuccessAnimation() {
  const prefersReducedMotion = useReducedMotion()

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-12 text-center"
    >
      <motion.div
        initial={prefersReducedMotion ? {} : { scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.2 }}
        className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mb-4"
      >
        <Check className="h-8 w-8 text-secondary" />
      </motion.div>

      <motion.h3
        initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-xl font-serif mb-2"
      >
        Day Closed
      </motion.h3>

      <motion.p
        initial={prefersReducedMotion ? {} : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-muted-foreground/80 text-sm"
      >
        Rest well. Tomorrow is a new opportunity. 🌙
      </motion.p>

      {/* Floating stars animation */}
      {!prefersReducedMotion && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 0, x: 0 }}
              animate={{
                opacity: 1,
                y: -100,
                x: (i - 2) * 30,
              }}
              transition={{
                duration: 2,
                delay: 0.5 + i * 0.2,
                ease: 'easeOut',
                opacity: { duration: 0.5 }
              }}
              className="absolute bottom-1/4 left-1/2"
            >
              <Star className="h-4 w-4 text-secondary/40" />
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
})

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function DailySynthesis({ dayLogId, morningIntention, entriesCount }: DailySynthesisProps) {
  const [reflection, setReflection] = useState('')
  const [loading, setLoading] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [showPrompts, setShowPrompts] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const prefersReducedMotion = useReducedMotion()

  const handlePromptSelect = useCallback((prompt: string) => {
    setReflection(prev => prev ? `${prev} ${prompt}` : prompt)
    setShowPrompts(false)
  }, [])

  const handleSave = async () => {
    if (!reflection.trim()) return
    if (reflection.length > 500) {
      toast({
        title: 'Too Long',
        description: 'Please keep your reflection under 500 characters',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)

    try {
      const res = await fetch(`/api/day-log/synthesis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dayLogId, reflection }),
      })

      if (!res.ok) throw new Error('Failed to save')

      setCompleted(true)
      toast({ title: 'Day Closed', description: 'Rest well. 🌙' })

      // Delay refresh to show animation
      setTimeout(() => router.refresh(), 2000)
    } catch {
      toast({ title: 'Error', description: 'Failed to save reflection', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  // Success state
  if (completed) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-primary text-primary-foreground p-8 rounded-xl border border-border/10 shadow-xl relative overflow-hidden"
      >
        <SuccessAnimation />
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-primary text-primary-foreground p-8 rounded-xl border border-border/10 shadow-xl relative overflow-hidden"
    >
      {/* Decorative background */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <motion.div
        className="flex items-center gap-2 text-secondary font-bold uppercase tracking-widest text-xs mb-6 relative"
        initial={prefersReducedMotion ? {} : { opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
      >
        <motion.div
          animate={prefersReducedMotion ? {} : { rotate: 10 }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            repeatType: "reverse",
            repeatDelay: 2,
            ease: "easeInOut"
          }}
        >
          <Moon className="h-4 w-4" />
        </motion.div>
        <span>Daily Synthesis</span>
      </motion.div>

      <div className="space-y-6 relative">
        {/* Title & Context */}
        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-serif mb-2">Closing the Loop</h2>
          <p className="text-muted-foreground/80 text-sm leading-relaxed">
            You started the day focusing on{' '}
            <span className="text-primary-foreground font-medium">
              "{morningIntention || 'something meaningful'}"
            </span>
            .{' '}
            <span className="text-secondary">
              {entriesCount === 0
                ? "No entries yet - that's okay!"
                : `You made ${entriesCount} ${entriesCount === 1 ? 'entry' : 'entries'} today.`
              }
            </span>
          </p>
        </motion.div>

        {/* Reflection Input */}
        <motion.div
          className="space-y-3"
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between">
            <label
              className="text-sm font-medium text-muted-foreground/80"
              htmlFor="reflection-input"
            >
              In one sentence, how did the day actually go?
            </label>
            <button
              type="button"
              onClick={() => setShowPrompts(!showPrompts)}
              className="text-xs text-secondary/80 hover:text-secondary flex items-center gap-1 transition-colors"
              aria-expanded={showPrompts}
            >
              Need inspiration?
              <ChevronDown className={`h-3 w-3 transition-transform ${showPrompts ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Prompt suggestions */}
          <AnimatePresence>
            {showPrompts && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-wrap gap-2 overflow-hidden"
              >
                {REFLECTION_PROMPTS.map((prompt, index) => (
                  <PromptSuggestion
                    key={prompt}
                    prompt={prompt}
                    onSelect={handlePromptSelect}
                    index={index}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <Textarea
            id="reflection-input"
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="I struggled at first, but..."
            className="bg-background/10 border-border/20 text-primary-foreground min-h-[100px] focus:bg-background/20 transition-colors resize-none"
            aria-describedby="reflection-counter"
            maxLength={550}
          />

          <div className="flex justify-end" id="reflection-counter">
            <CharacterCounter current={reflection.length} max={500} />
          </div>
        </motion.div>

        {/* Submit Button */}
        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            onClick={handleSave}
            disabled={loading || !reflection.trim() || reflection.length > 500}
            className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-all disabled:opacity-50 h-12"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <motion.span
                className="flex items-center gap-2"
                whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
              >
                <Sparkles className="h-4 w-4" />
                Synthesize & Close Day
              </motion.span>
            )}
          </Button>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default memo(DailySynthesis)

