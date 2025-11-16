'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts'
import { MoodEntry } from '@prisma/client'
import { format } from 'date-fns'
import { TrendingUp, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

interface MoodChartProps {
  moodEntries: MoodEntry[]
}

export default function MoodChart({ moodEntries }: MoodChartProps) {
  // Prepare data for the chart
  const chartData = moodEntries
    .slice(0, 14)
    .reverse()
    .map((entry) => ({
      date: format(new Date(entry.createdAt), 'MMM dd'),
      mood: entry.moodScore,
    }))

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/90 backdrop-blur-xl p-4 rounded-xl shadow-2xl border border-white/20">
          <p className="text-sm font-semibold text-gray-900 mb-1">{payload[0].payload.date}</p>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
            <p className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Mood: {payload[0].value}/10
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
    >
      <Card className="border-none shadow-2xl bg-white/70 backdrop-blur-xl overflow-hidden">
        {/* Gradient Header */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-rose-500/10" />
          <CardHeader className="relative">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-purple-600" />
                  Mood Journey
                </CardTitle>
                <CardDescription className="text-base mt-2">
                  Your emotional landscape over the past 14 days
                </CardDescription>
              </div>
              <motion.div
                className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm">Trending</span>
              </motion.div>
            </div>
          </CardHeader>
        </div>

        <CardContent className="pt-6">
          {chartData.length > 0 ? (
            <div className="relative">
              {/* Animated Background Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-purple-50/50 to-transparent rounded-xl" />
              
              <div className="relative h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0.1} />
                      </linearGradient>
                      <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="50%" stopColor="#a855f7" />
                        <stop offset="100%" stopColor="#ec4899" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                    <XAxis
                      dataKey="date"
                      stroke="#9ca3af"
                      fontSize={12}
                      tickLine={false}
                      axisLine={{ stroke: '#e5e7eb' }}
                      dy={10}
                    />
                    <YAxis
                      stroke="#9ca3af"
                      fontSize={12}
                      tickLine={false}
                      axisLine={{ stroke: '#e5e7eb' }}
                      domain={[0, 10]}
                      dx={-10}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#a855f7', strokeWidth: 2 }} />
                    <Area
                      type="monotone"
                      dataKey="mood"
                      stroke="url(#strokeGradient)"
                      strokeWidth={3}
                      fill="url(#colorMood)"
                      dot={{
                        fill: '#a855f7',
                        strokeWidth: 3,
                        r: 6,
                        stroke: '#fff',
                      }}
                      activeDot={{
                        r: 8,
                        fill: '#ec4899',
                        stroke: '#fff',
                        strokeWidth: 3,
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

            </div>
          ) : (
            <div className="h-80 flex items-center justify-center">
              <div className="text-center">
                <TrendingUp className="h-20 w-20 mx-auto mb-4 text-purple-400 opacity-50" />
                <p className="text-lg font-semibold text-gray-600 mb-2">No mood data yet</p>
                <p className="text-sm text-gray-500">Start tracking to see your emotional journey</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
