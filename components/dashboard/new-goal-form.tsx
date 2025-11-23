'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="inline-flex items-center justify-center h-12 px-8 bg-black text-white text-sm uppercase tracking-widest hover:bg-gray-800 transition-colors">
          <Plus className="h-4 w-4 mr-2" />
          New Goal
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-3xl">New Aspiration</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-8 mt-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="goal-title" className="text-xs font-bold uppercase tracking-widest text-gray-500">
                Title
              </Label>
              <Input
                id="goal-title"
                placeholder="What do you want to achieve?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={loading}
                className="font-serif text-xl border-b-2 border-x-0 border-t-0 rounded-none px-0 focus-visible:ring-0 focus-visible:border-black"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal-description" className="text-xs font-bold uppercase tracking-widest text-gray-500">
                Details (Optional)
              </Label>
              <Textarea
                id="goal-description"
                placeholder="Add context..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
                rows={3}
                className="resize-none border-b-2 border-x-0 border-t-0 rounded-none px-0 focus-visible:ring-0 focus-visible:border-black"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal-target" className="text-xs font-bold uppercase tracking-widest text-gray-500">
                Target Date (Optional)
              </Label>
              <Input
                id="goal-target"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                disabled={loading}
                className="border-b-2 border-x-0 border-t-0 rounded-none px-0 focus-visible:ring-0 focus-visible:border-black"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-black text-white hover:bg-gray-800 rounded-none uppercase tracking-widest text-xs font-bold h-12"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Goal
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="flex-1 rounded-none uppercase tracking-widest text-xs font-bold h-12"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

