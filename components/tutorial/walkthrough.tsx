'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowRight, BookOpen, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WalkthroughStep {
  id: string
  target: string // CSS selector or 'center'
  title: string
  content: string
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
}

const WALKTHROUGH_STEPS: WalkthroughStep[] = [
  {
    id: 'welcome',
    target: 'center',
    title: 'Welcome to Your Mindful Journey! 👋',
    content: "I'm your guide. Let me show you around your new wellness companion. This is your daily stream where everything happens.",
    position: 'center'
  },
  {
    id: 'morning',
    target: '[data-tour="morning-alignment"]',
    title: 'Start Your Day Right',
    content: 'Set your morning intention here. What matters most today? This helps you focus and stay aligned.',
    position: 'bottom'
  },
  {
    id: 'pulse',
    target: '[data-tour="pulse-check"]',
    title: 'Check In Anytime',
    content: 'Use the Pulse Check to log how you\'re feeling. The AI will offer support if you need it.',
    position: 'bottom'
  },
  {
    id: 'write',
    target: '[data-tour="write-button"]',
    title: 'Capture Your Thoughts',
    content: 'Click "Write Entry" to journal. Even one sentence helps. The AI analyzes your entries to find patterns.',
    position: 'left'
  },
  {
    id: 'feed',
    target: '[data-tour="daily-feed"]',
    title: 'Your Daily Timeline',
    content: 'All your moods and journal entries appear here in chronological order. Watch your story unfold.',
    position: 'top'
  },
  {
    id: 'streak',
    target: '[data-tour="streak-counter"]',
    title: 'Build Your Streak',
    content: 'Every day you journal, your streak grows. Consistency is the key to self-awareness.',
    position: 'left'
  },
  {
    id: 'complete',
    target: 'center',
    title: 'You\'re All Set! 🎉',
    content: 'I\'ll disappear into the notebook icon in the corner. Click it anytime to review how everything works.',
    position: 'center'
  }
]

interface WalkthroughProps {
  onComplete: () => void
  onDismiss?: () => void
  isVisible: boolean
}

export default function Walkthrough({ onComplete, onDismiss, isVisible }: WalkthroughProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' })
  const [highlightBox, setHighlightBox] = useState<DOMRect | null>(null)

  // Calculate positions using viewport coordinates (works at any zoom)
  const updatePositions = useCallback(() => {
    const step = WALKTHROUGH_STEPS[currentStep]
    
    if (step.target === 'center' || !targetElement) {
      setTooltipPosition({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' })
      setHighlightBox(null)
      return
    }

    const rect = targetElement.getBoundingClientRect()
    setHighlightBox(rect)

    // Calculate tooltip position relative to viewport (not document)
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const tooltipWidth = 384 // max-w-sm = 384px
    const tooltipHeight = 250 // approximate
    const padding = 20

    let top = 0
    let left = 0
    let transform = ''

    switch (step.position) {
      case 'bottom':
        top = rect.bottom + padding
        left = rect.left + rect.width / 2
        transform = 'translateX(-50%)'
        // Boundary check: if tooltip goes off bottom, place above
        if (top + tooltipHeight > viewportHeight) {
          top = rect.top - tooltipHeight - padding
          transform = 'translate(-50%, -100%)'
        }
        break
      case 'top':
        top = rect.top - tooltipHeight - padding
        left = rect.left + rect.width / 2
        transform = 'translate(-50%, -100%)'
        // Boundary check: if tooltip goes off top, place below
        if (top < 0) {
          top = rect.bottom + padding
          transform = 'translateX(-50%)'
        }
        break
      case 'left':
        top = rect.top + rect.height / 2
        left = rect.left - tooltipWidth - padding
        transform = 'translateY(-50%)'
        // Boundary check: if tooltip goes off left, place right
        if (left < 0) {
          left = rect.right + padding
          transform = 'translateY(-50%)'
        }
        break
      case 'right':
        top = rect.top + rect.height / 2
        left = rect.right + padding
        transform = 'translateY(-50%)'
        // Boundary check: if tooltip goes off right, place left
        if (left + tooltipWidth > viewportWidth) {
          left = rect.left - tooltipWidth - padding
          transform = 'translateY(-50%)'
        }
        break
    }

    // Ensure tooltip stays within viewport bounds
    left = Math.max(padding, Math.min(left, viewportWidth - tooltipWidth - padding))
    top = Math.max(padding, Math.min(top, viewportHeight - tooltipHeight - padding))

    setTooltipPosition({ 
      top: `${top}px`, 
      left: `${left}px`, 
      transform 
    })
  }, [currentStep, targetElement])

  // Find and set target element
  useEffect(() => {
    if (!isVisible) return

    const step = WALKTHROUGH_STEPS[currentStep]
    if (step.target === 'center') {
      setTargetElement(null)
      setHighlightBox(null)
      setTooltipPosition({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' })
      return
    }

    const findElement = () => {
      const el = document.querySelector(step.target) as HTMLElement
      if (el) {
        setTargetElement(el)
        // Scroll into view with padding
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
          // Wait for scroll to complete before updating positions
          setTimeout(updatePositions, 500)
        }, 100)
      } else {
        setTimeout(findElement, 200)
      }
    }
    findElement()
  }, [currentStep, isVisible, updatePositions])

  // Update positions on scroll, resize, or zoom
  useEffect(() => {
    if (!isVisible || !targetElement) return

    const handleUpdate = () => {
      updatePositions()
    }

    // Throttle updates for performance
    let timeout: NodeJS.Timeout
    const throttledUpdate = () => {
      clearTimeout(timeout)
      timeout = setTimeout(updatePositions, 100)
    }

    window.addEventListener('scroll', throttledUpdate, true)
    window.addEventListener('resize', throttledUpdate)
    
    // Update immediately
    updatePositions()

    return () => {
      window.removeEventListener('scroll', throttledUpdate, true)
      window.removeEventListener('resize', throttledUpdate)
      clearTimeout(timeout)
    }
  }, [isVisible, targetElement, updatePositions])

  const handleNext = () => {
    if (currentStep < WALKTHROUGH_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete()
    }
  }

  const handleSkip = () => {
    if (onDismiss) {
      onDismiss()
    } else {
      onComplete()
    }
  }

  if (!isVisible) return null

  const step = WALKTHROUGH_STEPS[currentStep]
  const isLast = currentStep === WALKTHROUGH_STEPS.length - 1

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] pointer-events-none" style={{ isolation: 'isolate' }}>
        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60"
        />

        {/* Highlight Box - Using viewport coordinates */}
        {highlightBox && (
          <motion.div
            key={`highlight-${currentStep}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed border-4 border-white rounded-lg shadow-2xl pointer-events-none z-[10000]"
            style={{
              top: `${highlightBox.top - 4}px`,
              left: `${highlightBox.left - 4}px`,
              width: `${highlightBox.width + 8}px`,
              height: `${highlightBox.height + 8}px`,
            }}
          />
        )}

        {/* Robot Guide Card - Fixed positioning relative to viewport */}
        <motion.div
          key={`tooltip-${currentStep}`}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed pointer-events-auto z-[10001]"
          style={tooltipPosition}
        >
          <Card className="p-6 w-[90vw] max-w-sm bg-white shadow-2xl border-2 border-gray-900">
            {/* Robot Avatar */}
            <div className="flex items-start gap-4 mb-4">
              <div className="relative shrink-0">
                <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-2xl">
                  🤖
                </div>
                <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-yellow-400 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-serif font-bold text-lg text-gray-900 mb-1">{step.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{step.content}</p>
              </div>
            </div>

            {/* Progress */}
            <div className="mb-4">
              <div className="flex gap-1">
                {WALKTHROUGH_STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1 flex-1 rounded-full transition-all",
                      i <= currentStep ? "bg-purple-500" : "bg-gray-200"
                    )}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">
                Step {currentStep + 1} of {WALKTHROUGH_STEPS.length}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSkip}
                className="flex-1"
              >
                Skip Tour
              </Button>
              <Button
                onClick={handleNext}
                size="sm"
                className="flex-1 bg-black text-white hover:bg-gray-800"
              >
                {isLast ? (
                  <>
                    <BookOpen className="h-4 w-4 mr-2" />
                    Complete
                  </>
                ) : (
                  <>
                    Next <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
