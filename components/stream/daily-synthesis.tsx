'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Moon, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface DailySynthesisProps {
  dayLogId: string
  morningIntention: string | null
  entriesCount: number
}

export default function DailySynthesis({ dayLogId, morningIntention, entriesCount }: DailySynthesisProps) {
  const [reflection, setReflection] = useState('')
  const [loading, setLoading] = useState(false)
  const [completed, setCompleted] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleSave = async () => {
    if (!reflection.trim()) return
    setLoading(true)
    
    try {
      // We'll use a new endpoint for this, or repurpose day-log update
      // Since we added eveningReflection to schema, let's update DayLog
      const res = await fetch(`/api/day-log/synthesis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dayLogId, reflection }),
      })

      if (!res.ok) throw new Error('Failed to save')

      setCompleted(true)
      toast({ title: 'Day Closed', description: 'Rest well.' })
      router.refresh()
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save reflection', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  if (completed) return null // Hide after completion

  return (
    <div className="bg-primary text-primary-foreground p-8 rounded-xl border border-border/10 shadow-xl">
      <div className="flex items-center gap-2 text-secondary font-bold uppercase tracking-widest text-xs mb-6">
        <Moon className="h-4 w-4" />
        <span>Daily Synthesis</span>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-serif mb-2">Closing the Loop</h2>
          <p className="text-muted-foreground/80 text-sm leading-relaxed">
            You started the day focusing on <span className="text-primary-foreground font-medium">"{morningIntention || 'something'}"</span>. 
            You made {entriesCount} entries today.
          </p>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-muted-foreground/80">
            In one sentence, how did the day actually go?
          </label>
          <Textarea 
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="I struggled at first, but..."
            className="bg-background/10 border-border/20 text-primary-foreground min-h-[100px] focus:bg-background/20"
          />
        </div>

        <Button 
          onClick={handleSave}
          disabled={loading || !reflection.trim()}
          className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
            <span className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Synthesize & Close Day
            </span>
          )}
        </Button>
      </div>
    </div>
  )
}

