'use client'

import { useState } from 'react'
import MorningAlignment from '@/components/stream/morning-alignment'
import PulseCheck from '@/components/stream/pulse-check'
import DailySynthesis from '@/components/stream/daily-synthesis'
import DailyFeed from '@/components/stream/daily-feed'
import StreakCounter from '@/components/dashboard/streak-counter'
import AIProactiveCoach from '@/components/dashboard/ai-proactive-coach'
import QuickJournalModal from '@/components/dashboard/quick-journal-modal'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PenLine, Sparkles, ArrowRight } from 'lucide-react'
import { DashboardData } from '@/lib/types'

interface DashboardContentProps extends DashboardData {}

export default function DashboardContent({
  user,
  streak,
  dayLog,
  feedEntries
}: DashboardContentProps) {
  const [quickJournalOpen, setQuickJournalOpen] = useState(false)
  const isNewUser = feedEntries.length === 0 && !dayLog?.morningIntention

  if (!user) return null

  // NEW USER WELCOME STATE - Immediate Value
  if (isNewUser) {
    return (
      <div className="max-w-4xl mx-auto pb-24 px-4 md:px-8">
        <div className="text-center py-20 space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-serif font-bold text-gray-900">
              Welcome, {user.name?.split(' ')[0] || 'there'}.
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Let's start simple. Just write one thing on your mind right now.
            </p>
          </div>

          <Card className="p-12 bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 max-w-2xl mx-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Sparkles className="h-8 w-8 text-purple-600" />
                <h2 className="text-2xl font-serif font-bold text-gray-900">Your First Entry</h2>
              </div>
              
              <p className="text-gray-600 leading-relaxed">
                Don't overthink it. Just write one sentence about how you're feeling, what happened today, or what's on your mind. 
                The AI will help you understand yourself better over time.
              </p>

              <Button
                size="lg"
                onClick={() => setQuickJournalOpen(true)}
                className="w-full bg-black text-white hover:bg-gray-800 text-lg py-6 rounded-full"
              >
                <PenLine className="h-5 w-5 mr-2" />
                Write Your First Entry
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>

              <p className="text-xs text-gray-400 mt-4">
                Tip: You can always come back and explore more features later. For now, just write.
              </p>
            </div>
          </Card>
        </div>

        <QuickJournalModal
          open={quickJournalOpen}
          onOpenChange={setQuickJournalOpen}
        />
      </div>
    )
  }

  // EXISTING USER - Simplified Dashboard
  return (
    <div className="max-w-6xl mx-auto pb-24 px-4 md:px-8">
      {/* Simplified Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 py-8 border-b border-gray-200 mb-8">
        <div className="space-y-1">
           <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900">
              Today
           </h1>
           <p className="text-sm text-gray-500">
              {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
           </p>
        </div>
        <Button
          variant="default"
          size="lg"
          onClick={() => setQuickJournalOpen(true)}
          className="rounded-full px-6 bg-black text-white hover:bg-gray-800"
          data-tour="write-button"
        >
          <PenLine className="h-4 w-4 mr-2" />
          Write
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content - Simplified */}
        <div className="lg:col-span-8 space-y-8">
            {/* Morning Intention - Only show if not set */}
            {!dayLog?.morningIntention && (
              <div data-tour="morning-alignment">
                <MorningAlignment 
                    userId={user.id} 
                    existingIntention={null} 
                />
              </div>
            )}

            {/* Pulse Check - Always visible but simplified */}
            <div data-tour="pulse-check">
                <PulseCheck 
                    userId={user.id} 
                    morningIntention={dayLog?.morningIntention}
                />
            </div>

            {/* Feed - The main content */}
            <div data-tour="daily-feed">
                <DailyFeed entries={feedEntries} />
            </div>

            {/* Evening Synthesis - Only show if there are entries */}
            {feedEntries.length > 0 && dayLog && (
              <DailySynthesis 
                  dayLogId={dayLog.id} 
                  morningIntention={dayLog.morningIntention}
                  entriesCount={feedEntries.length}
              />
            )}
        </div>

        {/* Sidebar - Simplified */}
        <div className="lg:col-span-4 space-y-6">
            <div className="sticky top-24 space-y-6">
                {streak.current > 0 && (
                  <div data-tour="streak-counter">
                    <StreakCounter userId={user.id} streak={streak} />
                  </div>
                )}
                <AIProactiveCoach userId={user.id} />
            </div>
        </div>
      </div>

      <QuickJournalModal
        open={quickJournalOpen}
        onOpenChange={setQuickJournalOpen}
      />
    </div>
  )
}
