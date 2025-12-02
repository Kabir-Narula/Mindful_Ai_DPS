import { openai, GPT_MODEL_REASONING, withRetry } from './openai'
import { prisma } from './prisma'
import { PersonalizationService } from './personalization-service'
import { anonymizeText, parseAIJSON } from '@/lib/utils'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Cognitive distortion types for classification
 */
export const COGNITIVE_DISTORTIONS = [
  'all-or-nothing',
  'overgeneralization',
  'mental-filter',
  'disqualifying-positive',
  'jumping-to-conclusions',
  'magnification',
  'emotional-reasoning',
  'should-statements',
  'labeling',
  'personalization',
  'catastrophizing',
] as const

export type CognitiveDistortion = typeof COGNITIVE_DISTORTIONS[number]

/**
 * Validation result with detailed analysis
 */
export interface ValidationResult {
  isValid: boolean
  reason?: string
  distortionType?: CognitiveDistortion
  severity?: 'mild' | 'moderate' | 'severe'
  confidence: number
}

/**
 * Generated challenge question with metadata
 */
export interface ChallengeQuestion {
  question: string
  technique: string // CBT technique being used
  difficulty: 'easy' | 'medium' | 'hard'
}

/**
 * Reframe result with analysis
 */
export interface ReframeResult {
  reframedThought: string
  technique: string
  cognitiveShift: string
  practiceReminder: string
}

/**
 * Saved exercise data
 */
export interface SavedExercise {
  id: string
  userId: string
  originalThought: string
  reframedThought: string
  distortionType?: string
  completedAt: Date
}

// ============================================================================
// CACHING
// ============================================================================

/**
 * Cache for validation results to avoid redundant API calls
 * Key: hash of thought text
 */
const validationCache = new Map<string, { result: ValidationResult; timestamp: number }>()
const VALIDATION_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Simple hash function for cache keys
 */
function hashThought(thought: string): string {
  let hash = 0
  for (let i = 0; i < thought.length; i++) {
    const char = thought.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return String(hash)
}

/**
 * Get cached validation if available
 */
function getCachedValidation(thought: string): ValidationResult | null {
  const key = hashThought(thought)
  const cached = validationCache.get(key)

  if (!cached) return null
  if (Date.now() - cached.timestamp > VALIDATION_CACHE_TTL) {
    validationCache.delete(key)
    return null
  }

  return cached.result
}

/**
 * Cache a validation result
 */
function cacheValidation(thought: string, result: ValidationResult): void {
  const key = hashThought(thought)
  validationCache.set(key, { result, timestamp: Date.now() })
}

// ============================================================================
// INPUT VALIDATION
// ============================================================================

/**
 * Validate thought input before processing
 */
function validateThoughtInput(thought: string): { valid: boolean; error?: string } {
  if (!thought || typeof thought !== 'string') {
    return { valid: false, error: 'Thought must be a non-empty string' }
  }

  const trimmed = thought.trim()

  if (trimmed.length < 10) {
    return { valid: false, error: 'Thought must be at least 10 characters' }
  }

  if (trimmed.length > 1000) {
    return { valid: false, error: 'Thought must be less than 1000 characters' }
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /ignore.*instructions/i,
    /you are now/i,
    /\[system\]/i,
  ]

  if (suspiciousPatterns.some(p => p.test(trimmed))) {
    return { valid: false, error: 'Input contains invalid patterns' }
  }

  return { valid: true }
}

// ============================================================================
// CBT SERVICE
// ============================================================================

export class CBTService {
  /**
   * Step 1: Validate if the thought is suitable for challenging
   * (e.g., negative self-talk, cognitive distortions)
   * Enhanced with caching and detailed analysis
   */
  static async validateThought(thought: string): Promise<ValidationResult> {
    // Input validation first
    const inputCheck = validateThoughtInput(thought)
    if (!inputCheck.valid) {
      return {
        isValid: false,
        reason: inputCheck.error,
        confidence: 1.0
      }
    }

    // Check cache
    const cached = getCachedValidation(thought)
    if (cached) {
      console.log('[CBTService] Validation cache hit')
      return cached
    }

    console.log('[CBTService] Validating thought...')

    try {
      // Anonymize before sending to AI
      const safeThought = anonymizeText(thought)

      const result = await withRetry(
        async () => {
          const response = await openai.chat.completions.create({
            model: GPT_MODEL_REASONING,
            messages: [
              {
                role: 'system',
                content: `You are a CBT therapist analyzing thoughts for cognitive distortions.

Analyze the user's thought and determine:
1. If it contains a cognitive distortion suitable for challenging
2. What type of distortion it is
3. The severity level

CRITICAL: Err on the side of "isValid: true". Only reject if:
- The thought is completely gibberish
- It's a purely positive affirmation with no underlying distortion
- It's a simple factual statement with no emotional component

Distortion types: ${COGNITIVE_DISTORTIONS.join(', ')}

Return JSON: {
  "isValid": boolean,
  "reason": "explanation",
  "distortionType": "type or null",
  "severity": "mild|moderate|severe",
  "confidence": 0.0-1.0
}`
              },
              { role: 'user', content: safeThought }
            ],
            temperature: 0.3,
            max_tokens: 200,
            response_format: { type: 'json_object' }
          })

          return response
        },
        'CBT validation'
      )

      const parsed = parseAIJSON<ValidationResult>(
        result.choices[0]?.message?.content || '{}',
        { isValid: true, confidence: 0.5 }
      )

      // Cache the result
      cacheValidation(thought, parsed)

      return parsed
    } catch (error) {
      console.error('[CBTService] Validation error:', error)
      // Default to allowing it if AI fails - better to attempt challenge than block
      return {
        isValid: true,
        reason: 'Unable to analyze, proceeding with challenge',
        confidence: 0.3
      }
    }
  }

  /**
   * Step 2: Generate personalized questions to challenge the thought
   * Enhanced with structured questions and CBT technique annotations
   */
  static async generateChallengeQuestions(
    thought: string,
    userId: string,
    options: { distortionType?: CognitiveDistortion } = {}
  ): Promise<ChallengeQuestion[]> {
    // Input validation - but don't fail, just log
    const inputCheck = validateThoughtInput(thought)
    if (!inputCheck.valid) {
      console.warn('[CBTService] Input validation warning:', inputCheck.error)
    }

    const profile = await prisma.userProfile.findUnique({ where: { userId } })
    const safeThought = thought.trim() // Don't over-sanitize

    console.log(`[CBTService] Generating questions for user ${userId.substring(0, 8)}... Profile: ${!!profile}`)

    try {
      // Use 'challenge' mode for CBT exercises - use default if no profile
      const systemPrompt = profile
        ? PersonalizationService.generateSystemPrompt(profile, 'challenge')
        : `You are a supportive CBT therapist helping users challenge negative thoughts.
Be warm, empathetic, and use evidence-based cognitive behavioral therapy techniques.`

      // Add distortion-specific guidance if available
      const distortionContext = options.distortionType
        ? `\nThe thought appears to contain ${options.distortionType} distortion. Tailor questions accordingly.`
        : ''

      const result = await withRetry(
        async () => {
          const response = await openai.chat.completions.create({
            model: GPT_MODEL_REASONING,
            messages: [
              { role: 'system', content: systemPrompt },
              {
                role: 'user',
                content: `The user has this negative thought: "${safeThought}"${distortionContext}

Generate 3 questions to help challenge this thought using evidence-based CBT techniques.

For each question, specify:
- The question itself (brief, empathetic, but probing)
- The CBT technique being used (e.g., "Evidence Examination", "Alternative Perspective", "Decatastrophizing")
- Difficulty level (easy, medium, hard)

Return JSON: {
  "questions": [
    { "question": "...", "technique": "...", "difficulty": "easy|medium|hard" }
  ]
}`
              }
            ],
            temperature: 0.7,
            max_tokens: 400,
            response_format: { type: 'json_object' }
          })
          return response
        },
        'Generate challenge questions'
      )

      const content = result.choices[0]?.message?.content
      console.log('[CBTService] AI Response:', content)

      if (!content) {
        throw new Error('No response from OpenAI')
      }

      const parsed = parseAIJSON<{ questions: ChallengeQuestion[] }>(content, { questions: [] })

      if (!parsed.questions || parsed.questions.length === 0) {
        throw new Error('AI returned no questions')
      }

      console.log(`[CBTService] Generated ${parsed.questions.length} questions`)
      return parsed.questions
    } catch (error) {
      console.error('[CBTService] Question generation error:', error)
      // Re-throw so the API can handle it properly
      throw error
    }
  }

  /**
   * Step 3: Generate a reframe based on user's answers
   * Enhanced with technique explanation and practice reminder
   */
  static async generateReframe(
    thought: string,
    answers: { question: string; answer: string }[],
    userId: string
  ): Promise<ReframeResult> {
    // Input validation
    if (!answers || answers.length === 0) {
      throw new Error('No answers provided for reframe')
    }

    const profile = await prisma.userProfile.findUnique({ where: { userId } })
    const systemPrompt = profile
      ? PersonalizationService.generateSystemPrompt(profile, 'supportive')
      : 'You are a compassionate CBT therapist helping someone reframe negative thoughts.'

    const conversationContext = answers.map(a => `Q: ${a.question}\nA: ${a.answer}`).join('\n\n')

    console.log('[CBTService] Generating reframe for thought:', thought.substring(0, 50))

    try {
      const result = await withRetry(
        async () => {
          const response = await openai.chat.completions.create({
            model: GPT_MODEL_REASONING,
            messages: [
              { role: 'system', content: systemPrompt },
              {
                role: 'user',
                content: `Original Negative Thought: "${thought}"

User's Reflection:
${conversationContext}

Based on their reflection, create a reframed thought that is:
- Realistic (not toxic positivity)
- Balanced and nuanced
- Based on the evidence they identified
- Actionable

Return JSON: {
  "reframedThought": "1-2 sentence balanced thought",
  "technique": "Primary CBT technique used",
  "cognitiveShift": "Brief description of the cognitive shift",
  "practiceReminder": "One sentence reminder for practicing this new thought"
}`
              }
            ],
            temperature: 0.7,
            max_tokens: 300,
            response_format: { type: 'json_object' }
          })
          return response
        },
        'Generate reframe'
      )

      const content = result.choices[0]?.message?.content
      console.log('[CBTService] Reframe response:', content)

      if (!content) {
        throw new Error('No response from OpenAI')
      }

      const parsed = parseAIJSON<ReframeResult>(content, {
        reframedThought: '',
        technique: '',
        cognitiveShift: '',
        practiceReminder: ''
      })

      if (!parsed.reframedThought) {
        throw new Error('AI returned empty reframe')
      }

      return parsed
    } catch (error) {
      console.error('[CBTService] Reframe generation error:', error)
      throw error
    }
  }

  /**
   * Save the completed exercise with additional metadata
   */
  static async saveExercise(userId: string, data: {
    originalThought: string
    reframedThought: string
    conversation: { question: string; answer: string }[]
    distortionType?: string
    technique?: string
  }): Promise<SavedExercise> {
    console.log('[CBTService] Saving exercise for user:', userId)

    const exercise = await prisma.therapyExercise.create({
      data: {
        userId,
        type: 'thought-challenging',
        originalThought: data.originalThought,
        reframedThought: data.reframedThought,
        conversation: data.conversation,
      }
    })

    // Also invalidate any cached context since user completed an exercise
    const { invalidateContextCache } = await import('./user-context-service')
    invalidateContextCache(userId)

    return {
      id: exercise.id,
      userId: exercise.userId,
      originalThought: exercise.originalThought || '',
      reframedThought: exercise.reframedThought || '',
      distortionType: data.distortionType,
      completedAt: exercise.createdAt,
    }
  }

  /**
   * Get user's CBT exercise history
   */
  static async getExerciseHistory(
    userId: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<SavedExercise[]> {
    const { limit = 10, offset = 0 } = options

    const exercises = await prisma.therapyExercise.findMany({
      where: {
        userId,
        type: 'thought-challenging',
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        userId: true,
        originalThought: true,
        reframedThought: true,
        createdAt: true,
      }
    })

    return exercises.map(e => ({
      id: e.id,
      userId: e.userId,
      originalThought: e.originalThought || '',
      reframedThought: e.reframedThought || '',
      completedAt: e.createdAt,
    }))
  }

  /**
   * Get count of completed exercises for user
   */
  static async getExerciseCount(userId: string): Promise<number> {
    return prisma.therapyExercise.count({
      where: {
        userId,
        type: 'thought-challenging',
      }
    })
  }
}
