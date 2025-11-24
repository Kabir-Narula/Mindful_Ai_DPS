'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Send, Sparkles, User, Bot } from 'lucide-react'
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
    const scrollRef = useRef<HTMLDivElement>(null)
    const { toast } = useToast()

    // Initialize with context-aware greeting
    useEffect(() => {
        if (open && messages.length === 0) {
            const greeting = getContextGreeting(context)
            setMessages([{ role: 'assistant', content: greeting }])
        }
    }, [open, context])

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    const getContextGreeting = (ctx?: typeof context) => {
        // Even with specific context, we keep the greeting warm and general unless specifically prompted
        if (!ctx) return "Hi there. How are you feeling right now?"

        switch (ctx.page) {
            case 'journal':
                if (ctx.entryId) return "I'm reading this entry with you. What thoughts are coming up as you review it?"
                return "Journaling is a great way to untangle thoughts. What's on your mind?"
            case 'archive':
                return "Looking back can be powerful. What patterns are you noticing?"
            case 'insights':
                return "Data tells a story. How does seeing your trends make you feel?"
            default:
                return "Hi there. I'm here to listen and think with you. How are you feeling?"
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
                    context, // We pass context for specific item lookups, but UI doesn't show it
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
            <SheetContent className="w-full sm:w-[540px] sm:max-w-[600px] p-0 border-l border-gray-200 bg-white shadow-2xl flex flex-col h-full">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 bg-white/80 backdrop-blur-md z-10">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-black rounded-full flex items-center justify-center text-white">
                            <Sparkles className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="font-serif font-bold text-xl text-gray-900">AI Companion</h2>
                            <p className="text-xs text-gray-500 font-medium tracking-wide uppercase">Always here listening</p>
                        </div>
                    </div>
                </div>

                {/* Messages Area */}
                <div 
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-6 space-y-8 bg-[#FAFAFA]"
                >
                    {messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={cn(
                                "flex gap-4 max-w-[90%]",
                                msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                            )}
                        >
                            {/* Avatar */}
                            <div className={cn(
                                "h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-1",
                                msg.role === 'user' ? "bg-gray-200" : "bg-black text-white"
                            )}>
                                {msg.role === 'user' ? <User className="h-4 w-4 text-gray-600" /> : <Bot className="h-4 w-4" />}
                            </div>

                            {/* Bubble */}
                            <div
                                className={cn(
                                    "p-5 rounded-2xl text-base leading-relaxed font-serif shadow-sm",
                                    msg.role === 'user'
                                        ? "bg-white border border-gray-200 text-gray-900 rounded-tr-none"
                                        : "bg-white border-none shadow-md text-gray-800 rounded-tl-none"
                                )}
                            >
                                {msg.content}
                            </div>
                        </div>
                    ))}
                    
                    {loading && (
                        <div className="flex gap-4 max-w-[90%]">
                             <div className="h-8 w-8 rounded-full bg-black text-white flex items-center justify-center shrink-0 mt-1">
                                <Bot className="h-4 w-4" />
                            </div>
                            <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-md flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                                <span className="text-sm text-gray-400 italic">Thinking...</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-6 bg-white border-t border-gray-100">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault()
                            handleSend()
                        }}
                        className="relative flex items-center gap-2"
                    >
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type a message..."
                            disabled={loading}
                            className="pr-12 py-6 bg-gray-50 border-gray-200 focus:bg-white transition-all rounded-full text-base"
                        />
                        <Button
                            type="submit"
                            disabled={loading || !input.trim()}
                            size="icon"
                            className="absolute right-2 h-8 w-8 rounded-full bg-black hover:bg-gray-800 text-white transition-all"
                        >
                            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                        </Button>
                    </form>
                    <p className="text-[10px] text-center text-gray-300 mt-3 uppercase tracking-widest">
                        Private & Secure Space
                    </p>
                </div>
            </SheetContent>
        </Sheet>
    )
}
