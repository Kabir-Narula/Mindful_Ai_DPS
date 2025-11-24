'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function QuickJournalModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const [content, setContent] = useState('')
    const [loading, setLoading] = useState(false)
    const { toast } = useToast()
    const router = useRouter()

    const handleSubmit = async () => {
        if (!content.trim()) {
            toast({
                title: 'Empty entry',
                description: 'Please write at least one sentence',
                variant: 'destructive'
            })
            return
        }

        setLoading(true)
        try {
            const res = await fetch('/api/journal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: 'Quick Check-In',
                    content: content.trim(),
                    moodRating: 6, // Default neutral-positive
                    activities: []
                })
            })

            const data = await res.json()

            if (!res.ok) throw new Error(data.error)

            toast({
                title: '✓ Saved',
                description: 'Quick journal entry saved!'
            })

            onOpenChange(false)
            setContent('')
            router.refresh()
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive'
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-purple-600" />
                        Quick Check-In
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div>
                        <label className="text-sm text-gray-600 mb-2 block">
                            What's one thing on your mind right now?
                        </label>
                        <Textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Just one sentence is enough..."
                            className="min-h-[120px]"
                            autoFocus
                        />
                        <p className="text-xs text-gray-400 mt-2">
                            Tip: Even one sentence a day builds the habit
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
