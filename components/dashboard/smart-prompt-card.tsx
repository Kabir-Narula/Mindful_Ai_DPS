'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Sparkles, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/card'

export default function SmartPromptCard() {
  const [prompt, setPrompt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPrompt = async () => {
      try {
        const res = await fetch('/api/prompts/smart')
        const data = await res.json()
        setPrompt(data.prompt)
      } catch (error) {
        console.error('Failed to fetch smart prompt:', error)
        setPrompt('How are you feeling today? What\'s on your mind?')
      } finally {
        setLoading(false)
      }
    }

    fetchPrompt()
  }, [])

  if (loading) {
    return (
      <Card className="border-2 border-gray-100 p-6">
        <div className="animate-pulse">
          <div className="h-4 w-24 bg-gray-200 rounded mb-3"></div>
          <div className="h-6 w-full bg-gray-200 rounded"></div>
        </div>
      </Card>
    )
  }

  return (
    <Link href="/dashboard/journal/new" className="block group">
      <Card className="border-2 border-gray-100 hover:border-purple-200 transition-all p-6 bg-gradient-to-br from-white to-purple-50/30">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <span className="text-xs font-bold uppercase tracking-widest text-purple-600">
                Daily Question
              </span>
            </div>
            <p className="text-lg font-serif text-gray-800 leading-relaxed group-hover:text-black transition-colors">
              {prompt}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-black group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
        </div>
      </Card>
    </Link>
  )
}
