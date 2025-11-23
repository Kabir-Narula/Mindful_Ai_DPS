'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Send } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GlobalChatSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    context?: {
        page: string
        entryId?: string
        goalId?: string
    }
}

interface Message {
    role: 'user' | 'assistant'
    content: string
}

export default function GlobalChatSheet({ open, onOpenChange, context }: GlobalChatSheetProps) {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const { toast } = useToast()

    // Initialize with context-aware greeting
    useEffect(() => {
        if (open && messages.length === 0) {
            const greeting = getContextGreeting(context)
            setMessages([{ role: 'assistant', content: greeting }])
        }
    }, [open, context])

    const getContextGreeting = (ctx?: typeof context) => {
        if (!ctx) return "Hi! I'm your AI coach. How can I help you today?"

        switch (ctx.page) {
            case 'journal':
                if (ctx.entryId) return "I see you're viewing a journal entry. Want to explore your thoughts deeper?"
                return "Ready to reflect on your day? I can help you process your feelings."
            case 'goals':
                if (ctx.goalId) return "Working on a goal? Let's break it down into manageable steps."
                return "Let's talk about your aspirations. What would you like to achieve?"
            case 'dashboard':
                return "How are you feeling about your progress today?"
            default:
                return "Hi! I'm your AI coach. How can I help you today?"
        }
    }

    const handleSend = async () => {
        if (!input.trim() || loading) return

        const userMessage = input.trim()
        setInput('')
        setMessages(prev => [...prev, { role: 'user', content: userMessage }])
        setLoading(true)

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage,
                    conversationHistory: messages,
                    context,
                }),
            })

            if (!res.ok) throw new Error('Failed to send message')

            const data = await res.json()
            setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to send message',
                variant: 'destructive',
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:w-[540px] sm:max-w-[540px] p-0 bg-[#F9F8F5]">
                <div className="flex flex-col h-full">
                    {/* Header - SheetClose button is built into SheetContent */}
                    <SheetHeader className="border-b border-gray-200 p-6 pb-4">
                        <SheetTitle className="text-2xl font-serif">AI Coach</SheetTitle>
                        {context && (
                            <p className="text-xs uppercase tracking-widest text-gray-400 mt-2">
                                Context: {context.page}
                            </p>
                        )}
                    </SheetHeader>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={cn(
                                    "space-y-2",
                                    msg.role === 'user' ? "text-right" : "text-left"
                                )}
                            >
                                <div className="text-xs uppercase tracking-widest text-gray-400">
                                    {msg.role === 'user' ? 'You' : 'AI Coach'}
                                </div>
                                <div
                                    className={cn(
                                        "inline-block max-w-[80%] p-4",
                                        msg.role === 'user'
                                            ? "bg-black text-white"
                                            : "bg-white border border-gray-200"
                                    )}
                                >
                                    <p className="text-base leading-relaxed font-serif">
                                        {msg.content}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex items-center gap-2 text-gray-400">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="text-sm italic">Thinking...</span>
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    <div className="border-t border-gray-200 p-6">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault()
                                handleSend()
                            }}
                            className="flex gap-2"
                        >
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Share your thoughts..."
                                disabled={loading}
                                className="flex-1 bg-white border-gray-200"
                            />
                            <Button
                                type="submit"
                                disabled={loading || !input.trim()}
                                size="icon"
                                className="bg-black text-white hover:bg-gray-800"
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </form>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
