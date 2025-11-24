'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Brain, ArrowRight, Check, RefreshCw } from 'lucide-react'

export default function ThoughtChallenge({ userId, onClose }: { userId: string; onClose?: () => void }) {
    const [step, setStep] = useState<'input' | 'questions' | 'reframe' | 'complete'>('input')
    const [thought, setThought] = useState('')
    const [loading, setLoading] = useState(false)
    const [questions, setQuestions] = useState<string[]>([])
    const [answers, setAnswers] = useState<string[]>([])
    const [reframe, setReframe] = useState('')
    const { toast } = useToast()

    const handleThoughtSubmit = async () => {
        if (!thought.trim()) return
        setLoading(true)
        try {
            const res = await fetch('/api/cbt/challenge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ thought, step: 'validate' }),
            })
            const data = await res.json()

            if (data.questions) {
                setQuestions(data.questions)
                setAnswers(new Array(data.questions.length).fill(''))
                setStep('questions')
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to analyze thought", variant: "destructive" })
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
            const data = await res.json()

            if (data.reframe) {
                setReframe(data.reframe)
                setStep('reframe')
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to generate reframe", variant: "destructive" })
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
        <Card className="p-6 max-w-2xl mx-auto border-2 border-purple-100 bg-white shadow-xl">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-100 rounded-full">
                    <Brain className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                    <h2 className="text-xl font-serif font-bold text-gray-900">Thought Challenge</h2>
                    <p className="text-sm text-gray-500">Let's reframe that negative thought.</p>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {step === 'input' && (
                    <motion.div
                        key="input"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                    >
                        <label className="block text-sm font-medium text-gray-700">
                            What's the negative thought bothering you?
                        </label>
                        <Textarea
                            value={thought}
                            onChange={(e) => setThought(e.target.value)}
                            placeholder="e.g., I'm going to fail this project because I'm behind..."
                            className="min-h-[100px]"
                        />
                        <Button
                            onClick={handleThoughtSubmit}
                            disabled={loading || !thought.trim()}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Challenge This Thought'}
                        </Button>
                    </motion.div>
                )}

                {step === 'questions' && (
                    <motion.div
                        key="questions"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <div className="space-y-4">
                            {questions.map((q, i) => (
                                <div key={i} className="space-y-2">
                                    <p className="text-sm font-medium text-purple-800 bg-purple-50 p-3 rounded-lg">
                                        {q}
                                    </p>
                                    <Textarea
                                        value={answers[i]}
                                        onChange={(e) => {
                                            const newAnswers = [...answers]
                                            newAnswers[i] = e.target.value
                                            setAnswers(newAnswers)
                                        }}
                                        placeholder="Your answer..."
                                        className="min-h-[60px]"
                                    />
                                </div>
                            ))}
                        </div>
                        <Button
                            onClick={handleAnswersSubmit}
                            disabled={loading || answers.some(a => !a.trim())}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Generate New Perspective'}
                        </Button>
                    </motion.div>
                )}

                {step === 'reframe' && (
                    <motion.div
                        key="reframe"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-6"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                                <p className="text-xs font-bold text-red-500 uppercase mb-2">Old Thought</p>
                                <p className="text-gray-700 italic">"{thought}"</p>
                            </div>
                            <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                                <p className="text-xs font-bold text-green-600 uppercase mb-2">New Perspective</p>
                                <p className="text-gray-800 font-medium">"{reframe}"</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-gray-500">
                                Does this feel true to you? You can edit it if needed.
                            </label>
                            <Textarea
                                value={reframe}
                                onChange={(e) => setReframe(e.target.value)}
                                className="min-h-[80px]"
                            />
                        </div>

                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setStep('questions')}
                                className="flex-1"
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Try Again
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={loading}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save This Thought'}
                            </Button>
                        </div>
                    </motion.div>
                )}

                {step === 'complete' && (
                    <motion.div
                        key="complete"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center space-y-6 py-8"
                    >
                        <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                            <Check className="h-8 w-8 text-green-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">Great job!</h3>
                            <p className="text-gray-500 mt-2">
                                You've successfully reframed a negative thought. <br />
                                This is how you rewire your brain for resilience.
                            </p>
                        </div>
                        <Button
                            onClick={onClose}
                            className="bg-gray-900 text-white"
                        >
                            Close
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </Card>
    )
}
