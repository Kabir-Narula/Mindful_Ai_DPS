'use client'

import { useState, useEffect, useRef, useCallback, memo } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Send, Sparkles, User, Bot, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

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
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
    isError?: boolean
}

// ============================================================================
// MESSAGE BUBBLE
// ============================================================================

const MessageBubble = memo(function MessageBubble({
    message,
    index,
    prefersReducedMotion,
}: {
    message: Message
    index: number
    prefersReducedMotion: boolean | null
}) {
    const isUser = message.role === 'user'

    return (
        <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: index * 0.05, type: 'spring', damping: 20 }}
            className={cn(
                "flex gap-3 max-w-[90%]",
                isUser ? "ml-auto flex-row-reverse" : ""
            )}
        >
            {/* Avatar */}
            <motion.div
                className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-1 shadow-sm",
                    isUser
                        ? "bg-gray-100 ring-1 ring-gray-200"
                        : "bg-gradient-to-br from-purple-600 to-indigo-600 text-white"
                )}
                whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
            >
                {isUser
                    ? <User className="h-4 w-4 text-gray-600" />
                    : <Bot className="h-4 w-4" />
                }
            </motion.div>

            {/* Bubble */}
            <div
                className={cn(
                    "p-4 rounded-2xl text-[15px] leading-relaxed shadow-sm transition-shadow hover:shadow-md",
                    isUser
                        ? "bg-gray-900 text-white rounded-tr-sm"
                        : "bg-white border border-gray-100 text-gray-800 rounded-tl-sm",
                    message.isError && "border-red-200 bg-red-50 text-red-700"
                )}
            >
                <p className="whitespace-pre-wrap">{message.content}</p>

                {/* Timestamp on hover */}
                <motion.span
                    className={cn(
                        "text-[10px] mt-2 block opacity-0 group-hover:opacity-100 transition-opacity",
                        isUser ? "text-gray-400" : "text-gray-400"
                    )}
                >
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </motion.span>
            </div>
        </motion.div>
    )
})

// ============================================================================
// QUICK REPLIES
// ============================================================================

const QuickReplies = memo(function QuickReplies({
    onSelect,
    visible,
}: {
    onSelect: (reply: string) => void
    visible: boolean
}) {
    const prefersReducedMotion = useReducedMotion()
    const replies = [
        "I'm feeling anxious today",
        "Can we do a breathing exercise?",
        "Tell me something positive",
        "I need help with a thought",
    ]

    if (!visible) return null

    return (
        <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap gap-2 px-6 py-3 bg-gray-50/50"
        >
            {replies.map((reply, i) => (
                <motion.button
                    key={reply}
                    initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => onSelect(reply)}
                    className="px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-full hover:border-purple-300 hover:bg-purple-50 transition-all"
                >
                    {reply}
                </motion.button>
            ))}
        </motion.div>
    )
})

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function GlobalChatSheet({ open, onOpenChange, context }: GlobalChatSheetProps) {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [showQuickReplies, setShowQuickReplies] = useState(true)
    const scrollRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const { toast } = useToast()
    const prefersReducedMotion = useReducedMotion()

    // Generate unique message ID
    const generateId = () => Math.random().toString(36).substring(2, 10)

    // Get context-aware greeting
    const getContextGreeting = useCallback((ctx?: typeof context) => {
        if (!ctx) return "Hi there! How are you feeling right now?"

        switch (ctx.page) {
            case 'journal':
                if (ctx.entryId) return "I'm here with you as you review this entry. What thoughts are coming up?"
                return "Journaling is a wonderful way to untangle thoughts. What's on your mind?"
            case 'archive':
                return "Looking back can be powerful. What patterns are you noticing in your journey?"
            case 'insights':
                return "Data tells a story. How does seeing your trends make you feel?"
            case 'cbt':
                return "Ready to work through some thoughts together? I'm here to help."
            default:
                return "Hi there! I'm here to listen and think with you. How are you feeling?"
        }
    }, [])

    // Initialize with greeting
    useEffect(() => {
        if (open && messages.length === 0) {
            const greeting = getContextGreeting(context)
            setMessages([{
                id: generateId(),
                role: 'assistant',
                content: greeting,
                timestamp: new Date()
            }])
        }

        // Focus input when opened
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 100)
        }
    }, [open, context, getContextGreeting, messages.length])

    // Auto-scroll to bottom with smooth behavior
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: prefersReducedMotion ? 'auto' : 'smooth'
            })
        }
    }, [messages, loading, prefersReducedMotion])

    // Handle quick reply selection
    const handleQuickReply = useCallback((reply: string) => {
        setInput(reply)
        setShowQuickReplies(false)
        inputRef.current?.focus()
    }, [])

    // Reset chat
    const handleReset = useCallback(() => {
        const greeting = getContextGreeting(context)
        setMessages([{
            id: generateId(),
            role: 'assistant',
            content: greeting,
            timestamp: new Date()
        }])
        setShowQuickReplies(true)
    }, [context, getContextGreeting])

    const handleSend = async () => {
        if (!input.trim() || loading) return

        const userMessage = input.trim()
        setInput('')
        setShowQuickReplies(false)

        // Add user message
        setMessages(prev => [...prev, {
            id: generateId(),
            role: 'user',
            content: userMessage,
            timestamp: new Date()
        }])
        setLoading(true)

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage,
                    conversationHistory: messages.map(m => ({ role: m.role, content: m.content })),
                    context,
                }),
            })

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}))
                throw new Error(errorData.error || 'Failed to send message')
            }

            const data = await res.json()
            setMessages(prev => [...prev, {
                id: generateId(),
                role: 'assistant',
                content: data.response,
                timestamp: new Date()
            }])
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to send message'
            toast({
                title: 'Error',
                description: errorMessage,
                variant: 'destructive',
            })
            // Add error message to chat
            setMessages(prev => [...prev, {
                id: generateId(),
                role: 'assistant',
                content: "I'm having trouble connecting right now. Please try again in a moment.",
                timestamp: new Date(),
                isError: true
            }])
        } finally {
            setLoading(false)
        }
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:w-[540px] sm:max-w-[600px] p-0 border-l border-gray-200 bg-white shadow-2xl flex flex-col h-full">
                {/* Header */}
                <motion.div
                    className="p-6 border-b border-gray-100 bg-gradient-to-r from-white to-purple-50/30 backdrop-blur-md z-10"
                    initial={prefersReducedMotion ? {} : { opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <motion.div
                                className="h-10 w-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg"
                                whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
                            >
                                <Sparkles className="h-5 w-5" />
                            </motion.div>
                            <div>
                                <h2 className="font-serif font-bold text-xl text-gray-900">AI Companion</h2>
                                <p className="text-xs text-gray-500 font-medium tracking-wide uppercase">Always here listening</p>
                            </div>
                        </div>

                        {/* Reset button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleReset}
                            className="h-8 w-8 text-gray-400 hover:text-gray-600"
                            title="Start new conversation"
                        >
                            <RotateCcw className="h-4 w-4" />
                        </Button>
                    </div>
                </motion.div>

                {/* Quick Replies */}
                <QuickReplies
                    onSelect={handleQuickReply}
                    visible={showQuickReplies && messages.length <= 2}
                />

                {/* Messages Area */}
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-gray-50 to-white"
                >
                    <AnimatePresence mode="popLayout">
                        {messages.map((msg, idx) => (
                            <MessageBubble
                                key={msg.id}
                                message={msg}
                                index={idx}
                                prefersReducedMotion={prefersReducedMotion}
                            />
                        ))}

                        {loading && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="flex gap-4 max-w-[90%]"
                            >
                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-md">
                                    <Bot className="h-4 w-4" />
                                </div>
                                <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-md flex items-center gap-2">
                                    {prefersReducedMotion ? (
                                        <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
                                    ) : (
                                        <div className="flex gap-1">
                                            {[0, 1, 2].map(i => (
                                                <motion.div
                                                    key={i}
                                                    className="w-2 h-2 bg-purple-400 rounded-full"
                                                    animate={{ y: -6 }}
                                                    transition={{
                                                        duration: 0.3,
                                                        delay: i * 0.1,
                                                        repeat: Infinity,
                                                        repeatType: 'reverse',
                                                        ease: 'easeInOut',
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    )}
                                    <span className="text-sm text-gray-400 italic ml-1">Thinking...</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
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

export default memo(GlobalChatSheet)
