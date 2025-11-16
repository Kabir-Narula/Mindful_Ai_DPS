'use client'

import { JournalEntry } from '@prisma/client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, BookOpen, Sparkles, PenLine } from 'lucide-react'
import JournalGrid from './journal-grid'
import { JournalCardSkeleton } from '@/components/ui/loading-skeleton'
import { motion } from 'framer-motion'

interface JournalPageContentProps {
  entries: JournalEntry[]
}

export default function JournalPageContent({ entries }: JournalPageContentProps) {
  return (
    <div className="space-y-8">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 p-8 md:p-12 shadow-2xl">
          {/* Animated Background */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-96 h-96 bg-pink-400 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-400 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>

          <div className="relative z-10 flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center gap-3 mb-3">
                <BookOpen className="h-10 w-10 text-white" />
                <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
                  Journal
                </h1>
              </div>
              <p className="text-xl text-white/90 drop-shadow">
                Your personal reflection space
              </p>
              <div className="mt-4 flex items-center gap-2 text-white/80">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {entries.length} {entries.length === 1 ? 'entry' : 'entries'} recorded
                </span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Link href="/dashboard/journal/new">
                <Button
                  size="lg"
                  className="bg-white text-purple-700 hover:bg-white/90 shadow-xl hover:shadow-2xl transition-all font-semibold h-14 px-8"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  New Entry
                  <PenLine className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Content */}
        {entries.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center justify-center py-24 px-4"
          >
            <div className="max-w-2xl mx-auto text-center">
              {/* Icon */}
              <div className="mb-8">
                <div className="inline-flex p-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 shadow-2xl">
                  <BookOpen className="h-20 w-20 text-white" />
                </div>
              </div>

              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Start Your Journaling Journey
              </h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Writing helps you process emotions, track patterns, and gain insights into your mental wellbeing.
                Your first entry is just a click away.
              </p>

              {/* Benefits */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                {[
                  { emoji: '📝', text: 'Express yourself freely' },
                  { emoji: '🧠', text: 'Gain self-awareness' },
                  { emoji: '💜', text: 'Track your growth' },
                ].map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="p-4 rounded-xl bg-white/70 backdrop-blur-sm border border-gray-200 shadow-sm"
                  >
                    <div className="text-3xl mb-2">{benefit.emoji}</div>
                    <p className="text-sm font-medium text-gray-700">{benefit.text}</p>
                  </motion.div>
                ))}
              </div>

              <Link href="/dashboard/journal/new">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-xl hover:shadow-2xl transition-all h-16 px-10 text-lg group"
                  >
                    <Plus className="h-6 w-6 mr-3 group-hover:rotate-90 transition-transform" />
                    Write Your First Entry
                    <Sparkles className="h-5 w-5 ml-3" />
                  </Button>
                </motion.div>
              </Link>
            </div>
          </motion.div>
        ) : (
          <JournalGrid entries={entries} />
        )}
      </div>
  )
}

