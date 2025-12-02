import { prisma } from './prisma'
import { differenceInDays, subDays, isAfter, isSameDay } from 'date-fns'
import { formatInToronto } from './timezone'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Streak data structure with detailed statistics
 */
export interface StreakData {
  current: number
  longest: number
  totalDays: number
  lastEntryDate: Date | null
  isActiveToday: boolean
  weeklyAverage: number
  milestoneProgress: {
    nextMilestone: number
    daysToGo: number
    percentComplete: number
  }
}

/**
 * Lightweight streak data for quick checks
 */
export interface BasicStreak {
  current: number
  longest: number
}

// ============================================================================
// CACHING
// ============================================================================

/**
 * In-memory cache for streak data
 * TTL: 5 minutes (short since streaks change daily)
 */
interface CacheEntry {
  data: StreakData
  timestamp: number
  expiresAt: number
}

const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes
const streakCache = new Map<string, CacheEntry>()

/**
 * Get cached streak data if valid
 */
function getCachedStreak(userId: string): StreakData | null {
  const entry = streakCache.get(userId)
  if (!entry) return null

  if (Date.now() > entry.expiresAt) {
    streakCache.delete(userId)
    return null
  }

  return entry.data
}

/**
 * Set streak data in cache
 */
function setCachedStreak(userId: string, data: StreakData): void {
  const now = Date.now()
  streakCache.set(userId, {
    data,
    timestamp: now,
    expiresAt: now + CACHE_TTL_MS,
  })
}

/**
 * Invalidate cache for a user (call when new entry is created)
 */
export function invalidateStreakCache(userId: string): void {
  streakCache.delete(userId)
}

/**
 * Clear all cached streaks (for admin/maintenance)
 */
export function clearAllStreakCaches(): void {
  streakCache.clear()
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get the start of a day in Toronto timezone, returned as a Date object
 * Uses the centralized timezone utilities for consistency
 */
function getStartOfDayInToronto(date: Date): Date {
  const dateStr = formatInToronto(date, 'yyyy-MM-dd')
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
}

/**
 * Calculate milestone progress
 * Milestones are at 7, 14, 21, 30, 60, 90, 180, 365 days
 */
function calculateMilestoneProgress(currentStreak: number): StreakData['milestoneProgress'] {
  const milestones = [7, 14, 21, 30, 60, 90, 180, 365]

  // Find next milestone
  const nextMilestone = milestones.find(m => m > currentStreak) ||
    Math.ceil(currentStreak / 365) * 365 + 365 // Next yearly milestone

  // Find previous milestone for progress calculation
  const prevMilestone = milestones.filter(m => m <= currentStreak).pop() || 0

  const daysToGo = nextMilestone - currentStreak
  const rangeSize = nextMilestone - prevMilestone
  const progressInRange = currentStreak - prevMilestone
  const percentComplete = rangeSize > 0
    ? Math.round((progressInRange / rangeSize) * 100)
    : 100

  return { nextMilestone, daysToGo, percentComplete }
}

/**
 * Calculate weekly journaling average over last 4 weeks
 */
function calculateWeeklyAverage(uniqueDays: Date[]): number {
  const fourWeeksAgo = subDays(new Date(), 28)
  const recentDays = uniqueDays.filter(d => isAfter(d, fourWeeksAgo))
  return Math.round((recentDays.length / 4) * 10) / 10 // One decimal place
}

// ============================================================================
// STREAK SERVICE
// ============================================================================

export class StreakService {
  /**
   * Get basic streak data (current and longest)
   * Lightweight version for quick UI updates
   */
  static async getStreak(userId: string): Promise<BasicStreak> {
    const fullStreak = await this.getFullStreakData(userId)
    return {
      current: fullStreak.current,
      longest: fullStreak.longest,
    }
  }

  /**
   * Get comprehensive streak data with caching
   * Includes statistics, milestones, and weekly averages
   */
  static async getFullStreakData(userId: string): Promise<StreakData> {
    // Check cache first
    const cached = getCachedStreak(userId)
    if (cached) {
      console.log(`[StreakService] Cache hit for user ${userId}`)
      return cached
    }

    console.log(`[StreakService] Cache miss for user ${userId}, computing...`)

    // Fetch entries - only select what we need, limit to last year for efficiency
    const oneYearAgo = subDays(new Date(), 365)
    const entries = await prisma.journalEntry.findMany({
      where: {
        userId,
        createdAt: { gte: oneYearAgo }
      },
      select: { createdAt: true },
      orderBy: { createdAt: 'desc' },
    })

    // Handle empty case
    if (entries.length === 0) {
      const emptyData: StreakData = {
        current: 0,
        longest: 0,
        totalDays: 0,
        lastEntryDate: null,
        isActiveToday: false,
        weeklyAverage: 0,
        milestoneProgress: calculateMilestoneProgress(0),
      }
      setCachedStreak(userId, emptyData)
      return emptyData
    }

    // Convert to unique days in Toronto timezone
    const uniqueDaysSet = new Set<number>()
    entries.forEach(e => {
      uniqueDaysSet.add(getStartOfDayInToronto(e.createdAt).getTime())
    })

    // Sort days in descending order (most recent first)
    const uniqueDays = Array.from(uniqueDaysSet)
      .sort((a, b) => b - a)
      .map(time => new Date(time))

    const today = getStartOfDayInToronto(new Date())
    const lastEntryDay = uniqueDays[0]
    const isActiveToday = isSameDay(lastEntryDay, today)

    // Calculate current streak
    const currentStreak = this.calculateCurrentStreak(uniqueDays, today)

    // Calculate longest streak
    const longestStreak = this.calculateLongestStreak(uniqueDays, currentStreak)

    // Calculate weekly average
    const weeklyAverage = calculateWeeklyAverage(uniqueDays)

    const streakData: StreakData = {
      current: currentStreak,
      longest: longestStreak,
      totalDays: uniqueDays.length,
      lastEntryDate: lastEntryDay,
      isActiveToday,
      weeklyAverage,
      milestoneProgress: calculateMilestoneProgress(currentStreak),
    }

    // Cache the result
    setCachedStreak(userId, streakData)

    return streakData
  }

  /**
   * Calculate current streak from sorted unique days
   * Optimized algorithm: O(n) where n = streak length, not total entries
   */
  private static calculateCurrentStreak(uniqueDays: Date[], today: Date): number {
    if (uniqueDays.length === 0) return 0

    const lastEntryDay = uniqueDays[0]
    const daysSinceLastEntry = differenceInDays(today, lastEntryDay)

    // If last entry was more than 1 day ago, streak is broken
    if (daysSinceLastEntry > 1) {
      return 0
    }

    // Count consecutive days starting from most recent
    let streak = 1
    for (let i = 0; i < uniqueDays.length - 1; i++) {
      const diff = differenceInDays(uniqueDays[i], uniqueDays[i + 1])
      if (diff === 1) {
        streak++
      } else {
        // Gap found, stop counting
        break
      }
    }

    return streak
  }

  /**
   * Calculate longest streak from sorted unique days
   * Uses single-pass algorithm: O(n)
   */
  private static calculateLongestStreak(uniqueDays: Date[], currentStreak: number): number {
    if (uniqueDays.length <= 1) return uniqueDays.length

    let maxStreak = currentStreak // Start with current streak as baseline
    let tempStreak = 1

    for (let i = 0; i < uniqueDays.length - 1; i++) {
      const diff = differenceInDays(uniqueDays[i], uniqueDays[i + 1])
      if (diff === 1) {
        tempStreak++
      } else {
        // Update max if this streak is longer
        maxStreak = Math.max(maxStreak, tempStreak)
        tempStreak = 1
      }
    }

    // Final check for streak ending at oldest entry
    return Math.max(maxStreak, tempStreak)
  }

  /**
   * Check if user has journaled today
   * Fast query for streak maintenance notifications
   */
  static async hasJournaledToday(userId: string): Promise<boolean> {
    const cached = getCachedStreak(userId)
    if (cached) {
      return cached.isActiveToday
    }

    const today = getStartOfDayInToronto(new Date())
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)

    const entry = await prisma.journalEntry.findFirst({
      where: {
        userId,
        createdAt: {
          gte: today,
          lt: tomorrow,
        }
      },
      select: { id: true }
    })

    return entry !== null
  }

  /**
   * Get users with streaks at risk (haven't journaled today)
   * For notification systems
   */
  static async getUsersWithStreaksAtRisk(minStreak: number = 3): Promise<string[]> {
    // This is an expensive query, use sparingly (e.g., once per day for notifications)
    const today = getStartOfDayInToronto(new Date())

    // Get users who journaled recently (within 2 days) but not today
    const dayBeforeYesterday = subDays(today, 2)

    // Find users with entries from yesterday
    const usersWithRecentEntries = await prisma.journalEntry.findMany({
      where: {
        createdAt: {
          gte: dayBeforeYesterday,
          lt: today,
        }
      },
      select: { userId: true },
      distinct: ['userId'],
    })

    // Check each user's streak
    const atRiskUsers: string[] = []

    for (const { userId } of usersWithRecentEntries) {
      const streak = await this.getFullStreakData(userId)
      if (streak.current >= minStreak && !streak.isActiveToday) {
        atRiskUsers.push(userId)
      }
    }

    return atRiskUsers
  }
}
