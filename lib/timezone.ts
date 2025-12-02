/**
 * Timezone utilities for consistent date handling across the application.
 * All dates should be treated in Toronto timezone (America/Toronto - EST/EDT)
 * for this application's users.
 */

import { format, parseISO, startOfDay, endOfDay } from 'date-fns'
import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz'

// Application's default timezone
export const APP_TIMEZONE = 'America/Toronto'

/**
 * Get the current date in Toronto timezone as a Date object
 * The returned Date represents "today" in Toronto, normalized to midnight UTC
 * for database storage while preserving the correct calendar date.
 */
export function getTodayInTimezone(timezone: string = APP_TIMEZONE): Date {
  const now = new Date()
  // Convert current UTC time to the target timezone
  const zonedTime = toZonedTime(now, timezone)
  // Get just the date parts in that timezone
  const year = zonedTime.getFullYear()
  const month = zonedTime.getMonth()
  const day = zonedTime.getDate()
  // Create a UTC date at midnight for that calendar date
  // This ensures Dec 2 in Toronto is stored as Dec 2 00:00:00 UTC
  return new Date(Date.UTC(year, month, day, 0, 0, 0, 0))
}

/**
 * Parse a date string (YYYY-MM-DD) to a UTC midnight Date for database operations
 */
export function parseDateForDB(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
}

/**
 * Convert a client-provided ISO date string to the correct calendar date in Toronto timezone
 * Returns a Date object at UTC midnight for that calendar date.
 * 
 * Example: If user is in Toronto (UTC-5) at 11:30 PM on Dec 2nd:
 * - Client sends: 2025-12-03T04:30:00.000Z (UTC representation)
 * - This function returns: 2025-12-02T00:00:00.000Z (Dec 2 stored correctly)
 */
export function normalizeToTorontoDate(isoDateString: string): Date {
  const date = new Date(isoDateString)
  // Convert to Toronto timezone to get the correct calendar date
  const zonedTime = toZonedTime(date, APP_TIMEZONE)
  const year = zonedTime.getFullYear()
  const month = zonedTime.getMonth()
  const day = zonedTime.getDate()
  // Return UTC midnight for that calendar date
  return new Date(Date.UTC(year, month, day, 0, 0, 0, 0))
}

/**
 * Format a date for display in Toronto timezone
 */
export function formatInToronto(date: Date | string, formatStr: string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return formatInTimeZone(d, APP_TIMEZONE, formatStr)
}

/**
 * Get the start of day in Toronto timezone as a UTC Date
 * Used for querying entries "from the start of today"
 */
export function getStartOfDayInToronto(date: Date = new Date()): Date {
  const zonedTime = toZonedTime(date, APP_TIMEZONE)
  const startOfZonedDay = startOfDay(zonedTime)
  return fromZonedTime(startOfZonedDay, APP_TIMEZONE)
}

/**
 * Get the end of day in Toronto timezone as a UTC Date
 * Used for querying entries "until the end of today"
 */
export function getEndOfDayInToronto(date: Date = new Date()): Date {
  const zonedTime = toZonedTime(date, APP_TIMEZONE)
  const endOfZonedDay = endOfDay(zonedTime)
  return fromZonedTime(endOfZonedDay, APP_TIMEZONE)
}

/**
 * Check if two dates represent the same calendar day in Toronto timezone
 */
export function isSameDayInToronto(date1: Date, date2: Date): boolean {
  const d1 = formatInTimeZone(date1, APP_TIMEZONE, 'yyyy-MM-dd')
  const d2 = formatInTimeZone(date2, APP_TIMEZONE, 'yyyy-MM-dd')
  return d1 === d2
}

/**
 * Get today's date string in YYYY-MM-DD format for Toronto timezone
 */
export function getTodayString(): string {
  return formatInTimeZone(new Date(), APP_TIMEZONE, 'yyyy-MM-dd')
}

/**
 * Convert a database date to a display string for the user
 * @param date - The date from the database (stored as UTC midnight)
 * @param formatStr - The date-fns format string
 */
export function formatDateForDisplay(date: Date | string, formatStr: string = 'MMM d, yyyy'): string {
  // Database dates are stored as UTC midnight for the calendar date
  // We need to display them as that calendar date, not convert timezone
  const d = typeof date === 'string' ? parseISO(date) : date
  // Use UTC formatting since we store dates at UTC midnight
  return format(d, formatStr)
}

/**
 * Format a UTC midnight date (from database) as a date string
 * This extracts UTC date components directly to avoid timezone conversion issues
 * Use this for dayLog.date and similar fields stored as UTC midnight
 */
export function formatUTCDate(date: Date, formatStr: string = 'yyyy-MM-dd'): string {
  // For all formats, use formatInTimeZone with UTC to ensure consistent formatting
  // This avoids local timezone conversion issues with UTC midnight dates
  return formatInTimeZone(date, 'UTC', formatStr)
}

/**
 * Get search window for finding entries on a specific date in Toronto timezone
 * Returns start and end UTC times that cover the full day in Toronto
 *
 * IMPORTANT: This function expects `date` to be a UTC midnight date that represents
 * a calendar date (e.g., 2025-12-02T00:00:00.000Z means December 2nd).
 * It does NOT convert the date through timezone - it treats the UTC date as the calendar date
 * and calculates Toronto's start/end times for that calendar date.
 */
export function getDateSearchWindow(date: Date): { start: Date; end: Date } {
  // Extract the calendar date components from the UTC date directly
  // This is the YYYY-MM-DD that we want to find entries for
  const year = date.getUTCFullYear()
  const month = date.getUTCMonth()
  const day = date.getUTCDate()

  // Create a date object representing this calendar date at midnight in Toronto
  // We need to find what UTC times correspond to the start and end of this day in Toronto
  // Toronto is UTC-5 (EST) or UTC-4 (EDT)
  // So Dec 2nd 00:00 Toronto = Dec 2nd 05:00 UTC (EST) or Dec 2nd 04:00 UTC (EDT)

  // Create a local Date for this calendar date at midnight
  const calendarDateMidnight = new Date(year, month, day, 0, 0, 0, 0)

  // Now convert this to Toronto timezone boundaries
  // Use the target date to get the correct timezone offset for that date
  const startOfCalendarDay = startOfDay(calendarDateMidnight)
  const endOfCalendarDay = endOfDay(calendarDateMidnight)

  // Convert from Toronto time to UTC
  return {
    start: fromZonedTime(startOfCalendarDay, APP_TIMEZONE),
    end: fromZonedTime(endOfCalendarDay, APP_TIMEZONE)
  }
}

