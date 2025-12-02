'use client'

import { useState, useEffect, useMemo } from 'react'
import MorningAlignment from '@/components/stream/morning-alignment'
import PulseCheck from '@/components/stream/pulse-check'
import DailySynthesis from '@/components/stream/daily-synthesis'
import DailyFeed from '@/components/stream/daily-feed'
import StreakCounter from '@/components/dashboard/streak-counter'
import AIProactiveCoach from '@/components/dashboard/ai-proactive-coach'
import QuickJournalModal from '@/components/dashboard/quick-journal-modal'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PenLine, Sparkles, ArrowRight, Moon, CheckCircle2 } from 'lucide-react'
import { DashboardData } from '@/lib/types'
import Link from 'next/link'
import { getTodayString, formatInToronto } from '@/lib/timezone'

interface DashboardContentProps extends DashboardData { }

export default function DashboardContent({
  user,
  streak,
  dayLog,
  feedEntries
}: DashboardContentProps) {
  const [quickJournalOpen, setQuickJournalOpen] = useState(false)
  const [tutorialActive, setTutorialActive] = useState(false)

  // Filter feed entries for today in Toronto timezone (client-side validation)
  // Server already filters by Toronto timezone, but this ensures consistency
  const todayEntries = useMemo(() => {
    const todayInToronto = getTodayString()
    return feedEntries.filter(entry => {
      const entryDate = formatInToronto(new Date(entry.createdAt), 'yyyy-MM-dd')
      return entryDate === todayInToronto
    })
  }, [feedEntries])

  const isNewUser = todayEntries.length === 0 && !dayLog?.morningIntention
  const isDayComplete = !!dayLog?.eveningReflection

  // Check if tutorial is active
  useEffect(() => {
    const checkTutorial = () => {
      const tutorialOverlay = document.getElementById('walkthrough-overlay')
      setTutorialActive(!!tutorialOverlay)
    }

    const handleTutorialStart = () => setTutorialActive(true)
    const handleTutorialEnd = () => setTutorialActive(false)

    window.addEventListener('tutorial-start', handleTutorialStart)
    window.addEventListener('tutorial-end', handleTutorialEnd)

    const timer = setTimeout(checkTutorial, 1000)

    return () => {
      window.removeEventListener('tutorial-start', handleTutorialStart)
      window.removeEventListener('tutorial-end', handleTutorialEnd)
      clearTimeout(timer)
    }
  }, [])

  if (!user) return null

  // --- STATE 1: DAY COMPLETE (LOCKED) ---
  // If day is done (and tutorial not active), show the "Good Night" screen.
  if (isDayComplete && !tutorialActive) {
    return (
      <div className="max-w-3xl mx-auto py-20 px-4">
        <div className="text-center space-y-8">
          <div className="inline-flex items-center justify-center p-4 bg-indigo-50 rounded-full mb-4">
            <Moon className="h-12 w-12 text-indigo-600" />
          </div>

          <h1 className="text-5xl md:text-6xl font-serif font-bold text-gray-900">
            Day Complete.
          </h1>

          <p className="text-xl text-gray-600 max-w-xl mx-auto leading-relaxed">
            You've closed the loop for today. Rest well, and come back tomorrow for a fresh page.
          </p>

          <Card className="p-8 bg-white border-2 border-gray-100 shadow-sm max-w-lg mx-auto text-left mt-12">
            <h3 className="text-xs font-bold tracking-widest uppercase text-gray-400 mb-6 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Daily Summary
            </h3>

            <div className="space-y-6">
              {dayLog.morningIntention && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Intention</p>
                  <p className="font-serif text-lg text-gray-900">"{dayLog.morningIntention}"</p>
                </div>
              )}

              <div className="h-px bg-gray-100" />

              <div>
                <p className="text-sm text-gray-500 mb-1">Reflection</p>
                <p className="font-serif text-lg text-gray-900 italic">"{dayLog.eveningReflection}"</p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 flex justify-center">
              <Link href="/dashboard/archive">
                <Button variant="outline" className="rounded-full">
                  View in Archive
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // --- STATE 2: NEW USER WELCOME ---
  if (isNewUser && !tutorialActive) {
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

  // --- STATE 3: STANDARD DASHBOARD ---
  return (
    <div className="max-w-6xl mx-auto pb-24 px-4 md:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 py-8 border-b border-gray-200 mb-8">
        <div className="space-y-1">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900">
            Today
          </h1>
          <p className="text-sm text-gray-500">
            {formatInToronto(new Date(), 'EEEE, MMMM d')}
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
        {/* Main Content */}
        <div className="lg:col-span-8 space-y-8">
          {/* Morning Intention - Always show (displays form if no intention, or shows set intention) */}
          <div data-tour="morning-alignment">
            <MorningAlignment
              existingIntention={tutorialActive ? null : dayLog?.morningIntention}
            />
          </div>

          {/* Pulse Check */}
          <div data-tour="pulse-check">
            <PulseCheck
              morningIntention={dayLog?.morningIntention}
              lastMoodEntryTime={todayEntries.filter(e => e.type === 'mood').slice(-1)[0]?.createdAt}
            />
          </div>

          {/* Feed */}
          <div data-tour="daily-feed">
            <DailyFeed entries={todayEntries} />
          </div>

          {/* Evening Synthesis */}
          {(todayEntries.length > 0 && dayLog) || tutorialActive ? (
            <DailySynthesis
              dayLogId={dayLog?.id || ''}
              morningIntention={dayLog?.morningIntention || ''}
              entriesCount={todayEntries.length}
            />
          ) : null}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="sticky top-24 space-y-6">
            {(streak.current > 0 || tutorialActive) && (
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