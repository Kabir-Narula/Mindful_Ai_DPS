import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function getRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffInMs = now.getTime() - d.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
  
  if (diffInDays === 0) return 'Today'
  if (diffInDays === 1) return 'Yesterday'
  if (diffInDays < 7) return `${diffInDays} days ago`
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
  return formatDate(d)
}

export function getMoodColor(mood: number): string {
  if (mood >= 8) return 'text-green-500'
  if (mood >= 6) return 'text-blue-500'
  if (mood >= 4) return 'text-yellow-500'
  return 'text-red-500'
}

export function getMoodEmoji(mood: number): string {
  if (mood >= 9) return '😄'
  if (mood >= 7) return '😊'
  if (mood >= 5) return '😐'
  if (mood >= 3) return '😟'
  return '😢'
}

