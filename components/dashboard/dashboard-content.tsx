'use client'

import { JournalEntry, MoodEntry } from '@prisma/client'
import MoodChart from '@/components/dashboard/mood-chart'
import RecentEntries from '@/components/dashboard/recent-entries'
import StatsCards from '@/components/dashboard/stats-cards'
import Insights from '@/components/dashboard/insights'
import QuickActions from '@/components/dashboard/quick-actions'
interface DashboardContentProps {
  user: {
    name: string | null
  } | null
  totalJournals: number
  streak: number
  avgMood: number | null
  moodEntries: MoodEntry[]
  journalEntries: JournalEntry[]
}

export default function DashboardContent({
  user,
  totalJournals,
  streak,
  avgMood,
  moodEntries,
  journalEntries,
}: DashboardContentProps) {
  return (
    <div className="min-h-[calc(100vh-4rem)]">
        {/* Hero Section with Mesh Gradient */}
        <div className="relative mb-10 rounded-3xl overflow-hidden shadow-2xl">
          {/* Animated Mesh Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 opacity-90">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3), transparent 50%), radial-gradient(circle at 80% 80%, rgba(255, 105, 180, 0.3), transparent 50%), radial-gradient(circle at 40% 20%, rgba(138, 43, 226, 0.3), transparent 50%)',
              animation: 'mesh 20s ease-in-out infinite',
            }} />
          </div>

          {/* Glow Effects */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-400/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-400/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

          {/* Content */}
          <div className="relative z-10 px-8 md:px-12 py-12 md:py-16">
            <div className="max-w-4xl">
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 drop-shadow-lg">
                Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}! 👋
              </h1>
              <p className="text-xl md:text-2xl text-white/90 font-medium drop-shadow">
                Here's your mental wellbeing journey at a glance
              </p>
              
              {/* Floating Stats Preview */}
              <div className="mt-8 flex flex-wrap gap-4">
                <div className="px-6 py-3 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white font-semibold shadow-lg hover:bg-white/30 transition-all cursor-default">
                  📚 {totalJournals} Journals
                </div>
                <div className="px-6 py-3 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white font-semibold shadow-lg hover:bg-white/30 transition-all cursor-default">
                  🔥 {streak} Day Streak
                </div>
                {avgMood && (
                  <div className="px-6 py-3 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white font-semibold shadow-lg hover:bg-white/30 transition-all cursor-default">
                    💜 {avgMood.toFixed(1)} Avg Mood
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards with 3D Effect */}
        <div className="mb-10">
          <StatsCards
            totalJournals={totalJournals}
            streak={streak}
            avgMood={avgMood}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* Left Column - Main Content */}
          <div className="xl:col-span-8 space-y-8">
            <MoodChart moodEntries={moodEntries} />
            <RecentEntries entries={journalEntries} />
          </div>
          
          {/* Right Column - Sidebar */}
          <div className="xl:col-span-4 space-y-8">
            <QuickActions />
            <Insights
              entries={journalEntries}
              moodEntries={moodEntries}
              avgMood={avgMood}
            />
          </div>
        </div>
      </div>
  )
}

