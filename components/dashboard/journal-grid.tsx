'use client'

import { JournalEntry } from '@prisma/client'
import { format } from 'date-fns'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getMoodEmoji } from '@/lib/utils'
import { motion } from 'framer-motion'

interface JournalGridProps {
    entries: JournalEntry[]
}

export default function JournalGrid({ entries }: JournalGridProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {entries.map((entry, index) => (
                <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.4 }}
                >
                    <Link
                        href={`/dashboard/journal/${entry.id}`}
                        className="group block h-full bg-white border border-gray-100 hover:border-black transition-all duration-300"
                    >
                        <div className="p-6 h-full flex flex-col">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <span className="text-xs font-mono uppercase tracking-wider text-gray-400">
                                        {format(new Date(entry.createdAt), 'MMM dd, yyyy')}
                                    </span>
                                </div>
                                <span className="text-2xl">
                                    {getMoodEmoji(entry.moodRating)}
                                </span>
                            </div>

                            {/* Title */}
                            <h3 className="text-xl font-serif text-black mb-3 group-hover:italic transition-all line-clamp-2">
                                {entry.title}
                            </h3>

                            {/* Content Preview */}
                            <p className="text-sm text-gray-600 font-light leading-relaxed line-clamp-3 mb-4 flex-1">
                                {entry.content}
                            </p>

                            {/* Footer */}
                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
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
                                <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-black group-hover:translate-x-1 transition-all ml-auto" />
                            </div>
                        </div>
                    </Link>
                </motion.div>
            ))}
        </div>
    )
}
