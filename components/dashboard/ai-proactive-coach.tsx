'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Sparkles, TrendingUp, Calendar, Brain } from 'lucide-react'
import Link from 'next/link'

export default function AIProactiveCoach({ userId }: { userId: string }) {
    const [insights, setInsights] = useState<any>(null)

    useEffect(() => {
        fetch('/api/ai-coach')
            .then(res => res.json())
            .then(data => setInsights(data))
            .catch(() => { })
    }, [])

    if (!insights || insights.messages.length === 0) return null

    return (
        <Card className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-100 rounded-full">
                    <Sparkles className="h-5 w-5 text-indigo-600" />
                </div>
                <h3 className="font-serif font-bold text-gray-900">AI Coach Insights</h3>
            </div>

            <div className="space-y-3">
                {insights.messages.map((msg: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-white rounded border border-indigo-100">
                        {msg.type === 'improvement' && <TrendingUp className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />}
                        {msg.type === 'inactivity' && <Calendar className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />}
                        {msg.type === 'pattern' && <Brain className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />}
                        {msg.type === 'achievement' && <span className="text-lg shrink-0">🎉</span>}

                        <p className="text-sm text-gray-700 flex-1">{msg.message}</p>
                    </div>
                ))}
            </div>

            {insights.suggestedAction && (
                <Link href={insights.suggestedAction.link}>
                    <div className="mt-4 p-3 bg-indigo-600 hover:bg-indigo-700 rounded text-white text-center cursor-pointer transition-colors">
                        <p className="text-sm font-medium">{insights.suggestedAction.text}</p>
                    </div>
                </Link>
            )}
        </Card>
    )
}
