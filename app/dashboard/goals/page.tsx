import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import NewGoalForm from '@/components/dashboard/new-goal-form'
import GoalCard from '@/components/dashboard/goal-card'
import { Target } from 'lucide-react'

export default async function GoalsPage() {
  const authUser = await getCurrentUser()
  if (!authUser) redirect('/login')

  const goals = await prisma.goal.findMany({
    where: { userId: authUser.userId },
    include: {
      checkIns: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
    orderBy: [
      { completed: 'asc' },
      { createdAt: 'desc' },
    ],
  })

  const activeGoals = goals.filter(g => !g.completed)
  const completedGoals = goals.filter(g => g.completed)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Goals</h1>
        <p className="text-gray-600 mt-1">Set and track your personal wellbeing goals</p>
      </div>

      <NewGoalForm />

      {goals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Target className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-xl text-muted-foreground mb-2">No goals yet</p>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Set your first goal to start building better habits and improving your wellbeing.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {activeGoals.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Active Goals</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeGoals.map((goal) => (
                  <GoalCard key={goal.id} goal={goal} />
                ))}
              </div>
            </div>
          )}

          {completedGoals.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-muted-foreground">Completed Goals</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {completedGoals.map((goal) => (
                  <GoalCard key={goal.id} goal={goal} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

