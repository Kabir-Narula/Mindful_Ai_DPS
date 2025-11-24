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

/**
 * Basic PII Scrubber
 * Replaces common PII patterns with generic placeholders to protect privacy
 * before sending to AI.
 */
export function anonymizeText(text: string): string {
  if (!text) return ''
  return text
    // Emails
    .replace(/\b[\w\.-]+@[\w\.-]+\.\w{2,4}\b/g, '[EMAIL]')
    // Phone numbers (simple)
    .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]')
    // Names (Capitalized words that aren't at start of sentence is hard, 
    // so we'll just rely on the prompt instructions for now, but this is a start)
    // Real PII scrubbing is hard, this is a basic "Best Effort"
}

/**
 * Unified Daily View Helper
 * Merges the "DayLog" (Plan/Summary) with "JournalEntry" (Moments)
 * into one cohesive object to reduce confusion.
 */
export interface DailyUnifiedView {
  date: Date
  summary: {
    intention: string | null
    insight: string | null
    action: string | null
  }
  entries: Array<{
    id: string
    time: string
    title: string
    content: string
    mood: number
  }>
}

/**
 * Robust JSON Parser for AI Responses
 * Extracts JSON object from a string that might contain markdown or conversational filler.
 */
export function parseAIJSON<T>(text: string, fallback: T): T {
  try {
    if (!text) return fallback
    
    // 1. Try parsing directly
    try {
      return JSON.parse(text)
    } catch (e) {
      // Continue to extraction
    }

    // 2. Extract from code blocks ```json ... ```
    const codeBlockMatch = text.match(/```json\n([\s\S]*?)\n```/)
    if (codeBlockMatch && codeBlockMatch[1]) {
      return JSON.parse(codeBlockMatch[1])
    }

    // 3. Extract from first { to last }
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    if (start !== -1 && end !== -1 && end > start) {
      const jsonStr = text.substring(start, end + 1)
      return JSON.parse(jsonStr)
    }

    console.warn('Failed to parse AI JSON, returning fallback')
    return fallback
  } catch (error) {
    console.error('JSON Parse Error:', error)
    return fallback
  }
}
