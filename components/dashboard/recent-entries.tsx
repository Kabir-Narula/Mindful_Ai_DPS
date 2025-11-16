'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { JournalEntry } from '@prisma/client'
import { format } from 'date-fns'
import Link from 'next/link'
import { ArrowRight, BookOpen, Calendar, Sparkles } from 'lucide-react'
import { getMoodEmoji } from '@/lib/utils'
import { motion } from 'framer-motion'
import { useState } from 'react'

interface RecentEntriesProps {
  entries: JournalEntry[]
}

export default function RecentEntries({ entries }: RecentEntriesProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
    >
      <Card className="border-none shadow-2xl bg-white/70 backdrop-blur-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-indigo-600" />
                Recent Entries
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Your latest thoughts and reflections
              </CardDescription>
            </div>
            <Link
              href="/dashboard/journal"
              className="group text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              View all
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {entries.length > 0 ? (
            <div className="space-y-4">
              {entries.map((entry, index) => (
                <Link key={entry.id} href={`/dashboard/journal/${entry.id}`}>
                  <motion.div
                    className="relative group"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    onHoverStart={() => setHoveredIndex(index)}
                    onHoverEnd={() => setHoveredIndex(null)}
                  >
                    <motion.div
                      className="relative overflow-hidden rounded-2xl p-6 cursor-pointer"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.8))',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.3)',
                      }}
                      whileHover={{
                        scale: 1.02,
                        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                      }}
                    >
                      {/* Gradient Overlay on Hover */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10"
                        animate={{
                          opacity: hoveredIndex === index ? 1 : 0,
                        }}
                        transition={{ duration: 0.3 }}
                      />

                      <div className="relative z-10 flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          {/* Title */}
                          <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-1 group-hover:text-indigo-700 transition-colors">
                            {entry.title}
                          </h3>
                          
                          {/* Description */}
                          <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                            {entry.content}
                          </p>
                          
                          {/* Footer */}
                          <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(entry.createdAt), 'MMM dd, yyyy')}
                            </div>
                            {entry.sentiment && (
                              <motion.div
                                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700"
                                whileHover={{ scale: 1.05 }}
                              >
                                <Sparkles className="h-3 w-3" />
                                <span className="text-xs font-semibold capitalize">
                                  {entry.sentiment}
                                </span>
                              </motion.div>
                            )}
                          </div>
                        </div>
                        
                        {/* Mood Emoji */}
                        {entry.moodScore && (
                          <div className="text-5xl flex-shrink-0">
                            {getMoodEmoji(entry.moodScore)}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </motion.div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <motion.div
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <BookOpen className="h-20 w-20 mx-auto mb-4 text-indigo-400 opacity-50" />
              </motion.div>
              <p className="text-xl font-semibold text-gray-700 mb-2">No entries yet</p>
              <p className="text-sm text-gray-500 mb-8">Start documenting your thoughts and feelings</p>
              <Link href="/dashboard/journal/new">
                <motion.button
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-shadow"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <BookOpen className="h-5 w-5" />
                  Write your first entry
                  <Sparkles className="h-4 w-4" />
                </motion.button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
