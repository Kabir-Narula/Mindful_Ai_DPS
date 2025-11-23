'use client'

import { JournalEntry } from '@prisma/client'
import { format } from 'date-fns'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getMoodEmoji } from '@/lib/utils'
import { motion } from 'framer-motion'

interface RecentEntriesProps {
  entries: JournalEntry[]
}

export default function RecentEntries({ entries }: RecentEntriesProps) {
  // Safety check for undefined
  if (!entries || entries.length === 0) {
    return (
      <div className="py-12 text-center border-b border-gray-200">
        <p className="text-gray-400 font-serif italic mb-4">"The page is blank, waiting for your story."</p>
        <Link href="/dashboard/journal/new" className="text-xs font-bold uppercase tracking-widest border-b border-black pb-1 hover:text-gray-600 transition-colors">
          Write First Entry
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-0">
      {entries.map((entry, index) => (
        <motion.div
          key={entry.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.5 }}
        >
          <Link
            href={`/dashboard/journal/${entry.id}`}
            className="group block py-8 border-b border-gray-200 hover:bg-gray-50 transition-colors -mx-4 px-4 md:mx-0 md:px-0"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">
                    {format(new Date(entry.createdAt), 'MMM dd, yyyy')}
                  </span>
                  <span className="text-lg">
                    {getMoodEmoji(entry.moodRating)}
                  </span>
                </div>
                <h3 className="text-xl font-serif text-black group-hover:text-gray-700 transition-colors">
                  {entry.title}
                </h3>
                <p className="text-sm text-gray-500 line-clamp-2 font-serif">
                  {entry.content.substring(0, 150)}
                  {entry.content.length > 150 && '...'}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                {entry.sentimentLabel && (
                  <span
                    className={`text-xs font-mono uppercase tracking-wider px-2 py-1 ${entry.sentimentLabel === 'positive'
                        ? 'text-green-700 bg-green-50'
                        : entry.sentimentLabel === 'negative'
                          ? 'text-red-700 bg-red-50'
                          : 'text-gray-600 bg-gray-50'
                      }`}
                  >
                    {entry.sentimentLabel}
                  </span>
                )}
                <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-black group-hover:translate-x-2 transition-all" />
              </div>
            </div>
          </Link>
        </motion.div>
      ))}

      <div className="pt-8">
        <Link href="/dashboard/journal" className="text-xs font-bold uppercase tracking-widest border-b border-black pb-1 hover:text-gray-600 transition-colors">
          View All Entries →
        </Link>
      </div>
    </div>
  )
}
