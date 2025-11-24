'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, MessageCircle, Heart, X } from 'lucide-react'
import GlobalChatSheet from '@/components/dashboard/global-chat-sheet'

export default function LivingAICompanion() {
    const [isOpen, setIsOpen] = useState(false)
    const [emotion, setEmotion] = useState<'neutral' | 'happy' | 'thoughtful'>('neutral')
    const [showWelcome, setShowWelcome] = useState(false)

    // Check if first time user
    useEffect(() => {
        const hasSeenWelcome = localStorage.getItem('ai_companion_welcomed')
        if (!hasSeenWelcome) {
            setTimeout(() => {
                setShowWelcome(true)
                setEmotion('happy')
                localStorage.setItem('ai_companion_welcomed', 'true')
            }, 2000)
        }
    }, [])

    // Random emotional expressions
    useEffect(() => {
        const interval = setInterval(() => {
            const emotions: Array<'neutral' | 'happy' | 'thoughtful'> = ['neutral', 'happy', 'thoughtful']
            setEmotion(emotions[Math.floor(Math.random() * emotions.length)])
        }, 8000)

        return () => clearInterval(interval)
    }, [])

    const getEmotionColor = () => {
        switch (emotion) {
            case 'happy': return 'from-amber-400 to-orange-500'
            case 'thoughtful': return 'from-purple-400 to-indigo-500'
            default: return 'from-blue-400 to-cyan-500'
        }
    }

    const getIcon = () => {
        switch (emotion) {
            case 'happy': return <Heart className="h-6 w-6" />
            case 'thoughtful': return <Sparkles className="h-6 w-6" />
            default: return <MessageCircle className="h-6 w-6" />
        }
    }

    return (
        <>
            {/* Floating AI Companion */}
            <motion.div
                className="fixed bottom-8 right-8 z-50"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', duration: 1 }}
            >
                {/* Welcome Tooltip */}
                <AnimatePresence>
                    {showWelcome && !isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="absolute bottom-20 right-0 bg-white rounded-2xl shadow-2xl p-4 max-w-xs border-2 border-purple-200"
                        >
                            <button
                                onClick={() => setShowWelcome(false)}
                                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-4 w-4" />
                            </button>
                            <p className="text-sm text-gray-700 font-medium">
                                Hey there! 👋 I'm your AI companion. I'm here whenever you need to talk or reflect.
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                                Click me anytime to chat!
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* The Living Orb */}
                <motion.button
                    onClick={() => setIsOpen(true)}
                    className="relative group"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                >
                    {/* Breathing aura */}
                    <motion.div
                        className={`absolute inset-0 rounded-full bg-gradient-to-r ${getEmotionColor()} opacity-30 blur-xl`}
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.3, 0.5, 0.3]
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />

                    {/* Main orb */}
                    <motion.div
                        className={`relative w-16 h-16 rounded-full bg-gradient-to-br ${getEmotionColor()} shadow-2xl flex items-center justify-center text-white`}
                        animate={{
                            boxShadow: [
                                '0 0 20px rgba(147, 51, 234, 0.3)',
                                '0 0 40px rgba(147, 51, 234, 0.6)',
                                '0 0 20px rgba(147, 51, 234, 0.3)'
                            ]
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    >
                        <motion.div
                            animate={{ rotate: emotion === 'thoughtful' ? 360 : 0 }}
                            transition={{ duration: 2 }}
                        >
                            {getIcon()}
                        </motion.div>
                    </motion.div>

                    {/* Pulse indicator (when active/thinking) */}
                    <motion.div
                        className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"
                        animate={{
                            scale: [1, 1.3, 1],
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity
                        }}
                    />

                    {/* Tooltip on hover */}
                    <div className="absolute bottom-20 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap">
                        Talk to your AI therapist
                    </div>
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
