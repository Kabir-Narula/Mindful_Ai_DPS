'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useToast } from '@/components/ui/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Loader2,
  Send,
  Brain,
  MessageSquare,
  BookOpen,
  Sparkles,
  X,
  Trash2,
  Plus,
  Menu,
} from 'lucide-react'
import { format } from 'date-fns'
import { getMoodEmoji } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: Date | string
}

interface ChatSession {
  id: string
  title: string | null
  journalEntryId: string | null
  createdAt: Date | string
  updatedAt: Date | string
  journalEntry?: {
    id: string
    title: string
  } | null
  _count?: {
    messages: number
  }
}

interface JournalEntry {
  id: string
  title: string
  content: string
  moodRating: number
  sentimentLabel: string | null
  feedback: string | null
  createdAt: Date
}

interface ChatPageContentProps {
  recentEntries: JournalEntry[]
}

export default function ChatPageContent({ recentEntries }: ChatPageContentProps) {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null)
  const [showSidebar, setShowSidebar] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<'all' | string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Fetch sessions on mount
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await fetch('/api/chat/sessions')
        if (res.ok) {
          const data = await res.json()
          setSessions(data)
          // Load most recent session if available
          if (data.length > 0 && !currentSessionId) {
            loadSession(data[0].id)
          }
        }
      } catch (error) {
        console.error('Failed to fetch sessions:', error)
      } finally {
        setFetching(false)
      }
    }
    fetchSessions()
  }, [])

  // Load messages for a session
  const loadSession = async (sessionId: string) => {
    try {
      setFetching(true)
      const res = await fetch(`/api/chat/sessions/${sessionId}`)
      if (res.ok) {
        const data = await res.json()
        setCurrentSessionId(sessionId)
        setMessages(data.messages || [])
        if (data.journalEntry) {
          // Find the full entry from recentEntries
          const entry = recentEntries.find(e => e.id === data.journalEntry.id)
          if (entry) setSelectedEntry(entry)
        } else {
          setSelectedEntry(null)
        }
      }
    } catch (error) {
      console.error('Failed to load session:', error)
      toast({
        title: 'Error',
        description: 'Failed to load chat session',
        variant: 'destructive',
      })
    } finally {
      setFetching(false)
    }
  }

  // Create new chat session
  const handleNewChat = async (journalEntry?: JournalEntry) => {
    try {
      const res = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          journalEntryId: journalEntry?.id || null,
        }),
      })

      if (res.ok) {
        const newSession = await res.json()
        setSessions(prev => [newSession, ...prev])
        setCurrentSessionId(newSession.id)
        setMessages([])
        setInput('')
        setSelectedEntry(journalEntry || null)
        if (journalEntry) {
          // Auto-start conversation about the entry
          const prompt = `I'd like to discuss my journal entry "${journalEntry.title}". ${journalEntry.feedback ? `The AI feedback was: "${journalEntry.feedback}"` : ''} Can you help me reflect on this?`
          setInput(prompt)
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create new chat',
        variant: 'destructive',
      })
    }
  }

  // Delete session or all sessions
  const handleDelete = async () => {
    if (!deleteTarget) return

    setDeleting(true)
    try {
      if (deleteTarget === 'all') {
        const res = await fetch('/api/chat/sessions', {
          method: 'DELETE',
        })
        if (res.ok) {
          setSessions([])
          setCurrentSessionId(null)
          setMessages([])
          setSelectedEntry(null)
          toast({
            title: 'Success',
            description: 'All chat history has been deleted',
          })
        }
      } else {
        const res = await fetch(`/api/chat/sessions/${deleteTarget}`, {
          method: 'DELETE',
        })
        if (res.ok) {
          setSessions(prev => prev.filter(s => s.id !== deleteTarget))
          if (currentSessionId === deleteTarget) {
            setCurrentSessionId(null)
            setMessages([])
            setSelectedEntry(null)
          }
          toast({
            title: 'Success',
            description: 'Chat session deleted',
          })
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete chat',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
      setShowDeleteDialog(false)
      setDeleteTarget(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedInput = input.trim()

    if (!trimmedInput || loading) return

    if (trimmedInput.length > 2000) {
      toast({
        title: 'Message too long',
        description: 'Please keep messages under 2000 characters',
        variant: 'destructive',
      })
      return
    }

    const userMessage = trimmedInput
    setInput('')
    setLoading(true)

    // Optimistically add user message
    const tempUserMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      createdAt: new Date(),
    }
    setMessages(prev => [...prev, tempUserMsg])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          sessionId: currentSessionId,
          journalEntryId: selectedEntry?.id,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to get response')
      }

      // Update current session ID if this is a new session
      if (data.sessionId && data.sessionId !== currentSessionId) {
        setCurrentSessionId(data.sessionId)
        // Refresh sessions list
        const sessionsRes = await fetch('/api/chat/sessions')
        if (sessionsRes.ok) {
          setSessions(await sessionsRes.json())
        }
      }

      setMessages(prev => [...prev, {
        id: data.id || Date.now().toString(),
        role: 'assistant',
        content: data.content,
        createdAt: new Date(data.createdAt || Date.now()),
      }])
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to send message. Please try again.'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== tempUserMsg.id))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (fetching && !currentSessionId) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Left Sidebar - Sessions & Journal Entries */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-80 flex-shrink-0 flex flex-col gap-4"
          >
            {/* Chat Sessions */}
            <Card className="flex-1 border-none shadow-xl bg-white/70 backdrop-blur-xl flex flex-col overflow-hidden">
              <CardContent className="p-4 flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-purple-600" />
                    Conversations
                  </h2>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleNewChat()}
                      className="h-8 w-8 p-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    {sessions.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDeleteTarget('all')
                          setShowDeleteDialog(true)
                        }}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                  {sessions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No conversations yet</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleNewChat()}
                        className="mt-4"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Start New Chat
                      </Button>
                    </div>
                  ) : (
                    sessions.map((session) => (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`group relative p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          currentSessionId === session.id
                            ? 'border-purple-500 bg-purple-50 shadow-md'
                            : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-sm'
                        }`}
                        onClick={() => loadSession(session.id)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">
                              {session.journalEntry
                                ? `📝 ${session.journalEntry.title}`
                                : session.title || 'New Conversation'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {format(new Date(session.updatedAt), 'MMM dd, yyyy')}
                            </p>
                            {session._count && (
                              <p className="text-xs text-gray-400 mt-1">
                                {session._count.messages} messages
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleteTarget(session.id)
                              setShowDeleteDialog(true)
                            }}
                            className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 text-red-600 hover:text-red-700 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Journal Entries */}
            <Card className="border-none shadow-xl bg-white/70 backdrop-blur-xl flex flex-col overflow-hidden max-h-64">
              <CardContent className="p-4 flex flex-col h-full">
                <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                  <BookOpen className="h-5 w-5 text-purple-600" />
                  Recent Entries
                </h2>
                <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                  {recentEntries.length === 0 ? (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      No journal entries yet
                    </div>
                  ) : (
                    recentEntries.slice(0, 3).map((entry) => (
                      <motion.div
                        key={entry.id}
                        whileHover={{ scale: 1.02 }}
                        className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedEntry?.id === entry.id
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 bg-white hover:border-purple-300'
                        }`}
                        onClick={() => handleNewChat(entry)}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h3 className="font-semibold text-xs line-clamp-1 flex-1">
                            {entry.title}
                          </h3>
                          <span className="text-xl flex-shrink-0">
                            {getMoodEmoji(entry.moodRating)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-1">
                          {format(new Date(entry.createdAt), 'MMM dd, yyyy')}
                        </p>
                      </motion.div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                AI Chat Companion
              </h1>
              <p className="text-gray-600 mt-1 text-sm">
                Talk about your feelings in a safe, judgment-free space
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSidebar(!showSidebar)}
                className="md:hidden"
              >
                <Menu className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleNewChat()}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Chat
              </Button>
            </div>
          </div>

          {selectedEntry && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <BookOpen className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-semibold text-purple-900">
                      Discussing: {selectedEntry.title}
                    </span>
                  </div>
                  <p className="text-xs text-purple-700 line-clamp-1">
                    {selectedEntry.content}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedEntry(null)}
                  className="flex-shrink-0 h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Chat Container */}
        <Card className="flex-1 flex flex-col border-none shadow-xl bg-white/70 backdrop-blur-xl overflow-hidden">
          <CardContent className="flex-1 flex flex-col p-6 min-h-0">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2 custom-scrollbar">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    className="mb-6"
                  >
                    <div className="inline-flex p-6 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 shadow-xl">
                      <Brain className="h-12 w-12 text-white" />
                    </div>
                  </motion.div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Welcome! How are you feeling today?
                  </h3>
                  <p className="text-sm text-gray-600 max-w-md mb-6">
                    I'm here to listen without judgment. Share your thoughts, feelings, or discuss any of your journal entries.
                  </p>
                  {recentEntries.length > 0 && (
                    <p className="text-sm text-gray-500">
                      Select a journal entry from the sidebar to discuss it with me.
                    </p>
                  )}
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`flex gap-3 max-w-[80%] ${
                          message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                        }`}
                      >
                        <Avatar className="h-9 w-9 flex-shrink-0">
                          <AvatarFallback
                            className={
                              message.role === 'user'
                                ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white font-semibold text-sm'
                                : 'bg-gradient-to-br from-gray-100 to-gray-200'
                            }
                          >
                            {message.role === 'user' ? (
                              'U'
                            ) : (
                              <Brain className="h-5 w-5 text-purple-600" />
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={`rounded-2xl px-4 py-3 shadow-sm ${
                            message.role === 'user'
                              ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">
                            {message.content}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="flex gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-gray-100">
                            <Brain className="h-5 w-5 text-purple-600" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="bg-gray-100 rounded-2xl px-4 py-3">
                          <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="space-y-2">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Textarea
                    value={input}
                    onChange={(e) => {
                      if (e.target.value.length <= 2000) {
                        setInput(e.target.value)
                      }
                    }}
                    placeholder={
                      selectedEntry
                        ? `Discuss "${selectedEntry.title}"...`
                        : 'Type your message...'
                    }
                    disabled={loading}
                    rows={2}
                    className={`resize-none border-2 pr-12 ${
                      input.length > 2000
                        ? 'border-red-500 focus:border-red-500'
                        : 'focus:border-purple-500'
                    }`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSubmit(e)
                      }
                    }}
                  />
                  <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                    {input.length}/2000
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={loading || !input.trim() || input.length > 2000}
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg h-auto px-6"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>
              {input.length > 1800 && (
                <p className="text-xs text-amber-600">
                  {2000 - input.length} characters remaining
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {deleteTarget === 'all' ? 'Delete All Chat History?' : 'Delete Chat Session?'}
            </DialogTitle>
            <DialogDescription>
              {deleteTarget === 'all'
                ? 'This will permanently delete all your chat conversations. This action cannot be undone.'
                : 'This will permanently delete this chat session and all its messages. This action cannot be undone.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false)
                setDeleteTarget(null)
              }}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
