'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Sparkles, PenLine, CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

const promptSuggestions = [
    "What's making me feel this way?",
    "What am I grateful for right now?",
    "What's one win from today?",
    "What's weighing on my mind?"
]

export default function QuickJournalModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [loading, setLoading] = useState(false)
    const [saved, setSaved] = useState(false)
    const [charCount, setCharCount] = useState(0)
    const { toast } = useToast()
    const router = useRouter()

    useEffect(() => {
        setCharCount(content.length)
    }, [content])

    // Reset state when modal closes
    useEffect(() => {
        if (!open) {
            setTimeout(() => {
                setSaved(false)
                setTitle('')
                setContent('')
            }, 300)
        }
    }, [open])

    const handleSubmit = async () => {
        if (!content.trim()) {
            toast({
                title: 'Empty entry',
                description: 'Please write at least one sentence',
                variant: 'destructive'
            })
            return
        }

        setLoading(true)
        try {
            const res = await fetch('/api/journal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: title.trim() || 'Quick Check-In',
                    content: content.trim(),
                    moodRating: 6,
                    activities: []
                })
            })

            const data = await res.json()

            if (!res.ok) throw new Error(data.error)

            setSaved(true)

            // Close after showing success state
            setTimeout(() => {
                onOpenChange(false)
                router.refresh()
            }, 1200)

        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Something went wrong'
            toast({
                title: 'Error',
                description: message,
                variant: 'destructive'
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg border-0 shadow-2xl bg-white rounded-2xl overflow-hidden p-0">
                {/* Decorative header */}
                <div className="h-1 bg-gradient-to-r from-purple-500 via-violet-500 to-purple-600" />

                <div className="p-6">
                    <DialogHeader className="pb-4">
                        <DialogTitle className="flex items-center gap-3 text-xl font-serif">
                            <div className="p-2 bg-purple-50 rounded-xl">
                                <PenLine className="h-5 w-5 text-purple-600" />
                            </div>
                            Quick Check-In
                        </DialogTitle>
                    </DialogHeader>

                    <AnimatePresence mode="wait">
                        {saved ? (
                            <motion.div
                                key="saved"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                className="py-12 text-center"
                            >
                                <motion.div
                                    initial={{ scale: 0, rotate: -10 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                                    className="mx-auto w-16 h-16 bg-gradient-to-br from-emerald-100 to-green-100 rounded-2xl flex items-center justify-center mb-4"
                                >
                                    <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                                </motion.div>
                                <h3 className="font-serif font-bold text-xl text-gray-900 mb-1">Saved!</h3>
                                <p className="text-sm text-gray-500">Your thoughts have been captured.</p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="form"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-5"
                            >
                                {/* Title input */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                                        Title <span className="text-gray-400 font-normal">(optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Quick Check-In"
                                        className="w-full px-4 py-2.5 text-base border border-gray-200 rounded-xl focus:border-purple-300 focus:ring-2 focus:ring-purple-100 focus:outline-none transition-all"
                                    />
                                </div>

                                {/* Content input */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                                        What's on your mind right now?
                                    </label>
                                    <Textarea
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        placeholder="Just one sentence is enough..."
                                        className="min-h-[120px] text-base border-gray-200 rounded-xl focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all resize-none"
                                        autoFocus
                                    />
                                    <div className="flex justify-between items-center mt-2">
                                        <p className="text-xs text-gray-400">
                                            Building the habit, one thought at a time
                                        </p>
                                        <span className={`text-xs font-mono ${charCount > 0 ? 'text-gray-500' : 'text-gray-300'}`}>
                                            {charCount}
                                        </span>
                                    </div>
                                </div>

                                {/* Prompt suggestions when empty */}
                                {content.length === 0 && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex flex-wrap gap-2"
                                    >
                                        {promptSuggestions.map((prompt, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setContent(prompt + " ")}
                                                className="text-xs px-3 py-1.5 bg-gray-50 hover:bg-purple-50 text-gray-600 hover:text-purple-700 rounded-full border border-gray-200 hover:border-purple-200 transition-all"
                                            >
                                                {prompt}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}

                                <div className="flex gap-3 pt-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => onOpenChange(false)}
                                        className="flex-1 h-12 rounded-xl border-gray-200 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={loading || !content.trim()}
                                        className="flex-1 h-12 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                                    >
                                        {loading ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <span className="flex items-center gap-2">
                                                <Sparkles className="h-4 w-4" />
                                                Save Entry
                                            </span>
                                        )}
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </DialogContent>
        </Dialog>
    )
}
