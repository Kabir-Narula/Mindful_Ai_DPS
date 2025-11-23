'use client'

import { JournalEntry } from '@prisma/client'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import JournalGrid from './journal-grid'
import { motion } from 'framer-motion'

interface JournalPageContentProps {
  entries: JournalEntry[]
}

export default function JournalPageContent({ entries }: JournalPageContentProps) {
  return (
    <div className="space-y-12">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-200 pb-8">
        <div className="space-y-2">
          <span className="text-xs font-bold tracking-[0.2em] uppercase text-gray-400">
            Archive
          </span>
          <h1 className="text-6xl md:text-7xl font-serif text-[#1A1A1A] leading-none">
            The Journal.
          </h1>
        </div>
        <Link
          href="/dashboard/journal/new"
          className="inline-flex items-center justify-center h-12 px-8 bg-black text-white text-sm uppercase tracking-widest hover:bg-gray-800 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Entry
        </Link>
      </div>

      {/* Content */}
      {entries.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-2xl font-serif text-gray-400 italic mb-8">
            "Every journey begins with a single word."
          </p>
          <Link
            href="/dashboard/journal/new"
            className="text-sm font-bold uppercase tracking-widest border-b border-black pb-1 hover:text-gray-600 transition-colors"
          >
            Start Writing
          </Link>
        </div>
      ) : (
        <JournalGrid entries={entries} />
      )}
    </div>
  )
}

