export interface FeedEntry {
  id: string
  type: 'mood' | 'journal' | 'pattern' | 'reflection'
  createdAt: Date | string
  
  // Common
  title?: string
  content?: string
  
  // Mood Specific
  moodScore?: number // Made optional
  note?: string | null
  triggers?: string[]
  
  // Journal Specific
  sentimentLabel?: string | null
  
  // Pattern Specific
  confidence?: number
  insight?: string
  
  // Reflection Specific
  weekOf?: Date | string
  stats?: {
    avgMood: number
    totalEntries: number
    trend: string
  }
}

export interface UserProfile {
  id: string
  name: string | null
  email: string
}

export interface DayLog {
  id: string
  morningIntention: string | null
  dailyInsight: string | null
  suggestedAction: string | null
  eveningReflection: string | null
}

export interface DashboardData {
  user: UserProfile
  streak: { current: number; longest: number }
  dayLog: DayLog | null
  feedEntries: FeedEntry[]
}
