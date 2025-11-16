'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/components/ui/use-toast'
import { formatDate } from '@/lib/utils'
import { CheckCircle2, Circle, Trash2, Calendar } from 'lucide-react'

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
    <Card className={goal.completed ? 'opacity-75' : ''}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <button
              onClick={handleToggleComplete}
              disabled={loading}
              className="mt-1"
            >
              {goal.completed ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <Circle className="h-5 w-5 text-gray-400" />
              )}
            </button>
            <div className="flex-1">
              <CardTitle className={`text-lg ${goal.completed ? 'line-through text-muted-foreground' : ''}`}>
                {goal.title}
              </CardTitle>
              {goal.description && (
                <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={loading}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {goal.targetDate && (
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 mr-2" />
            Target: {formatDate(goal.targetDate)}
          </div>
        )}

        {goal.checkIns.length > 0 && (
          <div className="text-sm text-muted-foreground">
            {goal.checkIns.length} check-in{goal.checkIns.length !== 1 ? 's' : ''}
          </div>
        )}

        {!goal.completed && (
          <Button
            onClick={handleCheckIn}
            disabled={loading}
            variant="outline"
            size="sm"
            className="w-full"
          >
            Check In Today
          </Button>
        )}

        {goal.completedAt && (
          <p className="text-xs text-muted-foreground">
            Completed on {formatDate(goal.completedAt)}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

