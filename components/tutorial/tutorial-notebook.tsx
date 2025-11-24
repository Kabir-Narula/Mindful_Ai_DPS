'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { BookOpen, X, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TutorialSection {
  id: string
  title: string
  icon: string
  content: string
  tips: string[]
}

const TUTORIAL_SECTIONS: TutorialSection[] = [
  {
    id: 'morning',
    title: 'Morning Alignment',
    icon: '🌅',
    content: 'Set your intention for the day. What\'s the one thing that matters most? This helps you stay focused and aligned with your goals.',
    tips: [
      'Be specific: "Finish the presentation" is better than "Work hard"',
      'Keep it simple: One clear intention is more powerful than many',
      'Review it at night to see how the day actually went'
    ]
  },
  {
    id: 'pulse',
    title: 'Pulse Check',
    icon: '💓',
    content: 'Log your mood anytime. If you\'re feeling low, the AI will offer support and interventions like CBT exercises.',
    tips: [
      'Check in 2-3 times a day for best results',
      'Be honest - the AI adapts to help you',
      'Low moods trigger helpful interventions automatically'
    ]
  },
  {
    id: 'journal',
    title: 'Journal Entries',
    icon: '✍️',
    content: 'Write about your day, thoughts, or feelings. Even one sentence helps. The AI analyzes every entry to find patterns and insights.',
    tips: [
      'Write freely - there\'s no wrong way to journal',
      'The AI reads your entries to understand you better',
      'Consistency matters more than length'
    ]
  },
  {
    id: 'feed',
    title: 'The Stream',
    icon: '📜',
    content: 'Your daily timeline shows everything in chronological order: moods, journal entries, and AI insights.',
    tips: [
      'Scroll to see your full day',
      'Each entry is timestamped',
      'The feed helps you see patterns in real-time'
    ]
  },
  {
    id: 'insights',
    title: 'Insights Page',
    icon: '💡',
    content: 'Visit the Insights page to see patterns the AI has detected, weekly reflections, and your CBT exercise history.',
    tips: [
      'Patterns appear after 5+ journal entries',
      'Weekly reflections are generated every Sunday',
      'Use "Generate New Insights" to force analysis'
    ]
  },
  {
    id: 'archive',
    title: 'Archive',
    icon: '📚',
    content: 'Browse your past days. Each day is like an "issue" of your personal magazine. Search to find specific moments.',
    tips: [
      'Click any day to see its full timeline',
      'Use search to find entries by keyword',
      'Your history is always accessible'
    ]
  },
  {
    id: 'ai',
    title: 'AI Companion',
    icon: '🤖',
    content: 'Chat with your AI companion anytime. It knows your entire history, patterns, and preferences. It\'s like talking to a therapist who never forgets.',
    tips: [
      'Ask about your patterns: "Why was I anxious last week?"',
      'Get advice: "What should I do when I feel overwhelmed?"',
      'The AI remembers everything you\'ve shared'
    ]
  }
]

interface TutorialNotebookProps {
  tutorialCompleted: boolean
}

export default function TutorialNotebook({ tutorialCompleted }: TutorialNotebookProps) {
  const [open, setOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<string | null>(null)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            "fixed bottom-6 left-6 z-50 h-14 w-14 rounded-full bg-black text-white shadow-2xl flex items-center justify-center transition-all hover:shadow-3xl",
            "sm:bottom-8 sm:left-8", // Better spacing on larger screens
            !tutorialCompleted && "animate-pulse"
          )}
          style={{ 
            position: 'fixed', // Ensure it's always fixed
            zIndex: 50 
          }}
          title="Tutorial Guide"
        >
          <BookOpen className="h-6 w-6" />
          {!tutorialCompleted && (
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full border-2 border-white" />
          )}
        </motion.button>
      </SheetTrigger>
      <SheetContent className="w-full sm:w-[540px] sm:max-w-[600px] p-0 overflow-y-auto">
        <div className="p-6 space-y-6">
          <SheetHeader className="border-b border-gray-200 pb-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-2xl">
                🤖
              </div>
              <div>
                <SheetTitle className="text-2xl font-serif">How to Use Mindful AI</SheetTitle>
                <p className="text-sm text-gray-500 mt-1">Your complete guide</p>
              </div>
            </div>
          </SheetHeader>

          <div className="space-y-4">
            {TUTORIAL_SECTIONS.map((section) => (
              <Card
                key={section.id}
                className="p-6 cursor-pointer hover:shadow-md transition-all"
                onClick={() => setActiveSection(activeSection === section.id ? null : section.id)}
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{section.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-serif font-bold text-lg text-gray-900 mb-2">
                      {section.title}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed mb-3">
                      {section.content}
                    </p>
                    
                    <AnimatePresence>
                      {activeSection === section.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-4 border-t border-gray-100">
                            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
                              Pro Tips
                            </p>
                            <ul className="space-y-2">
                              {section.tips.map((tip, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                                  <CheckCircle2 className="h-4 w-4 text-purple-500 mt-0.5 shrink-0" />
                                  <span>{tip}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="pt-6 border-t border-gray-200">
            <p className="text-xs text-center text-gray-400">
              Need help? Click the chat icon to ask your AI companion anything.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

