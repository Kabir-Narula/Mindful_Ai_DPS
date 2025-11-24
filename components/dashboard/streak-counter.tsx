'use client'

import { Flame, Trophy } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface StreakCounterProps {
    userId: string
    streak: { current: number; longest: number }
}

export default function StreakCounter({ userId, streak }: StreakCounterProps) {
    if (!streak || streak.current === 0) return null

    const isHotStreak = streak.current >= 7
    const isMilestone = streak.current % 7 === 0 && streak.current > 0

    return (
        <Card className={`p-6 border-2 ${isHotStreak ? 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-300' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${isHotStreak ? 'bg-orange-100' : 'bg-gray-100'}`}>
                    <Flame className={`h-8 w-8 ${isHotStreak ? 'text-orange-600' : 'text-gray-600'}`} />
                </div>
                <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-4xl font-bold text-gray-900">{streak.current}</h3>
                        <span className="text-sm text-gray-600">day streak!</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        {isMilestone && "🎉 Week milestone! "}
                        {isHotStreak ? "You're on fire! Keep it going!" : "Don't break the chain!"}
                    </p>
                    {streak.longest > streak.current && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                            <Trophy className="h-3 w-3" />
                            <span>Best: {streak.longest} days</span>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    )
}
