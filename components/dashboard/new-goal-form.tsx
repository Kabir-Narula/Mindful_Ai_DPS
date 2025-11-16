'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { Plus, Loader2 } from 'lucide-react'

export default function NewGoalForm() {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a goal title',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          targetDate: targetDate || null,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to create goal')
      }

      toast({
        title: 'Goal created!',
        description: 'Your goal has been saved.',
      })

      setTitle('')
      setDescription('')
      setTargetDate('')
      setOpen(false)
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

  if (!open) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Button onClick={() => setOpen(true)} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Create New Goal
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create a New Goal</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="goal-title">Goal Title *</Label>
            <Input
              id="goal-title"
              placeholder="e.g., Meditate daily, Exercise 3x per week"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal-description">Description (optional)</Label>
            <Textarea
              id="goal-description"
              placeholder="Add any details about your goal..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal-target">Target Date (optional)</Label>
            <Input
              id="goal-target"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Goal
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

