'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { JournalEntry, MoodEntry } from '@prisma/client'
import { Lightbulb, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface InsightsProps {
  entries: JournalEntry[]
  moodEntries: MoodEntry[]
  avgMood: number | null
}

export default function Insights({ entries, moodEntries, avgMood }: InsightsProps) {
  // Generate insights based on data
  const insights: { text: string; type: 'positive' | 'neutral' | 'negative' }[] = []

  if (avgMood !== null) {
    if (avgMood >= 7) {
      insights.push({
        text: 'Your mood has been positive lately. Keep it up!',
        type: 'positive',
      })
    } else if (avgMood >= 5) {
      insights.push({
        text: 'Your mood is stable. Consider what helps you feel better.',
        type: 'neutral',
      })
    } else {
      insights.push({
        text: 'Your mood seems low recently. Consider talking to someone.',
        type: 'negative',
      })
    }
  }

  if (entries.length > 3) {
    insights.push({
      text: "You're building a great journaling habit!",
      type: 'positive',
    })
  } else if (entries.length === 0) {
    insights.push({
      text: 'Start journaling to track your mental wellbeing.',
      type: 'neutral',
    })
  }

  // Check for mood trends
  if (moodEntries.length >= 3) {
    const recent = moodEntries.slice(0, 3)
    const older = moodEntries.slice(3, 6)
    const recentAvg = recent.reduce((sum, e) => sum + e.moodScore, 0) / recent.length
    const olderAvg = older.length > 0 ? older.reduce((sum, e) => sum + e.moodScore, 0) / older.length : recentAvg

    if (recentAvg > olderAvg + 1) {
      insights.push({
        text: 'Your mood is trending upward! Great progress.',
        type: 'positive',
      })
    } else if (recentAvg < olderAvg - 1) {
      insights.push({
        text: 'Your mood seems to be declining. Take care of yourself.',
        type: 'negative',
      })
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'positive':
        return <TrendingUp className="h-5 w-5 text-green-500" />
      case 'negative':
        return <TrendingDown className="h-5 w-5 text-red-500" />
      default:
        return <Minus className="h-5 w-5 text-gray-500" />
    }
  }

  const getBgColor = (type: string) => {
    switch (type) {
      case 'positive':
        return 'bg-green-50 border-green-200'
      case 'negative':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  return (
    <Card className="border-none shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          <Lightbulb className="h-6 w-6 text-amber-500" />
          Insights
        </CardTitle>
        <CardDescription className="text-base">
          Personalized observations
        </CardDescription>
      </CardHeader>
      <CardContent>
        {insights.length > 0 ? (
          <div className="space-y-4">
            {insights.map((insight, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-2 ${getBgColor(insight.type)} transition-all hover:scale-105 duration-300`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getIcon(insight.type)}
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {insight.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <Lightbulb className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Track your mood to see insights</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
