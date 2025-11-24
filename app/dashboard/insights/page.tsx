import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'
import { Brain, Calendar, TrendingUp, Award, Lightbulb, ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import TriggerInsightsButton from '@/components/dashboard/trigger-insights-button'
import { Badge } from '@/components/ui/badge'

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
                     <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg">
                        <Award className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-400 italic">Journal more to reveal your hidden patterns.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {patterns.map((p, i) => (
                            <Card key={p.id} className={`p-8 border-2 ${i === 0 ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-100'} hover:shadow-xl transition-all duration-500 group`}>
                                <div className="flex justify-between items-start mb-6">
                                    <Badge variant="outline" className={`${i === 0 ? 'border-gray-700 text-gray-300' : 'border-gray-200 text-gray-500'} uppercase tracking-wider text-[10px]`}>
                                        {p.type}
                                    </Badge>
                                    <span className={`font-mono text-xs ${i === 0 ? 'text-gray-500' : 'text-gray-400'}`}>
                                        {Math.round(p.confidence * 100)}% MATCH
                                    </span>
                                </div>
                                <h3 className={`text-2xl font-serif font-bold mb-4 leading-tight ${i === 0 ? 'text-white' : 'text-gray-900'}`}>
                                    {p.type.split('_').join(' ')}
                                </h3>
                                <p className={`text-lg leading-relaxed mb-6 ${i === 0 ? 'text-gray-300' : 'text-gray-600'}`}>
                                    {p.description}
                                </p>
                                {p.insights && (
                                    <div className={`p-4 rounded ${i === 0 ? 'bg-gray-800/50' : 'bg-amber-50/50'}`}>
                                        <div className="flex items-start gap-3">
                                            <Lightbulb className={`h-5 w-5 mt-1 ${i === 0 ? 'text-amber-400' : 'text-amber-600'}`} />
                                            <p className={`text-sm italic ${i === 0 ? 'text-gray-400' : 'text-gray-600'}`}>
                                                "{JSON.parse(JSON.stringify(p.insights))[0] || "Keep reflecting."}"
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        ))}
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
                                            Week of {format(r.weekOf, 'MMMM d, yyyy')}
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
                                        <p className="text-xs text-gray-400 mb-2">{format(ex.createdAt, 'MMM d')}</p>
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
