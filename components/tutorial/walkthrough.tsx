'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowRight, BookOpen, X } from 'lucide-react'
import { cn } from '@/lib/utils'

// --- DETAILED ROBOT COMPONENT ---
const RobotMascot = ({ isMobile }: { isMobile?: boolean }) => {
  return (
    <div className={cn(
      "relative flex items-center justify-center",
      isMobile ? "w-16 h-16" : "w-24 h-24"
    )}>
      {/* Ambient Glow - Reduced intensity */}
      <div className="absolute inset-0 bg-purple-500/10 blur-2xl rounded-full" />
      
      <motion.div
        animate={{ 
          y: [0, -4, 0],
          rotate: [0, 1, -1, 0]
        }}
        transition={{ 
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="relative z-10 w-full h-full drop-shadow-lg"
      >
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* Body/Base */}
          <path d="M100 160 C130 160 150 175 150 185 L50 185 C50 175 70 160 100 160" fill="#374151" fillOpacity="0.2"/>

          {/* Main Head Shape */}
          <rect x="45" y="45" width="110" height="100" rx="35" fill="url(#metalGradient)" stroke="#1F2937" strokeWidth="2"/>
          
          {/* Face Screen */}
          <rect x="55" y="55" width="90" height="70" rx="25" fill="#1F2937" />
          
          {/* Eyes Container - animated */}
          <motion.g 
            animate={{ scaleY: [1, 0.1, 1, 1, 1] }} 
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
          >
             {/* Left Eye */}
             <circle cx="75" cy="85" r="10" fill="#60A5FA" className="animate-pulse">
                <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" />
             </circle>
             {/* Right Eye */}
             <circle cx="125" cy="85" r="10" fill="#60A5FA" className="animate-pulse">
                <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" />
             </circle>
          </motion.g>

          {/* Mouth / Voice Line */}
          <rect x="85" y="110" width="30" height="4" rx="2" fill="#4B5563" />

          {/* Antenna Stem */}
          <line x1="100" y1="45" x2="100" y2="20" stroke="#9CA3AF" strokeWidth="3" />
          
          {/* Antenna Bulb */}
          <circle cx="100" cy="15" r="6" fill="#F59E0B">
             <animate attributeName="opacity" values="1;0.5;1" dur="1.5s" repeatCount="indefinite" />
          </circle>

          {/* Ear/Side Details */}
          <rect x="35" y="75" width="10" height="40" rx="5" fill="#D1D5DB" stroke="#9CA3AF" strokeWidth="1"/>
          <rect x="155" y="75" width="10" height="40" rx="5" fill="#D1D5DB" stroke="#9CA3AF" strokeWidth="1"/>

          {/* Definitions */}
          <defs>
            <linearGradient id="metalGradient" x1="45" y1="45" x2="155" y2="145" gradientUnits="userSpaceOnUse">
              <stop stopColor="#F9FAFB"/>
              <stop offset="1" stopColor="#E5E7EB"/>
            </linearGradient>
          </defs>
        </svg>
      </motion.div>
    </div>
  )
}

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
    title: 'Hello! I\'m Mindful.',
    content: "I'm your personal AI wellness companion. I'm here to help you track your journey, understand your patterns, and find clarity.",
    position: 'center'
  },
  {
    id: 'morning',
    target: '[data-tour="morning-alignment"]',
    title: 'Set Your Intention',
    content: 'Start each day with purpose. Setting an intention helps anchor your mind.',
    position: 'bottom'
  },
  {
    id: 'pulse',
    target: '[data-tour="pulse-check"]',
    title: 'Pulse Check',
    content: 'Log your mood anytime. I\'ll track your emotional trends and offer support.',
    position: 'bottom'
  },
  {
    id: 'write',
    target: '[data-tour="write-button"]',
    title: 'Journal',
    content: 'Your safe space to express yourself. Write freely—I\'ll help you find insights.',
    position: 'left'
  },
  {
    id: 'feed',
    target: '[data-tour="daily-feed"]',
    title: 'Your Daily Story',
    content: 'See your day unfold chronologically. Your moods and entries in one timeline.',
    position: 'top'
  },
  {
    id: 'streak',
    target: '[data-tour="streak-counter"]',
    title: 'Track Growth',
    content: 'Consistency builds clarity. Watch your streak grow as you commit to daily reflection.',
    position: 'left'
  },
  {
    id: 'complete',
    target: 'center',
    title: 'Ready to Begin?',
    content: 'You can always find me in the bottom corner. Let\'s make today a mindful one.',
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
  const [tooltipPosition, setTooltipPosition] = useState<any>({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' })
  const [highlightBox, setHighlightBox] = useState<DOMRect | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  // Dispatch event when visible changes
  useEffect(() => {
    if (isVisible) {
      window.dispatchEvent(new Event('tutorial-start'))
    } else {
      window.dispatchEvent(new Event('tutorial-end'))
    }
    return () => {
        if (isVisible) window.dispatchEvent(new Event('tutorial-end'))
    }
  }, [isVisible])

  // Check mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Calculate positions using viewport coordinates (works at any zoom)
  const updatePositions = useCallback(() => {
    const step = WALKTHROUGH_STEPS[currentStep]
    
    // Mobile Override: Always center bottom, full width, SAFE AREA
    if (isMobile) {
       setTooltipPosition({
         bottom: '0',
         left: '0',
         right: '0',
         transform: 'none',
         top: 'auto',
         width: '100%',
         maxWidth: '100%'
       })
       
       // Still show highlight if not center step
       if (step.target !== 'center' && targetElement) {
          const rect = targetElement.getBoundingClientRect()
          setHighlightBox(rect)
       } else {
          setHighlightBox(null)
       }
       return
    }

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
    const tooltipHeight = 280 
    const padding = 24

    let top = 0
    let left = 0
    let transform = ''

    switch (step.position) {
      case 'bottom':
        top = rect.bottom + padding
        left = rect.left + rect.width / 2
        transform = 'translateX(-50%)'
        if (top + tooltipHeight > viewportHeight) {
          top = rect.top - tooltipHeight - padding
          transform = 'translate(-50%, -100%)'
        }
        break
      case 'top':
        top = rect.top - tooltipHeight - padding
        left = rect.left + rect.width / 2
        transform = 'translate(-50%, -100%)'
        if (top < 0) {
          top = rect.bottom + padding
          transform = 'translateX(-50%)'
        }
        break
      case 'left':
        top = rect.top + rect.height / 2
        left = rect.left - tooltipWidth - padding
        transform = 'translateY(-50%)'
        if (left < 0) {
          left = rect.right + padding
          transform = 'translateY(-50%)'
        }
        break
      case 'right':
        top = rect.top + rect.height / 2
        left = rect.right + padding
        transform = 'translateY(-50%)'
        if (left + tooltipWidth > viewportWidth) {
          left = rect.left - tooltipWidth - padding
          transform = 'translateY(-50%)'
        }
        break
    }

    left = Math.max(padding, Math.min(left, viewportWidth - tooltipWidth - padding))
    top = Math.max(padding, Math.min(top, viewportHeight - tooltipHeight - padding))

    setTooltipPosition({ 
      top: `${top}px`, 
      left: `${left}px`, 
      transform 
    })
  }, [currentStep, targetElement, isMobile])

  // Find and set target element
  useEffect(() => {
    if (!isVisible) return

    const step = WALKTHROUGH_STEPS[currentStep]
    if (step.target === 'center') {
      setTargetElement(null)
      setHighlightBox(null)
      if (!isMobile) {
        setTooltipPosition({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' })
      }
      return
    }

    const findElement = () => {
      const el = document.querySelector(step.target) as HTMLElement
      if (el) {
        setTargetElement(el)
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
          setTimeout(updatePositions, 500)
        }, 100)
      } else {
        setTimeout(findElement, 200)
      }
    }
    findElement()
  }, [currentStep, isVisible, updatePositions, isMobile])

  useEffect(() => {
    if (!isVisible) return
    const handleUpdate = () => updatePositions()
    let timeout: NodeJS.Timeout
    const throttledUpdate = () => {
      clearTimeout(timeout)
      timeout = setTimeout(updatePositions, 100)
    }
    window.addEventListener('scroll', throttledUpdate, true)
    window.addEventListener('resize', throttledUpdate)
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
    if (onDismiss) onDismiss()
    else onComplete()
  }

  if (!isVisible) return null

  const step = WALKTHROUGH_STEPS[currentStep]
  const isLast = currentStep === WALKTHROUGH_STEPS.length - 1

  return (
    <AnimatePresence>
      <div id="walkthrough-overlay" className="fixed inset-0 z-[9999] pointer-events-none" style={{ isolation: 'isolate' }}>
        {/* Overlay - Darker to focus attention, NO BLUR so elements are visible */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50"
        />

        {/* Highlight Box - Using viewport coordinates */}
        {highlightBox && (
          <motion.div
            key={`highlight-${currentStep}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed border-[2px] border-white rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] pointer-events-none z-[10000] transition-all duration-300 ease-out"
            style={{
              top: `${highlightBox.top - 4}px`,
              left: `${highlightBox.left - 4}px`,
              width: `${highlightBox.width + 8}px`,
              height: `${highlightBox.height + 8}px`,
            }}
          />
        )}

        {/* Robot Guide Card */}
        <motion.div
          key={`tooltip-${currentStep}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed pointer-events-auto z-[10001]"
          style={tooltipPosition}
        >
          <div className={cn(
            "relative bg-[#F9F8F5] border-t border-gray-200 shadow-2xl overflow-hidden",
            isMobile ? "rounded-t-2xl pb-8" : "rounded-xl border border-gray-200 p-6 max-w-md"
          )}>
            
            {/* Close Button */}
            <button 
                onClick={handleSkip}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors z-20"
            >
                <X className="h-5 w-5" />
            </button>

            <div className={cn("flex gap-4 items-start", isMobile ? "p-6" : "")}>
                {/* Robot Avatar - Inside layout for mobile */}
                <div className="shrink-0">
                     <RobotMascot isMobile={isMobile} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-1 space-y-3">
                    <div>
                        <h3 className="font-serif font-bold text-xl text-gray-900 leading-tight mb-1">
                            {step.title}
                        </h3>
                        <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
                            {step.content}
                        </p>
                    </div>

                    {/* Progress Dots */}
                    <div className="flex gap-1.5 py-1">
                        {WALKTHROUGH_STEPS.map((_, i) => (
                        <div
                            key={i}
                            className={cn(
                            "h-1.5 w-1.5 rounded-full transition-all duration-300",
                            i === currentStep ? "bg-black w-4" : "bg-gray-200"
                            )}
                        />
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleSkip}
                            className="flex-1 text-gray-500 hover:text-gray-900 text-xs uppercase tracking-wider font-bold"
                        >
                            Skip
                        </Button>
                        <Button
                            onClick={handleNext}
                            size="sm"
                            className="flex-[2] bg-black text-white hover:bg-gray-800 rounded-md text-xs uppercase tracking-wider font-bold h-9"
                        >
                            {isLast ? (
                            <>
                                Begin <ArrowRight className="h-3 w-3 ml-2" />
                            </>
                            ) : (
                            <>
                                Next <ArrowRight className="h-3 w-3 ml-2" />
                            </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}