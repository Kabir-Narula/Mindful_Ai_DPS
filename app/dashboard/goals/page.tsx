import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import NewGoalForm from '@/components/dashboard/new-goal-form'
import GoalCard from '@/components/dashboard/goal-card'

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
    <div className="space-y-12">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-200 pb-8">
        <div className="space-y-2">
          <span className="text-xs font-bold tracking-[0.2em] uppercase text-gray-400">
            Aspirations
          </span>
          <h1 className="text-6xl md:text-7xl font-serif text-[#1A1A1A] leading-none">
            The Goals.
          </h1>
        </div>
        <NewGoalForm />
      </div>

      {goals.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-2xl font-serif text-gray-400 italic mb-8">
            "A goal without a plan is just a wish."
          </p>
          <p className="text-sm font-bold uppercase tracking-widest text-gray-300">
            Create your first goal to begin
          </p>
        </div>
      ) : (
        <div className="space-y-16">
          {activeGoals.length > 0 && (
            <div className="space-y-8">
              <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-gray-400 border-b border-gray-100 pb-4">
                In Progress
              </h2>
              <div className="grid grid-cols-1 gap-8">
                {activeGoals.map((goal) => (
                  <GoalCard key={goal.id} goal={goal} />
                ))}
              </div>
            </div>
          )}

          {completedGoals.length > 0 && (
            <div className="space-y-8 opacity-60 hover:opacity-100 transition-opacity">
              <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-gray-400 border-b border-gray-100 pb-4">
                Accomplished
              </h2>
              <div className="grid grid-cols-1 gap-8">
                {completedGoals.map((goal) => (
                  <GoalCard key={goal.id} goal={goal} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

