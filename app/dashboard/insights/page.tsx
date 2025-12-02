import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Brain, TrendingUp, Lightbulb, ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import TriggerInsightsButton from '@/components/dashboard/trigger-insights-button'
import { Badge } from '@/components/ui/badge'
import { formatUTCDate, formatInToronto } from '@/lib/timezone'

export default async function InsightsPage() {
    const user = await getCurrentUser()
    if (!user) redirect('/login')

    const [reflections, cbtExercises, patterns] = await Promise.all([
        prisma.weeklyReflection.findMany({
            where: { userId: user.userId },
            orderBy: { weekOf: 'desc' },
            take: 5
        }),
        prisma.therapyExercise.findMany({
            where: { userId: user.userId, type: 'thought-challenging' },
            orderBy: { createdAt: 'desc' },
            take: 5
        }),
        prisma.pattern.findMany({
            where: { userId: user.userId, isActive: true },
            orderBy: { confidence: 'desc' },
            take: 5
        })
    ])

    return (
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-12 space-y-24">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-8 border-b border-gray-900 pb-8">
                <div className="space-y-4 max-w-2xl">
                    <span className="text-xs font-bold tracking-[0.3em] uppercase text-gray-400">Analytics</span>
                    <h1 className="text-6xl md:text-8xl font-serif font-bold text-gray-900 leading-[0.9]">
                        The Report.
                    </h1>
                    <p className="text-xl font-serif italic text-gray-500 max-w-lg">
                        "Self-awareness is not a destination, but a practice of returning to oneself."
                    </p>
                </div>
                <TriggerInsightsButton />
            </div>

            {/* Section 1: Behavioral Patterns (The "Feature Story") */}
            <section>
                <div className="flex items-center gap-4 mb-12">
                    <div className="h-px flex-1 bg-gray-200"></div>
                    <span className="text-xs font-bold tracking-[0.2em] uppercase text-gray-400">Detected Patterns</span>
                    <div className="h-px flex-1 bg-gray-200"></div>
                </div>

                {patterns.length === 0 ? (
                    <div className="text-center py-16 border border-dashed border-gray-300 rounded-lg bg-gray-50/50">
                        <span className="text-4xl mb-4 block">✨</span>
                        <p className="text-gray-500 text-lg mb-2">No patterns yet</p>
                        <p className="text-gray-400 text-sm max-w-md mx-auto">
                            Keep journaling for a few more days - I'm looking for things that could genuinely help you!
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {patterns.map((p, i) => {
                            return (
                                <Card key={p.id} className={`p-6 border ${i === 0 ? 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200' : 'bg-white border-gray-100'} hover:shadow-lg transition-all duration-300`}>
                                    {/* Pattern header */}
                                    <div className="flex justify-between items-start mb-4">
                                        <Badge variant="outline" className="bg-white/80 border-gray-200 text-gray-600 capitalize text-xs">
                                            {p.type.replace('_', ' ')}
                                        </Badge>
                                        <span className="text-xs text-gray-400 font-medium">
                                            {Math.round(p.confidence * 100)}% confidence
                                        </span>
                                    </div>

                                    {/* Pattern description - this is now the main friendly message */}
                                    <p className="text-gray-800 text-lg leading-relaxed mb-4">
                                        {p.description}
                                    </p>

                                    {/* Insight - why it matters */}
                                    {p.insights && (
                                        <div className="p-4 rounded-lg bg-amber-50/80 border border-amber-100 mb-4">
                                            <div className="flex items-start gap-3">
                                                <Lightbulb className="h-4 w-4 mt-0.5 text-amber-600 shrink-0" />
                                                <p className="text-sm text-amber-800">
                                                    {typeof p.insights === 'string' ? p.insights :
                                                        Array.isArray(p.insights) ? p.insights[0] :
                                                            'This pattern could help you understand yourself better.'}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Suggestion - what to try */}
                                    {p.suggestions && (
                                        <div className="p-4 rounded-lg bg-green-50/80 border border-green-100">
                                            <p className="text-sm font-medium text-green-800 mb-1">💡 Try this:</p>
                                            <p className="text-sm text-green-700">
                                                {typeof p.suggestions === 'string' ? p.suggestions :
                                                    Array.isArray(p.suggestions) ? p.suggestions[0] :
                                                        'Pay attention to this pattern this week.'}
                                            </p>
                                        </div>
                                    )}
                                </Card>
                            )
                        })}
                    </div>
                )}
            </section>

            {/* Section 2: Reflections & Growth (Editorial Layout) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Left Column: Weekly Reflections */}
                <div className="lg:col-span-7 space-y-12">
                    <div className="border-b border-gray-900 pb-4 mb-8">
                        <h2 className="text-3xl font-serif font-bold text-gray-900">Weekly Synthesis</h2>
                    </div>

                    {reflections.length === 0 ? (
                        <p className="text-gray-400 italic">No weekly reviews yet.</p>
                    ) : (
                        <div className="space-y-12">
                            {reflections.map(r => (
                                <article key={r.id} className="group">
                                    <div className="flex items-baseline justify-between mb-4">
                                        <time className="text-xs font-bold tracking-widest uppercase text-gray-400">
                                            Week of {formatUTCDate(r.weekOf, 'MMMM d, yyyy')}
                                        </time>
                                        {r.moodTrend === 'improving' && (
                                            <span className="flex items-center text-xs text-emerald-600 font-bold uppercase tracking-wider gap-1">
                                                <TrendingUp className="h-3 w-3" /> Improving Trend
                                            </span>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div>
                                            <h4 className="font-serif font-bold text-xl mb-2 text-gray-900">High Point</h4>
                                            <p className="text-gray-600 leading-relaxed text-sm">{r.bestMoment}</p>
                                        </div>
                                        <div>
                                            <h4 className="font-serif font-bold text-xl mb-2 text-gray-400">Challenge</h4>
                                            <p className="text-gray-500 leading-relaxed text-sm">{r.hardestMoment}</p>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Column: Cognitive Shifts (CBT) */}
                <div className="lg:col-span-5">
                    <div className="bg-gray-50 p-8 border-l-2 border-gray-900 h-full">
                        <div className="flex items-center gap-3 mb-8">
                            <Brain className="h-6 w-6 text-gray-900" />
                            <h2 className="text-xl font-serif font-bold text-gray-900">Cognitive Shifts</h2>
                        </div>

                        {cbtExercises.length === 0 ? (
                            <p className="text-gray-400 text-sm italic">No exercises recorded.</p>
                        ) : (
                            <div className="space-y-8">
                                {cbtExercises.map(ex => (
                                    <div key={ex.id} className="relative pl-6 border-l border-gray-200">
                                        <div className="absolute -left-[5px] top-2 h-2.5 w-2.5 rounded-full bg-gray-300"></div>
                                        <p className="text-xs text-gray-400 mb-2">{formatInToronto(ex.createdAt, 'MMM d')}</p>
                                        <p className="text-sm text-gray-500 line-through decoration-gray-300 italic mb-2">
                                            "{ex.originalThought}"
                                        </p>
                                        <div className="flex items-start gap-2">
                                            <ArrowRight className="h-3 w-3 text-gray-900 mt-1 shrink-0" />
                                            <p className="text-sm font-medium text-gray-900">
                                                "{ex.reframedThought}"
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
