'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import PatternCard from '@/components/dashboard/pattern-card'
import { Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'

export default function PatternsPage() {
  const [patterns, setPatterns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    fetchPatterns()
  }, [])

  const fetchPatterns = async () => {
    try {
      const res = await fetch('/api/patterns')
      const data = await res.json()
      setPatterns(data.patterns || [])
    } catch (error) {
      console.error('Failed to fetch patterns:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      const res = await fetch('/api/patterns', { method: 'POST' })
      const data = await res.json()
      
      toast({
        title: 'Patterns Updated',
        description: `Detected ${data.patterns?.length || 0} patterns`,
      })
      
      await fetchPatterns()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to refresh patterns',
        variant: 'destructive',
      })
    } finally {
      setRefreshing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-200 pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400">
            <Sparkles className="h-4 w-4" />
            <span>Behavioral Insights</span>
          </div>
          <h1 className="text-6xl md:text-7xl font-serif text-[#1A1A1A] leading-none">
            Your Patterns.
          </h1>
          <p className="text-lg text-gray-500 font-light mt-4">
            AI-detected patterns in your mood, activities, and behaviors.
          </p>
        </div>
        
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          className="h-12 px-6 border-2 border-black hover:bg-black hover:text-white transition-colors disabled:opacity-50"
        >
          {refreshing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Refreshing...
            </>
          ) : (
            'Refresh Patterns'
          )}
        </Button>
      </div>

      {/* Patterns Grid */}
      {patterns.length === 0 ? (
        <div className="py-24 text-center">
          <div className="mb-8">
            <Sparkles className="h-16 w-16 mx-auto text-gray-200" />
          </div>
          <p className="text-2xl font-serif text-gray-400 italic mb-4">
            "Understanding yourself is the beginning of wisdom."
          </p>
          <p className="text-sm text-gray-500 mb-8">
            Keep journaling to help us detect meaningful patterns in your behavior.
          </p>
          <p className="text-xs uppercase tracking-widest text-gray-300">
            We need at least 5 journal entries to detect patterns
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {patterns.length} {patterns.length === 1 ? 'pattern' : 'patterns'} discovered
            </p>
            <p className="text-xs uppercase tracking-widest text-gray-400">
              Based on last 28 days
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8">
            {patterns.map((pattern: any) => (
              <PatternCard key={pattern.id} pattern={pattern} />
            ))}
          </div>

          {/* Info Card */}
          <div className="bg-[#F2F0E9] p-8 mt-12">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">
              About Pattern Detection
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Our AI analyzes your journal entries, mood data, and activities to identify behavioral patterns. 
              These insights can help you understand what affects your wellbeing and make positive changes. 
              Patterns are refreshed weekly, or you can manually refresh them above.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
