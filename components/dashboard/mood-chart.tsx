'use client'

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts'
import { MoodEntry } from '@prisma/client'
import { format } from 'date-fns'
import { motion } from 'framer-motion'

interface MoodChartProps {
  moodEntries: MoodEntry[]
}

export default function MoodChart({ moodEntries }: MoodChartProps) {
  // Safety check for undefined
  if (!moodEntries || moodEntries.length === 0) {
    return (
      <div className="w-full h-[400px] bg-white p-8 border border-gray-100 flex items-center justify-center text-gray-400 font-mono text-sm">
        NO DATA AVAILABLE
      </div>
    )
  }

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
        <div className="bg-white p-3 border border-gray-200 shadow-sm">
          <p className="text-xs font-mono text-gray-500 mb-1 uppercase tracking-wider">{payload[0].payload.date}</p>
          <p className="text-sm font-serif text-black">
            Mood: {payload[0].value}/10
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="w-full h-[400px] bg-white p-8 border border-gray-100"
    >
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#000000" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#000000" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#9ca3af"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              dy={10}
              fontFamily="var(--font-lato)"
            />
            <YAxis
              stroke="#9ca3af"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              domain={[0, 10]}
              dx={-10}
              fontFamily="var(--font-lato)"
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#000000', strokeWidth: 1 }} />
            <Area
              type="monotone"
              dataKey="mood"
              stroke="#1A1A1A"
              strokeWidth={1.5}
              fill="url(#colorMood)"
              dot={{
                fill: '#1A1A1A',
                strokeWidth: 0,
                r: 3,
              }}
              activeDot={{
                r: 5,
                fill: '#1A1A1A',
                stroke: '#fff',
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-full flex items-center justify-center text-gray-400 font-mono text-sm">
          NO DATA AVAILABLE
        </div>
      )}
    </motion.div>
  )
}
