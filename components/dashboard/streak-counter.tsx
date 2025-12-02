'use client'

import { Flame, Trophy, Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { motion } from 'framer-motion'

interface StreakCounterProps {
    userId: string  // Reserved for future personalization
    streak: { current: number; longest: number }
}

export default function StreakCounter({ streak }: StreakCounterProps) {
    if (!streak || streak.current === 0) return null

    const isHotStreak = streak.current >= 7
    const isMilestone = streak.current % 7 === 0 && streak.current > 0
    const isNewRecord = streak.current >= streak.longest

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
            <Card className={`relative overflow-hidden p-6 transition-all duration-500 ${isHotStreak
                ? 'bg-gradient-to-br from-orange-50 via-amber-50 to-red-50 border-2 border-orange-200/80 shadow-lg shadow-orange-100/50'
                : 'bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-200/80 shadow-sm'
                }`}>
                {/* Ambient glow for hot streaks */}
                {isHotStreak && (
                    <div className="absolute -top-12 -right-12 w-32 h-32 bg-orange-300/20 blur-3xl rounded-full" />
                )}

                <div className="relative flex items-center gap-4">
                    {/* Animated flame icon */}
                    <motion.div
                        className={`relative p-3 rounded-2xl ${isHotStreak
                            ? 'bg-gradient-to-br from-orange-100 to-amber-100'
                            : 'bg-gray-100'
                            }`}
                        animate={isHotStreak ? {
                            scale: 1.05,
                        } : {}}
                        transition={{ duration: 1, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                    >
                        <Flame className={`h-8 w-8 ${isHotStreak
                            ? 'text-orange-500 drop-shadow-sm'
                            : 'text-gray-500'
                            }`} />

                        {/* Sparkle effect for milestones */}
                        {isMilestone && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="absolute -top-1 -right-1"
                            >
                                <Sparkles className="h-4 w-4 text-amber-500" />
                            </motion.div>
                        )}
                    </motion.div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                            <motion.h3
                                className={`text-4xl font-bold tracking-tight ${isHotStreak ? 'text-orange-900' : 'text-gray-900'
                                    }`}
                                key={streak.current}
                                initial={{ scale: 1.2, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", stiffness: 300 }}
                            >
                                {streak.current}
                            </motion.h3>
                            <span className={`text-sm font-medium ${isHotStreak ? 'text-orange-700' : 'text-gray-600'
                                }`}>
                                day streak
                            </span>
                        </div>

                        <p className={`text-xs mt-1.5 ${isHotStreak ? 'text-orange-600/80' : 'text-gray-500'
                            }`}>
                            {isMilestone && "🎉 Week milestone! "}
                            {isHotStreak ? "You're on fire! Keep going!" : "Build the habit, one day at a time."}
                        </p>

                        {/* Progress bar to next milestone */}
                        <div className="mt-3">
                            <div className="flex items-center justify-between text-[10px] font-medium text-gray-400 mb-1">
                                <span>Progress to {Math.ceil(streak.current / 7) * 7} days</span>
                                <span>{streak.current % 7}/7</span>
                            </div>
                            <div className="h-1.5 bg-gray-200/50 rounded-full overflow-hidden">
                                <motion.div
                                    className={`h-full rounded-full ${isHotStreak
                                        ? 'bg-gradient-to-r from-orange-400 to-amber-400'
                                        : 'bg-gradient-to-r from-gray-400 to-gray-500'
                                        }`}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${((streak.current % 7) / 7) * 100}%` }}
                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                />
                            </div>
                        </div>

                        {/* Personal best indicator */}
                        {streak.longest > 0 && (
                            <div className={`flex items-center gap-1.5 mt-3 text-xs ${isNewRecord ? 'text-amber-600 font-medium' : 'text-gray-400'
                                }`}>
                                <Trophy className={`h-3.5 w-3.5 ${isNewRecord ? 'text-amber-500' : ''}`} />
                                <span>
                                    {isNewRecord
                                        ? 'New personal best!'
                                        : `Best: ${streak.longest} days`
                                    }
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </Card>
        </motion.div>
    )
}
