import { z } from 'zod'

export const journalSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  content: z.string().min(1, "Content is required").max(10000),
  moodRating: z.number().min(1).max(10),
  activities: z.array(z.string()).optional().default([])
})

export const moodSchema = z.object({
  score: z.number().min(1).max(10),
  type: z.enum(['baseline', 'pulse-check', 'journaling', 'post-activity']),
  context: z.string().optional()
})

export const userProfileSchema = z.object({
  nickname: z.string().optional(),
  ageGroup: z.string(),
  lifeStage: z.string(),
  communicationStyle: z.string(),
  hobbies: z.array(z.string()),
  currentWellbeing: z.number().min(1).max(10),
  primaryGoals: z.array(z.string())
})

