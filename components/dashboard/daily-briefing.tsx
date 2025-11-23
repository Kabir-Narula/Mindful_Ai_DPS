'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, ArrowRight, Sun, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DailyBriefingProps {
    user: {
        name: string | null
    }
    dayLog: {
        id: string
        morningIntention: string | null
        dailyInsight: string | null
        suggestedAction: string | null
    } | null
}

export default function DailyBriefing({ user, dayLog }: DailyBriefingProps) {
    const [intention, setIntention] = useState(dayLog?.morningIntention || '')
    const [loading, setLoading] = useState(false)
    const [acceptingChallenge, setAcceptingChallenge] = useState(false)
    const [isEditing, setIsEditing] = useState(!dayLog?.morningIntention)
    const router = useRouter()
    const { toast } = useToast()

    const handleSaveIntention = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!intention.trim()) return

        setLoading(true)
        try {
            const res = await fetch('/api/day-log/intention', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ intention }),
            })

            if (!res.ok) throw new Error('Failed to save intention')

            toast({
                title: 'Intention set',
                description: 'Have a mindful day.',
            })

            setIsEditing(false)
            router.refresh()
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to save intention',
                variant: 'destructive',
            })
        } finally {
            setLoading(false)
        }
    }

    const handleAcceptChallenge = async () => {
        if (!dayLog?.suggestedAction) return

        setAcceptingChallenge(true)
        try {
            const res = await fetch('/api/goals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: dayLog.suggestedAction,
                    description: 'AI-suggested challenge',
                }),
            })

            if (!res.ok) throw new Error('Failed to create goal')

            toast({
                title: 'Challenge accepted!',
                description: 'Added to your goals.',
            })

            router.refresh()
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to accept challenge',
                variant: 'destructive',
            })
        } finally {
            setAcceptingChallenge(false)
        }
    }

    return (
        <div className="space-y-12 mb-16">
            {/* Header Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-400">
                    <Sun className="h-4 w-4" />
                    <span>Daily Briefing</span>
                </div>
                <h1 className="text-5xl md:text-6xl font-serif text-[#1A1A1A] leading-tight">
                    Good Morning, {user.name?.split(' ')[0] || 'Friend'}.
                </h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Morning Intention */}
                <div className="space-y-6">
                    <h2 className="text-xl font-serif italic text-gray-500">
                        What is your main focus for today?
                    </h2>

                    {isEditing ? (
                        <form onSubmit={handleSaveIntention} className="flex gap-4">
                            <Input
                                value={intention}
                                onChange={(e) => setIntention(e.target.value)}
                                placeholder="I want to focus on..."
                                className="text-2xl font-serif border-b-2 border-gray-200 focus:border-black transition-colors px-0 h-auto py-2 rounded-none bg-transparent"
                                autoFocus
                                disabled={loading}
                            />
                            <Button
                                type="submit"
                                disabled={loading || !intention.trim()}
                                variant="ghost"
                                size="icon"
                                className="hover:bg-transparent"
                            >
                                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <ArrowRight className="h-6 w-6" />}
                            </Button>
                        </form>
                    ) : (
                        <div className="group cursor-pointer" onClick={() => setIsEditing(true)}>
                            <p className="text-3xl font-serif text-[#1A1A1A] border-b border-transparent group-hover:border-gray-200 transition-all inline-block pb-1">
                                "{intention}"
                            </p>
                            <p className="text-xs text-gray-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                Click to edit
                            </p>
                        </div>
                    )}
                </div>

                {/* Insight / Action */}
                {(dayLog?.dailyInsight || dayLog?.suggestedAction) && (
                    <div className="bg-[#F2F0E9] p-8 space-y-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Sparkles className="h-24 w-24" />
                        </div>

                        {dayLog.dailyInsight && (
                            <div className="space-y-2 relative z-10">
                                <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
                                    Recent Insight
                                </span>
                                <p className="text-lg font-serif text-gray-800 leading-relaxed">
                                    {dayLog.dailyInsight}
                                </p>
                            </div>
                        )}

                        {dayLog.suggestedAction && (
                            <div className="space-y-4 pt-4 border-t border-gray-300/50 relative z-10">
                                <span className="text-xs font-bold uppercase tracking-widest text-purple-600">
                                    Suggested Action
                                </span>
                                <div className="flex items-start gap-4">
                                    <p className="text-lg font-medium text-gray-900 flex-1">
                                        {dayLog.suggestedAction}
                                    </p>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="shrink-0"
                                        onClick={handleAcceptChallenge}
                                        disabled={acceptingChallenge}
                                    >
                                        {acceptingChallenge ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Adding...
                                            </>
                                        ) : (
                                            'Accept Challenge'
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
