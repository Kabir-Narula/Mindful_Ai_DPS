'use client'

import { JournalEntry } from '@prisma/client'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate, getMoodEmoji, getRelativeTime } from '@/lib/utils'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { Calendar, Activity, Sparkles } from 'lucide-react'

interface JournalGridProps {
  entries: JournalEntry[]
}

export default function JournalGrid({ entries }: JournalGridProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {entries.map((entry, index) => (
        <motion.div
          key={entry.id}
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            delay: index * 0.1,
            duration: 0.5,
            type: 'spring',
          }}
          onHoverStart={() => setHoveredIndex(index)}
          onHoverEnd={() => setHoveredIndex(null)}
        >
          <Link href={`/dashboard/journal/${entry.id}`}>
            <Card className="group relative overflow-hidden border-none bg-white/70 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300 h-full cursor-pointer">
                {/* Gradient Overlay */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-blue-500/10"
                  animate={{
                    opacity: hoveredIndex === index ? 1 : 0,
                  }}
                  transition={{ duration: 0.3 }}
                />

                {/* Glow Effect */}
                <motion.div
                  className="absolute -inset-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl blur-lg"
                  style={{
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(236, 72, 153, 0.3))',
                  }}
                  animate={{
                    opacity: hoveredIndex === index ? 1 : 0,
                  }}
                />

                <CardHeader className="relative">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-xl font-bold line-clamp-2 group-hover:text-purple-700 transition-colors">
                        {entry.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <span>{getRelativeTime(entry.createdAt)}</span>
                      </div>
                    </div>
                    
                    {/* Mood Emoji */}
                    <div className="text-4xl flex-shrink-0">
                      {getMoodEmoji(entry.moodRating)}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="relative">
                  {/* Content */}
                  <p className="text-sm text-gray-700 line-clamp-4 leading-relaxed mb-4">
                    {entry.content}
                  </p>

                  {/* Activities Tags */}
                  {entry.activities.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {entry.activities.slice(0, 3).map((activity, i) => (
                        <motion.span
                          key={i}
                          className="text-xs bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 px-3 py-1 rounded-full font-medium"
                          whileHover={{ scale: 1.05 }}
                        >
                          {activity}
                        </motion.span>
                      ))}
                      {entry.activities.length > 3 && (
                        <span className="text-xs text-gray-500 px-2 py-1">
                          +{entry.activities.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Sentiment Badge */}
                  {entry.sentimentLabel && (
                    <div className="flex items-center gap-2">
                      <motion.div
                        className={`inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full font-semibold ${
                          entry.sentimentLabel === 'positive'
                            ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700'
                            : entry.sentimentLabel === 'negative'
                            ? 'bg-gradient-to-r from-red-100 to-rose-100 text-red-700'
                            : 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700'
                        }`}
                        whileHover={{ scale: 1.05 }}
                      >
                        <Sparkles className="h-3 w-3" />
                        <span className="capitalize">{entry.sentimentLabel}</span>
                      </motion.div>
                    </div>
                  )}
                </CardContent>
              </Card>
          </Link>
        </motion.div>
      ))}
    </div>
  )
}

