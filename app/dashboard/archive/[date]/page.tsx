import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { format, parseISO, startOfDay, endOfDay, subHours, addHours } from 'date-fns'
import { FeedEntry } from '@/lib/types'
import DailyFeed from '@/components/stream/daily-feed'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar } from 'lucide-react'
import Link from 'next/link'

interface ArchiveDayPageProps {
    params: {
        date: string
    }
}

export default async function ArchiveDayPage({ params }: ArchiveDayPageProps) {
    const user = await getCurrentUser()
    if (!user) redirect('/login')

    let displayDate = parseISO(params.date)
    
    // FIX: Widen the search window to account for Timezone Offsets.
    const start = subHours(startOfDay(displayDate), 14) 
    const end = addHours(endOfDay(displayDate), 14)

    // Fetch Data for that specific day (Broad Query)
    const [dayLogRaw, moodEntries, journalEntries] = await Promise.all([
        prisma.dayLog.findUnique({
            where: {
                userId_date: {
                    userId: user.userId,
                    date: startOfDay(displayDate) // DayLog is strictly keyed to UTC date for now
                }
            }
        }),
        prisma.moodEntry.findMany({
            where: {
                userId: user.userId,
                createdAt: { gte: start, lte: end }
            },
            orderBy: { createdAt: 'desc' }
        }),
        prisma.journalEntry.findMany({
            where: {
                userId: user.userId,
                createdAt: { gte: start, lte: end }
            },
            orderBy: { createdAt: 'desc' }
        })
    ])

    // Merge Feed
    const feedEntries: FeedEntry[] = [
        ...moodEntries.map(m => ({
            id: m.id,
            type: 'mood' as const,
            createdAt: m.createdAt,
            moodScore: m.moodScore,
            note: m.note,
            triggers: m.triggers
        })),
        ...journalEntries.map(j => ({
            id: j.id,
            type: 'journal' as const,
            createdAt: j.createdAt,
            title: j.title,
            content: j.content,
            moodScore: j.moodRating,
            sentimentLabel: j.sentimentLabel
        }))
    ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) // Chronological (Morning -> Evening)

    // SMART HEADER FIX:
    // If the URL date is "Nov 24" (UTC) but the entries are actually from "Nov 25" (User Time),
    // update the header to match the entries so the user sees "Nov 25".
    if (feedEntries.length > 0) {
        // Take the date of the first entry (earliest)
        const firstEntryDate = new Date(feedEntries[0].createdAt)
        
        // If the day differs from the URL param, perform a sanity check
        // (e.g. only override if the URL date is clearly "yesterday" relative to content)
        // For simplicity in this MVP, if content exists, TRUST THE CONTENT's date.
        
        // However, we need to be careful not to jump days wildly. 
        // Let's just use the first entry's date as the "True Date" for display.
        displayDate = firstEntryDate
    }

    // Map dayLog to ensure type safety
    const dayLog = dayLogRaw ? {
        id: dayLogRaw.id,
        morningIntention: dayLogRaw.morningIntention,
        dailyInsight: dayLogRaw.dailyInsight,
        suggestedAction: dayLogRaw.suggestedAction,
        eveningReflection: (dayLogRaw as any).eveningReflection ?? null
    } : null

    return (
        <div className="max-w-3xl mx-auto px-4 py-12">
            <div className="mb-12">
                <Link href="/dashboard/archive">
                    <Button variant="ghost" className="gap-2 text-gray-500 mb-6 pl-0 hover:text-black hover:bg-transparent">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Archive
                    </Button>
                </Link>
                
                <div className="text-center space-y-4">
                    <p className="text-xs font-bold tracking-[0.3em] uppercase text-gray-400">
                        Issue No. {format(displayDate, 'd')}
                    </p>
                    <h1 className="text-5xl md:text-7xl font-serif font-bold text-gray-900">
                        {format(displayDate, 'MMMM d')}
                    </h1>
                    <p className="text-xl font-serif italic text-gray-500">
                        {format(displayDate, 'EEEE, yyyy')}
                    </p>
                </div>
            </div>

            {/* Day Summary / Intention */}
            {dayLog && (dayLog.morningIntention || dayLog.eveningReflection) && (
                <div className="bg-gray-50 p-8 md:p-12 rounded-none border-y-2 border-gray-900 mb-16 text-center">
                    {dayLog.morningIntention && (
                        <div className="mb-8 last:mb-0">
                            <p className="text-xs font-bold tracking-widest uppercase text-gray-400 mb-3">Morning Focus</p>
                            <p className="text-2xl font-serif font-medium text-gray-900">"{dayLog.morningIntention}"</p>
                        </div>
                    )}
                    {dayLog.eveningReflection && (
                        <div className="pt-8 border-t border-gray-200">
                            <p className="text-xs font-bold tracking-widest uppercase text-gray-400 mb-3">Evening Synthesis</p>
                            <p className="text-lg text-gray-600 italic leading-relaxed">{dayLog.eveningReflection}</p>
                        </div>
                    )}
                </div>
            )}

            <DailyFeed entries={feedEntries} />
        </div>
    )
}