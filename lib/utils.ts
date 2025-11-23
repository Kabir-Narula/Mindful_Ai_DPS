import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getMoodEmoji(moodRating: number): string {
  if (moodRating >= 9) return '🤩'
  if (moodRating >= 7) return '😊'
  if (moodRating >= 5) return '😐'
  if (moodRating >= 3) return '😕'
  return '😢'
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}
