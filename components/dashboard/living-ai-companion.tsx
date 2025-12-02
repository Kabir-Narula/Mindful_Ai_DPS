'use client'

import { useState, useEffect, useCallback, useRef, memo } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Sparkles, MessageCircle, Heart, X, Moon, Zap } from 'lucide-react'
import GlobalChatSheet from '@/components/dashboard/global-chat-sheet'

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

type EmotionState = 'neutral' | 'happy' | 'thoughtful' | 'energetic' | 'calm'

interface EmotionConfig {
    gradient: string
    shadowColor: string
    icon: typeof MessageCircle
    label: string
    pulseSpeed: number
}

const EMOTION_CONFIGS: Record<EmotionState, EmotionConfig> = {
    neutral: {
        gradient: 'from-blue-400 via-blue-500 to-cyan-500',
        shadowColor: 'rgba(59, 130, 246, 0.5)',
        icon: MessageCircle,
        label: 'Ready to chat',
        pulseSpeed: 3,
    },
    happy: {
        gradient: 'from-amber-400 via-orange-400 to-rose-400',
        shadowColor: 'rgba(251, 146, 60, 0.5)',
        icon: Heart,
        label: 'Feeling good vibes',
        pulseSpeed: 2,
    },
    thoughtful: {
        gradient: 'from-purple-400 via-violet-500 to-indigo-500',
        shadowColor: 'rgba(139, 92, 246, 0.5)',
        icon: Sparkles,
        label: 'Deep in thought',
        pulseSpeed: 4,
    },
    energetic: {
        gradient: 'from-emerald-400 via-teal-400 to-cyan-400',
        shadowColor: 'rgba(20, 184, 166, 0.5)',
        icon: Zap,
        label: 'Energized',
        pulseSpeed: 1.5,
    },
    calm: {
        gradient: 'from-slate-400 via-blue-400 to-indigo-400',
        shadowColor: 'rgba(100, 116, 139, 0.5)',
        icon: Moon,
        label: 'Calm and centered',
        pulseSpeed: 5,
    },
}

// Time-based emotion selection
function getTimeBasedEmotion(): EmotionState {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 9) return 'energetic'
    if (hour >= 9 && hour < 17) return 'neutral'
    if (hour >= 17 && hour < 21) return 'thoughtful'
    return 'calm'
}

// ============================================================================
// FLOATING PARTICLES COMPONENT
// ============================================================================

const FloatingParticles = memo(function FloatingParticles({
    color,
    count = 6
}: {
    color: string
    count?: number
}) {
    const prefersReducedMotion = useReducedMotion()

    if (prefersReducedMotion) return null

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: count }).map((_, i) => (
                <motion.div
                    key={i}
                    className={`absolute w-1 h-1 rounded-full ${color}`}
                    initial={{
                        x: 32,
                        y: 32,
                        opacity: 0,
                        scale: 0
                    }}
                    animate={{
                        x: 32 + Math.cos(i * 60 * Math.PI / 180) * 40,
                        y: 32 + Math.sin(i * 60 * Math.PI / 180) * 40,
                        opacity: 0.8,
                        scale: 1,
                    }}
                    transition={{
                        duration: 1.5,
                        delay: i * 0.3,
                        repeat: Infinity,
                        repeatType: 'reverse',
                        ease: 'easeOut',
                    }}
                />
            ))}
        </div>
    )
})

// ============================================================================
// WELCOME TOOLTIP COMPONENT
// ============================================================================

const WelcomeTooltip = memo(function WelcomeTooltip({
    onDismiss
}: {
    onDismiss: () => void
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            className="absolute bottom-20 right-0 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-4 max-w-xs border-2 border-purple-200 dark:border-purple-700"
            role="tooltip"
            aria-live="polite"
        >
            <button
                onClick={onDismiss}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                aria-label="Dismiss welcome message"
            >
                <X className="h-4 w-4" />
            </button>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
            >
                <p className="text-sm text-gray-700 dark:text-gray-200 font-medium pr-4">
                    Hey there! 👋 I'm your AI companion. I'm here whenever you need to talk or reflect.
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Click me anytime to chat!
                </p>
            </motion.div>

            {/* Decorative arrow */}
            <div className="absolute -bottom-2 right-8 w-4 h-4 bg-white dark:bg-gray-800 border-r-2 border-b-2 border-purple-200 dark:border-purple-700 transform rotate-45" />
        </motion.div>
    )
})

// ============================================================================
// MAIN COMPANION COMPONENT
// ============================================================================

function LivingAICompanion() {
    const [isOpen, setIsOpen] = useState(false)
    const [emotion, setEmotion] = useState<EmotionState>('neutral')
    const [showWelcome, setShowWelcome] = useState(false)
    const [isHovered, setIsHovered] = useState(false)
    const buttonRef = useRef<HTMLButtonElement>(null)
    const prefersReducedMotion = useReducedMotion()

    // Initialize time-based emotion and check for welcome
    useEffect(() => {
        setEmotion(getTimeBasedEmotion())

        const hasSeenWelcome = localStorage.getItem('ai_companion_welcomed')
        if (!hasSeenWelcome) {
            const timer = setTimeout(() => {
                setShowWelcome(true)
                setEmotion('happy')
                localStorage.setItem('ai_companion_welcomed', 'true')
            }, 2000)
            return () => clearTimeout(timer)
        }
    }, [])

    // Emotion cycling with time awareness
    useEffect(() => {
        if (isOpen) return // Don't cycle while chat is open

        const interval = setInterval(() => {
            setEmotion(prev => {
                // 70% chance to stay with time-based emotion
                if (Math.random() < 0.7) {
                    return getTimeBasedEmotion()
                }
                // 30% chance for random emotion variety
                const emotions: EmotionState[] = ['neutral', 'happy', 'thoughtful', 'energetic']
                const filtered = emotions.filter(e => e !== prev)
                return filtered[Math.floor(Math.random() * filtered.length)]
            })
        }, 10000)

        return () => clearInterval(interval)
    }, [isOpen])

    const handleOpen = useCallback(() => {
        setIsOpen(true)
        setShowWelcome(false)
        setEmotion('happy')
    }, [])

    const handleDismissWelcome = useCallback(() => {
        setShowWelcome(false)
    }, [])

    // Keyboard support
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleOpen()
        }
    }, [handleOpen])

    const config = EMOTION_CONFIGS[emotion]
    const IconComponent = config.icon

    return (
        <>
            {/* Floating AI Companion */}
            <motion.div
                className="fixed bottom-8 right-8 z-50"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                    type: 'spring',
                    duration: prefersReducedMotion ? 0.3 : 1,
                    bounce: 0.4
                }}
            >
                {/* Welcome Tooltip */}
                <AnimatePresence>
                    {showWelcome && !isOpen && (
                        <WelcomeTooltip onDismiss={handleDismissWelcome} />
                    )}
                </AnimatePresence>

                {/* The Living Orb */}
                <motion.button
                    ref={buttonRef}
                    onClick={handleOpen}
                    onKeyDown={handleKeyDown}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    className="relative group focus:outline-none focus-visible:ring-4 focus-visible:ring-purple-500/50 rounded-full"
                    whileHover={{ scale: prefersReducedMotion ? 1 : 1.1 }}
                    whileTap={{ scale: prefersReducedMotion ? 1 : 0.95 }}
                    aria-label={`AI Companion - ${config.label}. Click to open chat.`}
                    aria-expanded={isOpen}
                    role="button"
                    tabIndex={0}
                >
                    {/* Floating particles */}
                    <AnimatePresence>
                        {isHovered && !prefersReducedMotion && (
                            <FloatingParticles color="bg-white/60" count={8} />
                        )}
                    </AnimatePresence>

                    {/* Breathing aura - outer glow */}
                    {!prefersReducedMotion && (
                        <motion.div
                            className={`absolute inset-[-8px] rounded-full bg-gradient-to-r ${config.gradient} opacity-20 blur-xl`}
                            animate={{
                                scale: 1.3,
                                opacity: 0.4
                            }}
                            transition={{
                                duration: config.pulseSpeed / 2,
                                repeat: Infinity,
                                repeatType: "reverse",
                                ease: "easeInOut"
                            }}
                        />
                    )}

                    {/* Secondary aura ring */}
                    {!prefersReducedMotion && (
                        <motion.div
                            className={`absolute inset-[-4px] rounded-full bg-gradient-to-r ${config.gradient} opacity-30`}
                            animate={{
                                scale: 1.15,
                                opacity: 0.5
                            }}
                            transition={{
                                duration: config.pulseSpeed * 0.4,
                                repeat: Infinity,
                                repeatType: "reverse",
                                ease: "easeInOut",
                                delay: 0.2
                            }}
                        />
                    )}

                    {/* Main orb with glassmorphism */}
                    <motion.div
                        className={`
              relative w-16 h-16 rounded-full
              bg-gradient-to-br ${config.gradient}
              shadow-2xl flex items-center justify-center text-white
              backdrop-blur-sm
              border border-white/20
            `}
                        animate={prefersReducedMotion ? {} : {
                            boxShadow: `0 0 40px ${config.shadowColor}`
                        }}
                        transition={{
                            duration: 1,
                            repeat: Infinity,
                            repeatType: "reverse",
                            ease: "easeInOut"
                        }}
                    >
                        {/* Inner glow */}
                        <div className="absolute inset-2 rounded-full bg-white/10 backdrop-blur-sm" />

                        {/* Icon with subtle animation */}
                        <motion.div
                            className="relative z-10"
                            animate={prefersReducedMotion ? {} : {
                                rotate: emotion === 'thoughtful' ? 360 : 0,
                                scale: emotion === 'energetic' ? 1.1 : 1,
                            }}
                            transition={{
                                rotate: { duration: 8, repeat: Infinity, ease: 'linear' },
                                scale: { duration: 0.5, repeat: emotion === 'energetic' ? Infinity : 0, repeatType: 'reverse', ease: 'easeInOut' }
                            }}
                        >
                            <IconComponent className="h-6 w-6 drop-shadow-lg" />
                        </motion.div>
                    </motion.div>

                    {/* Status indicator */}
                    <motion.div
                        className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center"
                        animate={prefersReducedMotion ? {} : {
                            scale: 1.2,
                        }}
                        transition={{
                            duration: 1,
                            repeat: Infinity,
                            repeatType: "reverse",
                            ease: "easeInOut"
                        }}
                    >
                        <div className="w-2 h-2 bg-white rounded-full" />
                    </motion.div>

                    {/* Hover tooltip - only show when not showing welcome */}
                    <AnimatePresence>
                        {isHovered && !showWelcome && (
                            <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 5 }}
                                className="absolute bottom-20 right-0 bg-gray-900/95 backdrop-blur-sm text-white text-xs rounded-xl px-4 py-2 whitespace-nowrap shadow-xl border border-white/10"
                            >
                                <span className="font-medium">{config.label}</span>
                                <span className="block text-gray-400 text-[10px] mt-0.5">Click to chat</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.button>
            </motion.div>

            {/* Chat Interface */}
            <GlobalChatSheet
                open={isOpen}
                onOpenChange={setIsOpen}
                context={{ page: 'dashboard' }}
            />
        </>
    )
}

export default memo(LivingAICompanion)
