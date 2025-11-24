'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Sparkles } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export default function TriggerInsightsButton() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleTrigger = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/dashboard/insights/trigger', {
        method: 'POST',
      })
      
      if (!res.ok) throw new Error('Failed to analyze patterns')
      
      const data = await res.json()
      
      toast({
        title: 'Analysis Complete',
        description: `Found ${data.patterns.length} new patterns. Refreshing...`,
      })
      
      // Force refresh to show new data
      window.location.reload()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not analyze patterns right now.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex justify-end mb-6">
      <Button 
        onClick={handleTrigger} 
        disabled={loading}
        className={cn(
          "bg-amber-600 hover:bg-amber-700 text-white gap-2",
          loading && "opacity-80"
        )}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Analyzing Journal...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Generate New Insights
          </>
        )}
      </Button>
    </div>
  )
}

