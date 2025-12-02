import { z } from 'zod'

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

/**
 * Content length limits for various inputs
 * These are used across multiple schemas to ensure consistency
 */
export const CONTENT_LIMITS = {
  TITLE_MIN: 1,
  TITLE_MAX: 200,
  CONTENT_MIN: 1,
  CONTENT_MAX: 10000,
  SHORT_TEXT_MAX: 500,
  CHAT_MESSAGE_MAX: 2000,
  THOUGHT_MAX: 1000,
  CONTEXT_MAX: 500,
} as const

/**
 * Valid activity types for journal entries
 * Kept in sync with UI activity options
 */
export const VALID_ACTIVITIES = [
  'exercise',
  'meditation',
  'reading',
  'socializing',
  'work',
  'creative',
  'learning',
  'nature',
  'cooking',
  'gaming',
  'music',
  'rest',
  'therapy',
  'journaling',
  'other'
] as const

/**
 * Valid mood entry types for tracking context
 */
export const MOOD_TYPES = [
  'baseline',
  'pulse-check',
  'journaling',
  'post-activity',
  'morning',
  'evening',
  'triggered'
] as const

/**
 * Communication style options for user profiles
 */
export const COMMUNICATION_STYLES = [
  'casual',
  'conversational',
  'reflective',
  'direct'
] as const

/**
 * Age group options for user profiles
 */
export const AGE_GROUPS = [
  'under-18',
  '18-24',
  '25-34',
  '35-44',
  '45-54',
  '55+'
] as const

/**
 * Life stage options for user profiles
 */
export const LIFE_STAGES = [
  'student',
  'early-career',
  'mid-career',
  'parent',
  'caregiver',
  'retired',
  'transitioning',
  'other'
] as const

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Sanitize text input by trimming and removing potentially dangerous characters
 * while preserving meaningful punctuation
 */
const sanitizeText = (text: string): string => {
  return text
    .trim()
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
    .replace(/\s+/g, ' ') // Normalize whitespace (but keep single spaces)
}

/**
 * Custom refinement to check for suspicious patterns that might indicate
 * prompt injection or other malicious input
 */
const isSafeText = (text: string): boolean => {
  // Check for common prompt injection patterns
  const suspiciousPatterns = [
    /ignore\s+(previous|all|above)\s+instructions/i,
    /you\s+are\s+now\s+a/i,
    /disregard\s+your\s+programming/i,
    /override\s+your\s+instructions/i,
    /\[system\]/i,
    /\{\{.*\}\}/,  // Template injection
  ]

  return !suspiciousPatterns.some(pattern => pattern.test(text))
}

/**
 * Create a safe text schema with common validation rules
 */
const createSafeTextSchema = (minLength: number, maxLength: number) =>
  z.string()
    .min(minLength, `Text must be at least ${minLength} character(s)`)
    .max(maxLength, `Text must be at most ${maxLength} characters`)
    .transform(sanitizeText)
    .refine(isSafeText, 'Input contains invalid patterns')

// ============================================================================
// CORE SCHEMAS
// ============================================================================

/**
 * Journal entry schema with comprehensive validation
 * Includes sanitization, length checks, and activity validation
 */
export const journalSchema = z.object({
  title: createSafeTextSchema(CONTENT_LIMITS.TITLE_MIN, CONTENT_LIMITS.TITLE_MAX)
    .describe('Title of the journal entry'),

  content: createSafeTextSchema(CONTENT_LIMITS.CONTENT_MIN, CONTENT_LIMITS.CONTENT_MAX)
    .describe('Main content of the journal entry'),

  moodRating: z.number()
    .min(1, 'Mood rating must be at least 1')
    .max(10, 'Mood rating must be at most 10')
    .int('Mood rating must be a whole number')
    .describe('Mood rating from 1 (very low) to 10 (excellent)'),

  activities: z.array(
    z.string()
      .min(1)
      .max(50)
      .transform(s => s.toLowerCase().trim())
  )
    .max(10, 'Maximum 10 activities allowed')
    .optional()
    .default([])
    .describe('List of activities associated with this entry'),
})

/**
 * Mood snapshot schema for pulse checks and mood tracking
 */
export const moodSchema = z.object({
  score: z.number()
    .min(1, 'Score must be at least 1')
    .max(10, 'Score must be at most 10')
    .int('Score must be a whole number')
    .describe('Mood score from 1 to 10'),

  type: z.enum(MOOD_TYPES)
    .describe('Type of mood entry for context'),

  context: z.string()
    .max(CONTENT_LIMITS.CONTEXT_MAX, `Context must be at most ${CONTENT_LIMITS.CONTEXT_MAX} characters`)
    .transform(sanitizeText)
    .optional()
    .describe('Optional context about the mood entry'),

  triggers: z.array(z.string().max(100))
    .max(5, 'Maximum 5 triggers allowed')
    .optional()
    .default([])
    .describe('Optional triggers that affected mood'),
})

/**
 * User profile schema for onboarding and personalization
 */
export const userProfileSchema = z.object({
  nickname: z.string()
    .max(50, 'Nickname must be at most 50 characters')
    .transform(sanitizeText)
    .optional()
    .describe('Optional display name'),

  ageGroup: z.enum(AGE_GROUPS)
    .describe('Age group for personalized content'),

  lifeStage: z.enum(LIFE_STAGES)
    .describe('Current life stage'),

  communicationStyle: z.enum(COMMUNICATION_STYLES)
    .describe('Preferred communication style'),

  hobbies: z.array(
    z.string()
      .min(1)
      .max(50)
      .transform(s => s.toLowerCase().trim())
  )
    .min(1, 'Please select at least one hobby')
    .max(10, 'Maximum 10 hobbies allowed')
    .describe('Hobbies and interests'),

  currentWellbeing: z.number()
    .min(1, 'Wellbeing must be at least 1')
    .max(10, 'Wellbeing must be at most 10')
    .int()
    .describe('Current wellbeing score'),

  primaryGoals: z.array(
    z.string()
      .min(1)
      .max(100)
      .transform(sanitizeText)
  )
    .min(1, 'Please select at least one goal')
    .max(5, 'Maximum 5 primary goals allowed')
    .describe('Primary wellness goals'),
})

// ============================================================================
// CHAT & AI SCHEMAS
// ============================================================================

/**
 * Chat message schema for AI conversations
 */
export const chatMessageSchema = z.object({
  message: createSafeTextSchema(1, CONTENT_LIMITS.CHAT_MESSAGE_MAX)
    .describe('User message to the AI'),

  conversationHistory: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string().max(CONTENT_LIMITS.CHAT_MESSAGE_MAX),
    })
  )
    .max(20, 'Conversation history too long')
    .optional()
    .default([])
    .describe('Previous messages in the conversation'),

  context: z.object({
    page: z.string().max(50).optional(),
    entryId: z.string().cuid().optional(),
    goalId: z.string().cuid().optional(),
  })
    .optional()
    .describe('Optional context about where the chat was initiated'),
})

/**
 * CBT thought challenge schema
 */
export const cbtThoughtSchema = z.object({
  thought: createSafeTextSchema(10, CONTENT_LIMITS.THOUGHT_MAX)
    .describe('The negative thought to challenge'),

  step: z.enum(['validate', 'questions', 'reframe', 'save'])
    .describe('Current step in the CBT process'),

  conversation: z.array(
    z.object({
      question: z.string().max(500),
      answer: z.string().max(1000).transform(sanitizeText),
    })
  )
    .max(5, 'Maximum 5 Q&A pairs allowed')
    .optional()
    .describe('Previous questions and answers in the exercise'),
})

/**
 * CBT save schema for completed exercises
 */
export const cbtSaveSchema = z.object({
  originalThought: z.string()
    .min(10, 'Original thought is required')
    .max(CONTENT_LIMITS.THOUGHT_MAX)
    .transform(sanitizeText),

  reframedThought: z.string()
    .min(10, 'Reframed thought is required')
    .max(CONTENT_LIMITS.THOUGHT_MAX)
    .transform(sanitizeText),

  conversation: z.array(
    z.object({
      question: z.string(),
      answer: z.string(),
    })
  )
    .min(1, 'At least one Q&A is required')
    .max(5),
})

// ============================================================================
// GOAL & PROGRESS SCHEMAS
// ============================================================================

/**
 * Goal creation schema
 */
export const goalSchema = z.object({
  title: createSafeTextSchema(3, 200)
    .describe('Goal title'),

  description: z.string()
    .max(1000)
    .transform(sanitizeText)
    .optional()
    .describe('Optional detailed description'),

  targetDate: z.string()
    .datetime()
    .optional()
    .describe('Optional target completion date'),

  category: z.enum(['health', 'career', 'relationships', 'personal', 'financial', 'other'])
    .optional()
    .default('personal')
    .describe('Goal category'),

  milestones: z.array(
    z.object({
      title: z.string().min(1).max(200),
      completed: z.boolean().default(false),
    })
  )
    .max(10, 'Maximum 10 milestones allowed')
    .optional()
    .default([])
    .describe('Optional milestones to track progress'),
})

// ============================================================================
// DAY LOG SCHEMAS
// ============================================================================

/**
 * Morning intention schema
 */
export const intentionSchema = z.object({
  intention: createSafeTextSchema(3, CONTENT_LIMITS.SHORT_TEXT_MAX)
    .describe('Morning intention or focus for the day'),
})

/**
 * Evening reflection schema
 */
export const eveningReflectionSchema = z.object({
  reflection: createSafeTextSchema(10, CONTENT_LIMITS.CONTENT_MAX)
    .describe('Evening reflection on the day'),

  highlights: z.array(z.string().max(200))
    .max(5)
    .optional()
    .default([])
    .describe('Key highlights from the day'),

  gratitude: z.array(z.string().max(200))
    .max(3)
    .optional()
    .default([])
    .describe('Things to be grateful for'),
})

// ============================================================================
// HELPER TYPES
// ============================================================================

export type JournalInput = z.infer<typeof journalSchema>
export type MoodInput = z.infer<typeof moodSchema>
export type UserProfileInput = z.infer<typeof userProfileSchema>
export type ChatMessageInput = z.infer<typeof chatMessageSchema>
export type CBTThoughtInput = z.infer<typeof cbtThoughtSchema>
export type GoalInput = z.infer<typeof goalSchema>
export type IntentionInput = z.infer<typeof intentionSchema>

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Type-safe validation wrapper with proper error formatting
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string[]> } {
  const result = schema.safeParse(data)

  if (result.success) {
    return { success: true, data: result.data }
  }

  // Format errors for easy consumption
  const errors: Record<string, string[]> = {}
  result.error.errors.forEach(err => {
    const path = err.path.join('.') || 'root'
    if (!errors[path]) errors[path] = []
    errors[path].push(err.message)
  })

  return { success: false, errors }
}

/**
 * Rate limiting configuration by endpoint type
 */
export const RATE_LIMITS = {
  chat: { requests: 30, windowMs: 60 * 1000 },      // 30/min
  journal: { requests: 10, windowMs: 60 * 1000 },   // 10/min
  mood: { requests: 60, windowMs: 60 * 1000 },      // 60/min
  cbt: { requests: 10, windowMs: 60 * 1000 },       // 10/min
  pattern: { requests: 5, windowMs: 60 * 1000 },    // 5/min (expensive)
} as const

