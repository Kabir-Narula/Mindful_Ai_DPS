'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Card } from '@/components/ui/card'
import { getMoodEmoji } from '@/lib/utils'
import { FeedEntry } from '@/lib/types'
import { ChevronDown, ChevronUp, Sparkles, Lightbulb, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DailyFeedProps {
  entries: FeedEntry[]
}

export default function DailyFeed({ entries }: DailyFeedProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12 border-l-2 border-dashed border-gray-200 ml-4 pl-8">
        <p className="text-gray-400 italic font-serif">The page is blank. Write your story.</p>
      </div>
    )
  }

  return (
    <div className="relative space-y-12 ml-4 pl-8 border-l border-gray-200 py-4">
      {entries.map((entry) => (
        <FeedItem key={entry.id} entry={entry} />
      ))}
    </div>
  )
}

function FeedItem({ entry }: { entry: FeedEntry }) {
    const [expanded, setExpanded] = useState(false)
    const isLongContent = entry.content && entry.content.length > 280

    const getLabel = (type: FeedEntry['type']) => {
        switch(type) {
            case 'mood': return 'Pulse Check'
            case 'journal': return 'Journal Entry'
            case 'pattern': return 'AI Insight'
            case 'reflection': return 'Weekly Review'
            default: return 'Entry'
        }
    }

    return (
        <div className="relative group">
            {/* Timeline Dot */}
            <div className={`absolute -left-[39px] top-6 h-3 w-3 bg-white border-2 rounded-full transition-all duration-300 
                ${entry.type === 'pattern' ? 'border-amber-400 scale-125' : 'border-gray-300 group-hover:border-black group-hover:scale-125'}
            `} />

            <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400">
                    <span>{format(new Date(entry.createdAt), 'h:mm a')}</span>
                    <span className="w-px h-3 bg-gray-300" />
                    <span className={entry.type === 'pattern' ? 'text-amber-600' : ''}>{getLabel(entry.type)}</span>
                </div>

                {/* Card Content Based on Type */}
                <Card className={`p-6 md:p-8 transition-all duration-500 ${
                    entry.type === 'mood' 
                    ? 'bg-gray-50/50 border-transparent shadow-none' 
                    : entry.type === 'pattern'
                    ? 'bg-amber-50/30 border-amber-200/50 shadow-sm'
                    : entry.type === 'reflection'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xl'
                    : 'bg-white border-gray-100 shadow-sm hover:shadow-md'
                }`}>
                    
                    {/* 1. MOOD ENTRY */}
                    {entry.type === 'mood' && (
                        <div className="flex items-center gap-6">
                            <div className="text-4xl filter grayscale hover:grayscale-0 transition-all duration-500 cursor-default">
                                {getMoodEmoji(entry.moodScore || 5)}
                            </div>
                            <div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-serif font-bold text-gray-900">{entry.moodScore}</span>
                                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">/ 10 Mood</span>
                                </div>
                                {entry.note && (
                                    <p className="text-sm text-gray-600 mt-1 font-serif italic">"{entry.note}"</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 2. JOURNAL ENTRY */}
                    {entry.type === 'journal' && (
                        <article>
                            {entry.title && (
                                <h3 className="text-2xl font-serif font-bold text-gray-900 mb-4 leading-tight">
                                    {entry.title}
                                </h3>
                            )}
                            
                            <div className={`relative ${!expanded && isLongContent ? 'max-h-[140px] overflow-hidden' : ''}`}>
                                <p className="text-gray-700 text-lg leading-relaxed font-serif whitespace-pre-wrap opacity-90">
                                    {entry.content}
                                </p>
                                {!expanded && isLongContent && (
                                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
                                )}
                            </div>

                            {isLongContent && (
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => setExpanded(!expanded)}
                                    className="mt-4 text-xs font-bold tracking-widest uppercase text-gray-400 hover:text-black h-auto p-0 hover:bg-transparent"
                                >
                                    {expanded ? (
                                        <span className="flex items-center gap-2">Collapse <ChevronUp className="h-3 w-3" /></span>
                                    ) : (
                                        <span className="flex items-center gap-2">Continue Reading <ChevronDown className="h-3 w-3" /></span>
                                    )}
                                </Button>
                            )}

                            {entry.sentimentLabel && (
                                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center gap-2">
                                    <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                                        AI Analysis: {entry.sentimentLabel}
                                    </span>
                                </div>
                            )}
                        </article>
                    )}

                    {/* 3. PATTERN ENTRY (New) */}
                    {entry.type === 'pattern' && (
                        <div className="relative">
                            <div className="absolute -top-2 -right-2 opacity-10">
                                <Sparkles className="h-24 w-24 text-amber-500" />
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-amber-100 rounded-full shrink-0">
                                    <Lightbulb className="h-5 w-5 text-amber-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-serif font-bold text-gray-900 mb-2">
                                        {entry.title}
                                    </h3>
                                    <p className="text-gray-700 leading-relaxed mb-4">
                                        {entry.content}
                                    </p>
                                    {entry.insight && (
                                        <div className="bg-white/60 p-4 rounded-lg border border-amber-100">
                                            <p className="text-sm text-amber-800 italic font-medium">
                                                "{entry.insight}"
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 4. WEEKLY REFLECTION ENTRY (New) */}
                    {entry.type === 'reflection' && (
                        <div className="relative">
                             <div className="absolute -top-4 -right-4 opacity-10">
                                <Moon className="h-32 w-32 text-indigo-500" />
                            </div>
                            <h3 className="text-2xl font-serif font-bold text-white mb-2">
                                Weekly Synthesis
                            </h3>
                            <p className="text-slate-300 mb-6">
                                {entry.content}
                            </p>
                            
                            {entry.stats && (
                                <div className="grid grid-cols-3 gap-4 border-t border-slate-700 pt-6">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Avg Mood</p>
                                        <p className="text-2xl font-mono text-white">{entry.stats.avgMood.toFixed(1)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Entries</p>
                                        <p className="text-2xl font-mono text-white">{entry.stats.totalEntries}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Trend</p>
                                        <p className="text-2xl font-mono text-emerald-400">{entry.stats.trend}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                </Card>
            </div>
        </div>
    )
}
