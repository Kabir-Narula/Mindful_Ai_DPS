'use client'

import { JournalEntry } from '@prisma/client'

interface InsightsProps {
  entries: JournalEntry[]
  avgMood: number | null
  streak: number
}

export default function Insights({ entries, avgMood, streak }: InsightsProps) {
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

  // Check for streak
  if (streak >= 7) {
    insights.push({
      text: `${streak} day streak! You're on fire!`,
      type: 'positive',
    })
  } else if (streak >= 3) {
    insights.push({
      text: `${streak} days in a row. Keep the momentum!`,
      type: 'positive',
    })
  }

  return (
    <div className="space-y-6">
      {insights.length > 0 ? (
        insights.map((insight, index) => (
          <div key={index} className="flex gap-4 items-start">
            <span className="text-xs font-mono text-gray-300 mt-1">0{index + 1}</span>
            <p className="text-sm text-gray-600 font-light leading-relaxed">
              {insight.text}
            </p>
          </div>
        ))
      ) : (
        <p className="text-sm text-gray-400 italic">No insights available yet.</p>
      )}
    </div>
  )
}
