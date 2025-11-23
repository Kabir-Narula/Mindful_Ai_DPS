'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { TrendingUp, Calendar, Activity, MessageCircle, X, ChevronDown, ChevronUp } from 'lucide-react'
import { format } from 'date-fns'

interface PatternCardProps {
  pattern: {
    id: string
    type: string
    name: string
    description: string
    confidence: number
    evidence: any
    insights: string
    suggestions: string | null
    createdAt: Date
  }
}

export default function PatternCard({ pattern }: PatternCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [dismissing, setDismissing] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleDismiss = async () => {
    setDismissing(true)
    try {
      const res = await fetch(`/api/patterns/${pattern.id}/dismiss`, {
        method: 'POST',
      })

      if (!res.ok) throw new Error('Failed to dismiss pattern')

      toast({
        title: 'Pattern dismissed',
        description: 'This pattern will no longer be shown.',
      })

      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to dismiss pattern',
        variant: 'destructive',
      })
    } finally {
      setDismissing(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'temporal':
        return <Calendar className="h-5 w-5" />
      case 'activity':
        return <Activity className="h-5 w-5" />
      case 'theme':
        return <MessageCircle className="h-5 w-5" />
      case 'correlation':
        return <TrendingUp className="h-5 w-5" />
      default:
        return <TrendingUp className="h-5 w-5" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'temporal':
        return 'Time-Based Pattern'
      case 'activity':
        return 'Activity Pattern'
      case 'theme':
        return 'Emotional Theme'
      case 'correlation':
        return 'Multi-Factor Pattern'
      default:
        return 'Behavioral Pattern'
    }
  }

  const confidenceColor = pattern.confidence >= 0.8 
    ? 'text-green-600' 
    : pattern.confidence >= 0.6 
    ? 'text-yellow-600' 
    : 'text-gray-600'

  return (
    <Card className="border-2 border-gray-100 hover:border-gray-200 transition-colors overflow-hidden">
      <div className="p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-4 flex-1">
            <div className="p-3 bg-[#F2F0E9] rounded-lg">
              {getTypeIcon(pattern.type)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-2xl font-serif text-[#1A1A1A]">
                  {pattern.name}
                </h3>
                <span className={`text-xs font-bold uppercase tracking-widest ${confidenceColor}`}>
                  {Math.round(pattern.confidence * 100)}% confident
                </span>
              </div>
              <p className="text-xs uppercase tracking-widest text-gray-400">
                {getTypeLabel(pattern.type)}
              </p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            disabled={dismissing}
            className="hover:bg-red-50 hover:text-red-600"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Description */}
        <p className="text-base text-gray-700 leading-relaxed mb-6">
          {pattern.description}
        </p>

        {/* Evidence Summary */}
        {pattern.evidence && (
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">
              Evidence
            </h4>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              {pattern.evidence.dates && (
                <div>
                  <span className="font-medium">{pattern.evidence.dates.length}</span> occurrences
                </div>
              )}
              {pattern.evidence.dayOfWeek && (
                <div>
                  Every <span className="font-medium">{pattern.evidence.dayOfWeek}</span>
                </div>
              )}
              {pattern.evidence.moodScores && pattern.evidence.moodScores.length > 0 && (
                <div>
                  Avg mood: <span className="font-medium">{(pattern.evidence.moodScores.reduce((a: number, b: number) => a + b, 0) / pattern.evidence.moodScores.length).toFixed(1)}/10</span>
                </div>
              )}
            </div>
            {pattern.evidence.context && (
              <p className="text-sm text-gray-600 mt-2 italic">
                {pattern.evidence.context}
              </p>
            )}
          </div>
        )}

        {/* Insights */}
        <div className="space-y-4">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-purple-600 mb-2">
              Why This Matters
            </h4>
            <p className="text-sm text-gray-700 leading-relaxed">
              {pattern.insights}
            </p>
          </div>

          {/* Suggestions (Collapsible) */}
          {pattern.suggestions && (
            <div>
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black transition-colors"
              >
                <span>Suggested Actions</span>
                {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
              
              {expanded && (
                <div className="mt-3 p-4 bg-[#F2F0E9] rounded-lg">
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                    {pattern.suggestions}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            Detected {format(new Date(pattern.createdAt), 'MMMM dd, yyyy')}
          </p>
        </div>
      </div>
    </Card>
  )
}
