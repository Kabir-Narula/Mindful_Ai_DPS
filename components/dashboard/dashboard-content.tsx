'use client'

import { motion } from 'framer-motion'
import DailyBriefing from '@/components/dashboard/daily-briefing'
import MoodChart from '@/components/dashboard/mood-chart'
import RecentEntries from '@/components/dashboard/recent-entries'
import QuickActions from '@/components/dashboard/quick-actions'
import Insights from '@/components/dashboard/insights'
import SmartPromptCard from '@/components/dashboard/smart-prompt-card'

interface DashboardContentProps {
  user: {
    name: string | null
    createdAt: Date
  } | null
  totalJournals: number
  streak: number
  avgMood: number | null
  moodEntries: any[]
  journalEntries: any[]
  dayLog: any // Using any for now to bypass strict type check until Prisma types update
}

export default function DashboardContent({
  user,
  totalJournals,
  streak,
  avgMood,
  moodEntries,
  journalEntries,
  dayLog
}: DashboardContentProps) {
  if (!user) return null

  return (
    <div className="space-y-16 animate-fade-in">
      {/* Daily Briefing (Morning Intention & Insight) */}
      <DailyBriefing user={user} dayLog={dayLog} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Column: Activity & Trends */}
        <div className="lg:col-span-2 space-y-12">
          <section>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-serif text-[#1A1A1A]">Recent Stories</h2>
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
                {totalJournals} Entries
              </span>
            </div>
            <RecentEntries entries={journalEntries} />
          </section>

          <section>
            <h2 className="text-2xl font-serif text-[#1A1A1A] mb-8">Mood Trends</h2>
            <MoodChart moodEntries={moodEntries || []} />
          </section>
        </div>

        {/* Right Column: Quick Actions & Insights */}
        <div className="space-y-12">
          <SmartPromptCard />
          
          <QuickActions />

          <div className="bg-white p-8 border border-gray-100">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6">
              Weekly Insights
            </h3>
            <Insights
              entries={journalEntries}
              avgMood={avgMood}
              streak={streak}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
