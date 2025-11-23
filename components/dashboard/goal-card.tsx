'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'
import { formatDate } from '@/lib/utils'
import { Trash2, Check, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Goal {
  id: string
  title: string
  description: string | null
  targetDate: Date | null
  completed: boolean
  completedAt: Date | null
  createdAt: Date
  checkIns: Array<{
    id: string
    completed: boolean
    createdAt: Date
  }>
}

interface GoalCardProps {
  goal: Goal
}

export default function GoalCard({ goal }: GoalCardProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleToggleComplete = async () => {
    setLoading(true)

    try {
      const res = await fetch(`/api/goals/${goal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !goal.completed }),
      })

      if (!res.ok) {
        throw new Error('Failed to update goal')
      }

      toast({
        title: goal.completed ? 'Goal reopened' : 'Goal completed!',
        description: goal.completed ? 'Keep working on it!' : 'Great job! 🎉',
      })

      router.refresh()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this goal?')) return

    setLoading(true)

    try {
      const res = await fetch(`/api/goals/${goal.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('Failed to delete goal')
      }

      toast({
        title: 'Goal deleted',
        description: 'Your goal has been removed.',
      })

      router.refresh()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCheckIn = async () => {
    setLoading(true)

    try {
      const res = await fetch(`/api/goals/${goal.id}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true }),
      })

      if (!res.ok) {
        throw new Error('Failed to check in')
      }

      toast({
        title: 'Check-in recorded!',
        description: 'Keep up the great work!',
      })

      router.refresh()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn(
      "group border-b border-gray-200 pb-8 transition-all",
      goal.completed && "opacity-50 hover:opacity-100"
    )}>
      <div className="flex items-start gap-8">
        {/* Custom Checkbox */}
        <button
          onClick={handleToggleComplete}
          disabled={loading}
          className={cn(
            "flex-shrink-0 w-12 h-12 border-2 flex items-center justify-center transition-all mt-1",
            goal.completed
              ? "bg-black border-black text-white"
              : "border-gray-200 hover:border-black text-transparent"
          )}
        >
          <Check className="h-6 w-6" />
        </button>

        {/* Content */}
        <div className="flex-1 space-y-4">
          <div>
            <h3 className={cn(
              "text-3xl font-serif text-[#1A1A1A] transition-all",
              goal.completed && "line-through decoration-gray-300 decoration-2"
            )}>
              {goal.title}
            </h3>
            {goal.description && (
              <p className="text-lg text-gray-500 font-light mt-2 max-w-2xl leading-relaxed">
                {goal.description}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs font-bold uppercase tracking-widest text-gray-400">
            {goal.targetDate && (
              <span>Target: {formatDate(goal.targetDate)}</span>
            )}

            {goal.checkIns.length > 0 && (
              <span>{goal.checkIns.length} Check-ins</span>
            )}

            {!goal.completed && (
              <button
                onClick={handleCheckIn}
                disabled={loading}
                className="text-black hover:underline underline-offset-4"
              >
                + Check In Today
              </button>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleDelete}
            disabled={loading}
            className="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-red-600 transition-colors"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

