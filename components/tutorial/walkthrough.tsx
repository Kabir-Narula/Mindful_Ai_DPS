'use client'

import { useState, useEffect, useCallback, useRef, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ArrowRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// TYPES
// ============================================================================

interface WalkthroughStep {
  id: string
  target: string
  title: string
  content: string
  position: 'top' | 'bottom' | 'left' | 'right' | 'center'
  fallbackPosition?: 'top' | 'bottom' | 'left' | 'right' | 'center'
}

interface HighlightRect {
  top: number
  left: number
  width: number
  height: number
}

interface WalkthroughProps {
  onComplete: () => void
  onDismiss?: () => void
  isVisible: boolean
}

// ============================================================================
// CONSTANTS
// ============================================================================

const WALKTHROUGH_STEPS: WalkthroughStep[] = [
  {
    id: 'welcome',
    target: 'center',
    title: "Hello! I'm Mindful.",
    content: "I'm your personal AI wellness companion. I'm here to help you track your journey and find clarity.",
    position: 'center'
  },
  {
    id: 'morning',
    target: '[data-tour="morning-alignment"]',
    title: 'Set Your Intention',
    content: 'Start each day with purpose. Setting an intention helps anchor your mind.',
    position: 'bottom',
    fallbackPosition: 'center'
  },
  {
    id: 'pulse',
    target: '[data-tour="pulse-check"]',
    title: 'Pulse Check',
    content: "Log your mood anytime. I'll track your emotional trends and offer support.",
    position: 'bottom',
    fallbackPosition: 'center'
  },
  {
    id: 'write',
    target: '[data-tour="write-button"]',
    title: 'Journal',
    content: "Your safe space to express yourself. Write freely—I'll help you find insights.",
    position: 'left',
    fallbackPosition: 'center'
  },
  {
    id: 'feed',
    target: '[data-tour="daily-feed"]',
    title: 'Your Daily Story',
    content: 'See your day unfold chronologically. Your moods and entries in one timeline.',
    position: 'top',
    fallbackPosition: 'center'
  },
  {
    id: 'streak',
    target: '[data-tour="streak-counter"]',
    title: 'Track Growth',
    content: 'Consistency builds clarity. Watch your streak grow as you commit to reflection.',
    position: 'left',
    fallbackPosition: 'center'
  },
  {
    id: 'complete',
    target: 'center',
    title: 'Ready to Begin?',
    content: "You can always find me in the bottom corner. Let's make today a mindful one.",
    position: 'center'
  }
]

// ============================================================================
// ROBOT COMPONENT
// ============================================================================

const RobotMascot = memo(function RobotMascot({ size = 'normal' }: { size?: 'small' | 'normal' }) {
  const sizeClass = size === 'small' ? 'w-14 h-14' : 'w-20 h-20'

  return (
    <div className={cn("relative flex items-center justify-center", sizeClass)}>
      <div className="absolute inset-0 bg-purple-500/10 blur-xl rounded-full" />
      <motion.div
        animate={{ y: -3 }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut"
        }}
        className="relative z-10 w-full h-full"
      >
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md">
          <path d="M100 160 C130 160 150 175 150 185 L50 185 C50 175 70 160 100 160" fill="#374151" fillOpacity="0.2" />
          <rect x="45" y="45" width="110" height="100" rx="35" fill="url(#metalGradient)" stroke="#1F2937" strokeWidth="2" />
          <rect x="55" y="55" width="90" height="70" rx="25" fill="#1F2937" />
          <circle cx="75" cy="85" r="10" fill="#60A5FA">
            <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="125" cy="85" r="10" fill="#60A5FA">
            <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" />
          </circle>
          <rect x="85" y="110" width="30" height="4" rx="2" fill="#4B5563" />
          <line x1="100" y1="45" x2="100" y2="20" stroke="#9CA3AF" strokeWidth="3" />
          <circle cx="100" cy="15" r="6" fill="#F59E0B">
            <animate attributeName="opacity" values="1;0.5;1" dur="1.5s" repeatCount="indefinite" />
          </circle>
          <rect x="35" y="75" width="10" height="40" rx="5" fill="#D1D5DB" stroke="#9CA3AF" strokeWidth="1" />
          <rect x="155" y="75" width="10" height="40" rx="5" fill="#D1D5DB" stroke="#9CA3AF" strokeWidth="1" />
          <defs>
            <linearGradient id="metalGradient" x1="45" y1="45" x2="155" y2="145" gradientUnits="userSpaceOnUse">
              <stop stopColor="#F9FAFB" />
              <stop offset="1" stopColor="#E5E7EB" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>
    </div>
  )
})

// ============================================================================
// PROGRESS DOTS
// ============================================================================

const ProgressDots = memo(function ProgressDots({
  current,
  total
}: {
  current: number
  total: number
}) {
  return (
    <div className="flex gap-1.5 justify-center py-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-1.5 rounded-full transition-all duration-300",
            i === current ? "w-4 bg-gray-900" : "w-1.5 bg-gray-300"
          )}
        />
      ))}
    </div>
  )
})

// ============================================================================
// MAIN WALKTHROUGH COMPONENT
// ============================================================================

export default function Walkthrough({ onComplete, onDismiss, isVisible }: WalkthroughProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [highlightRect, setHighlightRect] = useState<HighlightRect | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const retryCountRef = useRef(0)
  const maxRetries = 10

  const step = WALKTHROUGH_STEPS[currentStep]
  const isLast = currentStep === WALKTHROUGH_STEPS.length - 1
  const isCenterStep = step.target === 'center'

  // Check mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Dispatch tutorial events
  useEffect(() => {
    if (isVisible) {
      window.dispatchEvent(new Event('tutorial-start'))
      return () => {
        window.dispatchEvent(new Event('tutorial-end'))
      }
    }
  }, [isVisible])

  // Find target element and update highlight
  useEffect(() => {
    if (!isVisible) return

    retryCountRef.current = 0
    setIsReady(false)

    // Center steps don't need element finding
    if (isCenterStep) {
      setHighlightRect(null)
      setIsReady(true)
      return
    }

    const findAndHighlight = () => {
      const el = document.querySelector(step.target) as HTMLElement

      if (el) {
        // Scroll element into view
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })

        // Wait for scroll, then get position
        setTimeout(() => {
          const rect = el.getBoundingClientRect()
          setHighlightRect({
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height
          })
          setIsReady(true)
        }, 300)
      } else if (retryCountRef.current < maxRetries) {
        // Element not found, retry
        retryCountRef.current++
        setTimeout(findAndHighlight, 100)
      } else {
        // Give up - show centered instead
        console.warn(`Walkthrough: Could not find element ${step.target}`)
        setHighlightRect(null)
        setIsReady(true)
      }
    }

    // Small delay to let page render
    const timer = setTimeout(findAndHighlight, 50)
    return () => clearTimeout(timer)
  }, [currentStep, isVisible, step.target, isCenterStep])

  // Update highlight on scroll/resize
  useEffect(() => {
    if (!isVisible || isCenterStep || !isReady) return

    const updateHighlight = () => {
      const el = document.querySelector(step.target) as HTMLElement
      if (el) {
        const rect = el.getBoundingClientRect()
        setHighlightRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height
        })
      }
    }

    window.addEventListener('scroll', updateHighlight, { passive: true, capture: true })
    window.addEventListener('resize', updateHighlight)
    return () => {
      window.removeEventListener('scroll', updateHighlight, true)
      window.removeEventListener('resize', updateHighlight)
    }
  }, [isVisible, isCenterStep, isReady, step.target])

  const handleNext = useCallback(() => {
    if (currentStep < WALKTHROUGH_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      onComplete()
    }
  }, [currentStep, onComplete])

  const handleSkip = useCallback(() => {
    onDismiss ? onDismiss() : onComplete()
  }, [onDismiss, onComplete])

  // Don't render if not visible
  if (!isVisible) return null

  // Calculate tooltip position
  const getTooltipStyle = (): React.CSSProperties => {
    // Mobile: always bottom sheet
    if (isMobile) {
      return {
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
      }
    }

    // Center step: center of screen
    if (isCenterStep || !highlightRect) {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }
    }

    // Position relative to highlighted element
    const padding = 20
    const tooltipWidth = 380
    const tooltipHeight = 220
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    let top = 0
    let left = 0

    switch (step.position) {
      case 'bottom':
        top = highlightRect.top + highlightRect.height + padding
        left = highlightRect.left + highlightRect.width / 2 - tooltipWidth / 2
        // Flip to top if not enough space
        if (top + tooltipHeight > viewportHeight - padding) {
          top = highlightRect.top - tooltipHeight - padding
        }
        break
      case 'top':
        top = highlightRect.top - tooltipHeight - padding
        left = highlightRect.left + highlightRect.width / 2 - tooltipWidth / 2
        // Flip to bottom if not enough space
        if (top < padding) {
          top = highlightRect.top + highlightRect.height + padding
        }
        break
      case 'left':
        top = highlightRect.top + highlightRect.height / 2 - tooltipHeight / 2
        left = highlightRect.left - tooltipWidth - padding
        // Flip to right if not enough space
        if (left < padding) {
          left = highlightRect.left + highlightRect.width + padding
        }
        break
      case 'right':
        top = highlightRect.top + highlightRect.height / 2 - tooltipHeight / 2
        left = highlightRect.left + highlightRect.width + padding
        // Flip to left if not enough space
        if (left + tooltipWidth > viewportWidth - padding) {
          left = highlightRect.left - tooltipWidth - padding
        }
        break
      default:
        top = viewportHeight / 2 - tooltipHeight / 2
        left = viewportWidth / 2 - tooltipWidth / 2
    }

    // Keep within viewport bounds
    left = Math.max(padding, Math.min(left, viewportWidth - tooltipWidth - padding))
    top = Math.max(padding, Math.min(top, viewportHeight - tooltipHeight - padding))

    return {
      position: 'fixed',
      top,
      left,
    }
  }

  return (
    <div className="fixed inset-0 z-[9999]" style={{ isolation: 'isolate' }}>
      {/* Dark overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/60"
        onClick={handleSkip}
      />

      {/* Highlight cutout */}
      <AnimatePresence>
        {highlightRect && isReady && (
          <motion.div
            key={`highlight-${currentStep}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{
              opacity: 1,
              scale: 1,
              top: highlightRect.top - 8,
              left: highlightRect.left - 8,
              width: highlightRect.width + 16,
              height: highlightRect.height + 16,
            }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 25,
              opacity: { duration: 0.2 }
            }}
            className="fixed rounded-xl pointer-events-none"
            style={{
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
              border: '3px solid white',
            }}
          />
        )}
      </AnimatePresence>

      {/* Tooltip card */}
      <motion.div
        key={`tooltip-${currentStep}`}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{
          opacity: isReady ? 1 : 0.5,
          y: 0,
          scale: 1,
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 25,
          delay: 0.1
        }}
        style={getTooltipStyle()}
        className="pointer-events-auto"
      >
        <div className={cn(
          "bg-white shadow-2xl",
          isMobile
            ? "rounded-t-2xl px-6 py-6 pb-10"
            : "rounded-2xl p-6 w-[380px]"
        )}>
          {/* Close button */}
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Skip tutorial"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex gap-4">
            {/* Robot */}
            <div className="shrink-0">
              <RobotMascot size={isMobile ? 'small' : 'normal'} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-3">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <h3 className="font-serif font-bold text-lg text-gray-900 mb-1">
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {step.content}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Progress */}
              <ProgressDots current={currentStep} total={WALKTHROUGH_STEPS.length} />

              {/* Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  className="flex-1 text-gray-500 hover:text-gray-700 text-xs uppercase tracking-wide font-semibold"
                >
                  Skip
                </Button>
                <Button
                  onClick={handleNext}
                  size="sm"
                  className="flex-[2] bg-gray-900 text-white hover:bg-gray-800 text-xs uppercase tracking-wide font-semibold h-9"
                >
                  {isLast ? 'Get Started' : 'Next'}
                  <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}