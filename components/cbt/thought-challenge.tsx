'use client'

import { useState, memo } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Brain, Check, RefreshCw, Lightbulb, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

type Step = 'input' | 'questions' | 'reframe' | 'complete'

interface ThoughtChallengeProps {
    onClose?: () => void
    className?: string
}

const STEPS: { key: Step; label: string; icon: typeof Brain }[] = [
    { key: 'input', label: 'Identify', icon: Brain },
    { key: 'questions', label: 'Challenge', icon: Lightbulb },
    { key: 'reframe', label: 'Reframe', icon: Sparkles },
    { key: 'complete', label: 'Complete', icon: Check },
]

// ============================================================================
// PROGRESS INDICATOR
// ============================================================================

const ProgressIndicator = memo(function ProgressIndicator({
    currentStep,
    prefersReducedMotion,
}: {
    currentStep: Step
    prefersReducedMotion: boolean | null
}) {
    const currentIndex = STEPS.findIndex(s => s.key === currentStep)

    return (
        <div className="flex items-center justify-center gap-2 mb-6" role="progressbar" aria-valuenow={currentIndex + 1} aria-valuemax={4}>
            {STEPS.map((step, index) => {
                const isActive = index === currentIndex
                const isComplete = index < currentIndex
                const Icon = step.icon

                return (
                    <div key={step.key} className="flex items-center">
                        <motion.div
                            initial={prefersReducedMotion ? {} : { scale: 0.8 }}
                            animate={{
                                scale: isActive ? 1.1 : 1,
                                backgroundColor: isComplete || isActive ? '#9333ea' : '#e9d5ff'
                            }}
                            className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                                isActive && "ring-2 ring-purple-200 ring-offset-2"
                            )}
                        >
                            <Icon className={cn(
                                "h-4 w-4 transition-colors",
                                isComplete || isActive ? "text-white" : "text-purple-400"
                            )} />
                        </motion.div>
                        {index < STEPS.length - 1 && (
                            <div className={cn(
                                "w-8 h-0.5 mx-1 transition-colors",
                                index < currentIndex ? "bg-purple-600" : "bg-purple-200"
                            )} />
                        )}
                    </div>
                )
            })}
        </div>
    )
})

// ============================================================================
// CHARACTER COUNTER
// ============================================================================

const CharCounter = memo(function CharCounter({ current, max = 500 }: { current: number; max?: number }) {
    const isNearLimit = current > max * 0.8
    const isOverLimit = current > max

    return (
        <span className={cn(
            "text-xs transition-colors",
            isOverLimit ? "text-red-500" : isNearLimit ? "text-amber-500" : "text-gray-400"
        )}>
            {current}/{max}
        </span>
    )
})

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function ThoughtChallenge({ onClose, className }: ThoughtChallengeProps) {
    const [step, setStep] = useState<Step>('input')
    const [thought, setThought] = useState('')
    const [loading, setLoading] = useState(false)
    const [questions, setQuestions] = useState<string[]>([])
    const [answers, setAnswers] = useState<string[]>([])
    const [reframe, setReframe] = useState('')
    const { toast } = useToast()
    const prefersReducedMotion = useReducedMotion()

    const handleThoughtSubmit = async () => {
        if (!thought.trim()) return
        setLoading(true)
        try {
            const res = await fetch('/api/cbt/challenge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ thought, step: 'validate' }),
            })

            if (!res.ok) {
                throw new Error(`API error: ${res.status}`)
            }

            const data = await res.json()

            // Handle both array format and object with questions property
            const questions = Array.isArray(data.questions)
                ? data.questions.map((q: any) => typeof q === 'string' ? q : q.question)
                : Array.isArray(data)
                    ? data.map((q: any) => typeof q === 'string' ? q : q.question)
                    : null

            if (questions && questions.length > 0) {
                setQuestions(questions)
                setAnswers(new Array(questions.length).fill(''))
                setStep('questions')
            } else {
                console.error('No questions returned from API:', data)
                toast({
                    title: "Error",
                    description: "Failed to generate questions. Please check your OpenAI API key.",
                    variant: "destructive"
                })
            }
        } catch (error) {
            console.error('CBT thought submit error:', error)
            toast({ title: "Error", description: "Failed to analyze thought. Please try again.", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    const handleAnswersSubmit = async () => {
        setLoading(true)
        try {
            const conversation = questions.map((q, i) => ({ question: q, answer: answers[i] }))

            const res = await fetch('/api/cbt/challenge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ thought, conversation, step: 'reframe' }),
            })

            if (!res.ok) {
                throw new Error(`API error: ${res.status}`)
            }

            const data = await res.json()

            // Handle different response formats - ensure we get a string
            let reframeText: string | null = null

            if (typeof data === 'string') {
                reframeText = data
            } else if (typeof data?.reframe === 'string') {
                reframeText = data.reframe
            } else if (typeof data?.reframedThought === 'string') {
                reframeText = data.reframedThought
            } else if (data?.reframe?.reframedThought && typeof data.reframe.reframedThought === 'string') {
                reframeText = data.reframe.reframedThought
            }

            if (reframeText && reframeText.trim()) {
                setReframe(reframeText)
                setStep('reframe')
            } else {
                console.error('No reframe returned from API:', data)
                toast({
                    title: "Error",
                    description: "Failed to generate reframe. Please check your OpenAI API key.",
                    variant: "destructive"
                })
            }
        } catch (error) {
            console.error('CBT reframe error:', error)
            toast({ title: "Error", description: "Failed to generate reframe. Please try again.", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setLoading(true)
        try {
            const conversation = questions.map((q, i) => ({ question: q, answer: answers[i] }))

            await fetch('/api/cbt/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    originalThought: thought,
                    reframedThought: reframe,
                    conversation
                }),
            })

            setStep('complete')
            toast({
                title: "🎉 You did it!",
                description: "You just reframed a negative thought. That's a real skill you're building!"
            })
        } catch (error) {
            toast({ title: "Error", description: "Failed to save", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className={cn(
            "p-6 max-w-2xl mx-auto border-2 border-purple-100 bg-gradient-to-br from-white to-purple-50/30 shadow-xl overflow-hidden relative",
            className
        )}>
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            {/* Header */}
            <motion.div
                className="flex items-center gap-3 mb-4"
                initial={prefersReducedMotion ? {} : { opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <motion.div
                    className="p-2.5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-md"
                    whileHover={prefersReducedMotion ? {} : { scale: 1.05, rotate: 5 }}
                >
                    <Brain className="h-6 w-6 text-white" />
                </motion.div>
                <div>
                    <h2 className="text-xl font-serif font-bold text-gray-900">Thought Challenge</h2>
                    <p className="text-sm text-gray-500">Let's reframe that negative thought together.</p>
                </div>
            </motion.div>

            {/* Progress indicator */}
            <ProgressIndicator currentStep={step} prefersReducedMotion={prefersReducedMotion} />

            <AnimatePresence mode="wait">
                {step === 'input' && (
                    <motion.div
                        key="input"
                        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                    >
                        <label className="block text-sm font-medium text-gray-700" htmlFor="thought-input">
                            What's the negative thought bothering you?
                        </label>
                        <div className="relative">
                            <Textarea
                                id="thought-input"
                                value={thought}
                                onChange={(e) => setThought(e.target.value)}
                                placeholder="e.g., I'm going to fail this project because I'm behind..."
                                className="min-h-[120px] pr-16 resize-none transition-all focus:ring-2 focus:ring-purple-500/20"
                                maxLength={500}
                            />
                            <div className="absolute bottom-2 right-2">
                                <CharCounter current={thought.length} max={500} />
                            </div>
                        </div>
                        <Button
                            onClick={handleThoughtSubmit}
                            disabled={loading || !thought.trim() || thought.length > 500}
                            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md transition-all h-12"
                        >
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <span className="flex items-center gap-2">
                                    Challenge This Thought
                                    <Lightbulb className="h-4 w-4" />
                                </span>
                            )}
                        </Button>
                    </motion.div>
                )}

                {step === 'questions' && (
                    <motion.div
                        key="questions"
                        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        {/* Question progress */}
                        <div className="flex items-center justify-between text-sm text-gray-500">
                            <span>Answering questions</span>
                            <span className="font-medium text-purple-600">
                                {answers.filter(a => a.trim()).length}/{questions.length} answered
                            </span>
                        </div>

                        <div className="space-y-4">
                            {questions.map((q, i) => (
                                <motion.div
                                    key={i}
                                    className="space-y-2"
                                    initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                >
                                    <div className="flex items-start gap-2">
                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-xs font-bold flex items-center justify-center mt-0.5">
                                            {i + 1}
                                        </span>
                                        <p className="text-sm font-medium text-purple-800 bg-purple-50/80 p-3 rounded-lg flex-1">
                                            {q}
                                        </p>
                                    </div>
                                    <div className="ml-8">
                                        <Textarea
                                            value={answers[i]}
                                            onChange={(e) => {
                                                const newAnswers = [...answers]
                                                newAnswers[i] = e.target.value
                                                setAnswers(newAnswers)
                                            }}
                                            placeholder="Take your time to reflect..."
                                            className="min-h-[80px] resize-none transition-all focus:ring-2 focus:ring-purple-500/20"
                                        />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                        <Button
                            onClick={handleAnswersSubmit}
                            disabled={loading || answers.some(a => !a.trim())}
                            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md h-12"
                        >
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <span className="flex items-center gap-2">
                                    Generate New Perspective
                                    <Sparkles className="h-4 w-4" />
                                </span>
                            )}
                        </Button>
                    </motion.div>
                )}

                {step === 'reframe' && (
                    <motion.div
                        key="reframe"
                        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-6"
                    >
                        {/* Before/After comparison */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <motion.div
                                className="p-4 bg-gradient-to-br from-red-50 to-rose-50 rounded-xl border border-red-100 shadow-sm"
                                initial={prefersReducedMotion ? {} : { x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                            >
                                <p className="text-xs font-bold text-red-500 uppercase mb-2 flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-red-400" />
                                    Old Thought
                                </p>
                                <p className="text-gray-700 italic text-sm leading-relaxed">"{thought}"</p>
                            </motion.div>
                            <motion.div
                                className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100 shadow-sm"
                                initial={prefersReducedMotion ? {} : { x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                <p className="text-xs font-bold text-green-600 uppercase mb-2 flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-green-400" />
                                    New Perspective
                                </p>
                                <p className="text-gray-800 font-medium text-sm leading-relaxed">"{reframe}"</p>
                            </motion.div>
                        </div>

                        <motion.div
                            className="space-y-2"
                            initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <label className="text-sm text-gray-500" htmlFor="reframe-edit">
                                Does this feel true to you? You can edit it if needed.
                            </label>
                            <Textarea
                                id="reframe-edit"
                                value={reframe}
                                onChange={(e) => setReframe(e.target.value)}
                                className="min-h-[80px] resize-none transition-all focus:ring-2 focus:ring-green-500/20"
                            />
                        </motion.div>

                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setStep('questions')}
                                className="flex-1 h-11"
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Try Again
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={loading || !reframe || (typeof reframe === 'string' && !reframe.trim())}
                                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md h-11"
                            >
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <Check className="h-4 w-4" />
                                        Save This Thought
                                    </span>
                                )}
                            </Button>
                        </div>
                    </motion.div>
                )}

                {step === 'complete' && (
                    <motion.div
                        key="complete"
                        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center space-y-6 py-8"
                    >
                        <motion.div
                            className="mx-auto h-20 w-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center shadow-lg"
                            initial={prefersReducedMotion ? {} : { scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', delay: 0.2 }}
                        >
                            <Check className="h-10 w-10 text-green-600" />
                        </motion.div>

                        <motion.div
                            initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <h3 className="text-2xl font-bold text-gray-900">Great job! 🎉</h3>
                            <p className="text-gray-500 mt-2 max-w-sm mx-auto">
                                You've successfully reframed a negative thought.
                                This is how you rewire your brain for resilience.
                            </p>
                        </motion.div>

                        {/* Celebration particles */}
                        {!prefersReducedMotion && (
                            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                {[...Array(8)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        className="absolute w-2 h-2 rounded-full"
                                        style={{
                                            left: `${20 + i * 10}%`,
                                            backgroundColor: ['#10b981', '#8b5cf6', '#f59e0b', '#ec4899'][i % 4]
                                        }}
                                        initial={{ y: '100%', opacity: 0, x: 0 }}
                                        animate={{
                                            y: '-100%',
                                            opacity: 1,
                                            x: (i % 2 === 0 ? 1 : -1) * 20
                                        }}
                                        transition={{
                                            duration: 2,
                                            delay: 0.5 + i * 0.1,
                                            ease: 'easeOut',
                                            opacity: { duration: 0.5 }
                                        }}
                                    />
                                ))}
                            </div>
                        )}

                        <motion.div
                            initial={prefersReducedMotion ? {} : { opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                        >
                            <Button
                                onClick={onClose}
                                className="bg-gray-900 hover:bg-gray-800 text-white px-8 h-11"
                            >
                                Close
                            </Button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Card>
    )
}

export default memo(ThoughtChallenge)
