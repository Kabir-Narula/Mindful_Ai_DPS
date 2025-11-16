'use client'

import { Card, CardContent } from '@/components/ui/card'
import { BookOpen, Flame, Heart } from 'lucide-react'
import { getMoodEmoji } from '@/lib/utils'
import { motion } from 'framer-motion'

interface StatsCardsProps {
  totalJournals: number
  streak: number
  avgMood: number | null
}

export default function StatsCards({ totalJournals, streak, avgMood }: StatsCardsProps) {
  const stats = [
    {
      title: 'Total Journals',
      value: totalJournals.toString(),
      description: 'Keep writing your story',
      icon: BookOpen,
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-50 to-cyan-50',
    },
    {
      title: 'Current Streak',
      value: `${streak}`,
      unit: 'days',
      description: streak > 0 ? "You're on fire!" : 'Start today',
      icon: Flame,
      gradient: 'from-orange-500 to-red-500',
      bgGradient: 'from-orange-50 to-red-50',
    },
    {
      title: 'Average Mood',
      value: avgMood !== null ? avgMood.toFixed(1) : 'N/A',
      emoji: avgMood !== null ? getMoodEmoji(Math.round(avgMood)) : '',
      description: avgMood !== null && avgMood >= 7 ? 'Feeling great!' : 'Track your mood',
      icon: Heart,
      gradient: 'from-pink-500 to-rose-500',
      bgGradient: 'from-pink-50 to-rose-50',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.3 }}
        >
          <Card className="group relative overflow-hidden border-none bg-white/70 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300 h-full">
            {/* Background Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-50 group-hover:opacity-70 transition-opacity`} />

            <CardContent className="relative pt-6 pb-6 px-6">
              {/* Icon */}
              <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${stat.gradient} mb-4 shadow-md`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>

              {/* Title */}
              <h3 className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                {stat.title}
              </h3>

              {/* Value */}
              <div className="flex items-baseline gap-2 mb-2">
                {stat.emoji && (
                  <span className="text-4xl">{stat.emoji}</span>
                )}
                <div className={`text-4xl font-black bg-gradient-to-br ${stat.gradient} bg-clip-text text-transparent`}>
                  {stat.value}
                </div>
                {stat.unit && (
                  <span className="text-xl font-semibold text-gray-400">{stat.unit}</span>
                )}
              </div>

              {/* Description */}
              <p className="text-sm text-gray-500 font-medium">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
