import { prisma } from './prisma'
import { differenceInDays, startOfDay, subDays } from 'date-fns'

export class StreakService {
  /**
   * Calculate current journaling streak for a user
   * Returns: { current: number, longest: number }
   */
  static async getStreak(userId: string): Promise<{ current: number; longest: number }> {
    const entries = await prisma.journalEntry.findMany({
      where: { userId },
      select: { createdAt: true },
      orderBy: { createdAt: 'desc' }
    })

    if (entries.length === 0) {
      return { current: 0, longest: 0 }
    }

    // Get unique days (ignore multiple entries per day)
    const uniqueDays = Array.from(
      new Set(entries.map(e => startOfDay(e.createdAt).getTime()))
    ).map(time => new Date(time))

    // Calculate current streak
    let currentStreak = 0
    const today = startOfDay(new Date())
    const yesterday = startOfDay(subDays(today, 1))

    // Check if user journaled today or yesterday (to maintain streak)
    const lastEntryDay = uniqueDays[0]
    const daysSinceLastEntry = differenceInDays(today, lastEntryDay)

    if (daysSinceLastEntry > 1) {
      // Streak broken
      currentStreak = 0
    } else {
      // Calculate consecutive days
      for (let i = 0; i < uniqueDays.length - 1; i++) {
        const diff = differenceInDays(uniqueDays[i], uniqueDays[i + 1])
        if (diff === 1) {
          currentStreak++
        } else {
          break
        }
      }
      currentStreak++ // Include the most recent day
    }

    // Calculate longest streak
    let longestStreak = 0
    let tempStreak = 1

    for (let i = 0; i < uniqueDays.length - 1; i++) {
      const diff = differenceInDays(uniqueDays[i], uniqueDays[i + 1])
      if (diff === 1) {
        tempStreak++
        longestStreak = Math.max(longestStreak, tempStreak)
      } else {
        tempStreak = 1
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak, currentStreak)

    return { current: currentStreak, longest: longestStreak }
  }
}
