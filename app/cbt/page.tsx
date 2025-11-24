import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Brain, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import ThoughtChallenge from '@/components/cbt/thought-challenge'
import DashboardNav from '@/components/dashboard/dashboard-nav'

export default async function CBTPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav user={{ id: user.userId, name: user.name, email: user.email }} />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-foreground mb-2">Mental Exercises</h1>
          <p className="text-muted-foreground">Tools to help you reframe thoughts and build resilience.</p>
        </div>

        <div className="grid grid-cols-1 gap-8">
            {/* Featured Exercise */}
            <Card className="p-6 border-2 border-purple-100 bg-gradient-to-br from-white to-purple-50/50">
                <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-full">
                            <Brain className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-foreground">Cognitive Reframing</h2>
                            <p className="text-sm text-muted-foreground">Challenge negative thoughts with logic.</p>
                        </div>
                    </div>
                </div>
                
                <ThoughtChallenge userId={user.userId} />
            </Card>

            {/* Placeholder for future exercises */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-50 pointer-events-none grayscale">
                <Card className="p-6">
                    <h3 className="font-bold mb-2">Box Breathing</h3>
                    <p className="text-sm text-muted-foreground">Coming soon...</p>
                </Card>
                <Card className="p-6">
                    <h3 className="font-bold mb-2">5-4-3-2-1 Grounding</h3>
                    <p className="text-sm text-muted-foreground">Coming soon...</p>
                </Card>
            </div>
        </div>
      </main>
    </div>
  )
}

