'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Sun, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface MorningAlignmentProps {
  userId: string
  existingIntention?: string | null
}

export default function MorningAlignment({ userId, existingIntention }: MorningAlignmentProps) {
  const [intention, setIntention] = useState(existingIntention || '')
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(!existingIntention)
  const { toast } = useToast()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!intention.trim()) return

    setLoading(true)
    try {
      // Pass current date in ISO format so server respects user's timezone
      const userDate = new Date().toISOString()
      
      const res = await fetch('/api/day-log/intention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intention, userDate }),
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
      <div 
        className="bg-secondary/50 p-6 rounded-xl border border-border cursor-pointer group transition-all hover:shadow-md"
        onClick={() => setIsEditing(true)}
      >
        <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-xs mb-2">
          <Sun className="h-4 w-4" />
          <span>Morning Alignment</span>
        </div>
        <h2 className="text-2xl font-serif font-medium text-foreground group-hover:text-primary">
          "{intention}"
        </h2>
        <p className="text-xs text-muted-foreground mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          Click to edit
        </p>
      </div>
    )
  }

  return (
    <div className="bg-card p-8 rounded-xl border border-border shadow-sm">
      <div className="flex items-center gap-2 text-muted-foreground font-bold uppercase tracking-widest text-xs mb-4">
        <Sun className="h-4 w-4" />
        <span>Good Morning</span>
      </div>
      
      <h2 className="text-3xl font-serif font-medium text-foreground mb-6">
        What is the <span className="italic text-primary">one thing</span> that matters today?
      </h2>

      <form onSubmit={handleSubmit} className="flex gap-3">
        <Input
          value={intention}
          onChange={(e) => setIntention(e.target.value)}
          placeholder="e.g., Finishing the presentation..."
          className="text-xl py-6 px-4 bg-secondary/20 border-transparent focus:bg-background transition-all"
          autoFocus
        />
        <Button 
          type="submit" 
          size="lg"
          disabled={loading || !intention.trim()}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
        </Button>
      </form>
    </div>
  )
}

