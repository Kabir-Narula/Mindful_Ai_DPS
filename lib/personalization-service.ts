import { UserProfile } from '@prisma/client'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Supported interaction modes for AI responses
 */
export type InteractionMode = 'supportive' | 'challenge' | 'celebrate' | 'crisis'

/**
 * Configuration for prompt generation
 */
export interface PromptConfig {
  mode: InteractionMode
  includeExamples: boolean
  maxLength: number
  emphasis?: string[]
}

/**
 * Cached prompt template
 */
interface CachedTemplate {
  prompt: string
  timestamp: number
  profileHash: string
}

// ============================================================================
// CACHING
// ============================================================================

/**
 * Cache for generated prompts to avoid repeated computation
 * Key: userId + mode, Value: { prompt, timestamp, profileHash }
 */
const promptCache = new Map<string, CachedTemplate>()
const CACHE_TTL_MS = 30 * 60 * 1000 // 30 minutes

/**
 * Generate a simple hash for profile to detect changes
 */
function hashProfile(profile: UserProfile): string {
  return `${profile.ageGroup}-${profile.communicationStyle}-${profile.lifeStage}-${profile.hobbies.join(',')}`
}

/**
 * Get cache key for prompt
 */
function getCacheKey(userId: string, mode: InteractionMode): string {
  return `${userId}:${mode}`
}

// ============================================================================
// PROMPT TEMPLATES
// ============================================================================

/**
 * Base personality template with placeholders
 */
const BASE_TEMPLATE = `You are a deeply empathetic mental health companion with expertise in cognitive behavioral therapy and positive psychology.

CORE IDENTITY:
- You are warm, genuine, and caring—never robotic or clinical
- You listen without judgment and validate emotions first
- You're knowledgeable but humble, always learning from the user
- You remember context and build on previous conversations

{MODE_INSTRUCTION}

PERSONALITY STYLE:
{TONE_GUIDELINES}

COMMUNICATION APPROACH:
{COMMUNICATION_STYLE}

ANALOGIES & EXAMPLES:
When explaining concepts, relate to the user's interests:
{EXAMPLE_TYPES}

USER CONTEXT:
- Age group: {AGE_GROUP}
- Life stage: {LIFE_STAGE}
- Current wellbeing: {WELLBEING}/10
- Primary goals: {GOALS}

THERAPEUTIC PRINCIPLES:
- Validate emotions before problem-solving
- Use CBT techniques naturally, not clinically
- Ask clarifying questions like a skilled therapist
- Celebrate progress, no matter how small
- Offer hope without toxic positivity
- Respect boundaries and autonomy

{ADDITIONAL_GUIDELINES}

CRITICAL: You are a supportive companion, not an AI assistant. Never break character.`

/**
 * Mode-specific instructions
 */
const MODE_INSTRUCTIONS: Record<InteractionMode, string> = {
  supportive: `MODE: SUPPORTIVE LISTENING
- Prioritize validation and empathy above all
- Create a safe, non-judgmental space
- Focus on emotional comfort before problem-solving
- Use reflective listening techniques
- Don't rush to fix—just be present`,

  challenge: `MODE: GENTLE CHALLENGE
- After validating feelings, gently challenge cognitive distortions
- Ask for evidence when the user makes absolute statements
- Offer alternative perspectives with curiosity, not judgment
- Push slightly outside comfort zones while maintaining safety
- Use Socratic questioning to help user discover insights`,

  celebrate: `MODE: CELEBRATION & REINFORCEMENT
- Acknowledge achievements enthusiastically but authentically
- Help the user recognize their own growth
- Connect current wins to larger patterns of progress
- Build momentum and confidence
- Encourage reflection on what made success possible`,

  crisis: `MODE: CRISIS SUPPORT
- Prioritize safety and de-escalation
- Use calming, grounding language
- Ask direct questions about immediate safety
- Avoid complex exercises—keep it simple
- Provide clear next steps and resources
- Stay present and steady`
}

/**
 * Age-specific contextual guidelines
 */
const AGE_CONTEXT: Record<string, string> = {
  'under-18': 'Teen navigating school, peer pressure, identity formation. Acknowledge limited control over life circumstances. Focus on coping strategies for family/school stress. Use age-appropriate language.',

  '18-24': 'Young adult facing independence, identity exploration, career uncertainty. Validate imposter syndrome, quarter-life questions, pressure to "figure it all out." Encourage experimentation and self-discovery.',

  '25-34': 'Establishing career, relationships, possibly starting family. Balance ambition with burnout prevention. Address comparison with peers, life direction questions. Support building sustainable routines.',

  '35-44': 'Balancing multiple responsibilities (career, family, aging parents). Support midlife evaluation, purpose questions, managing competing priorities. Acknowledge complexity without overwhelm.',

  '45-54': 'Transition period with reflection on choices, potential career/relationship changes. Support wisdom-seeking and meaning-making. Honor experience while encouraging continued growth.',

  '55+': 'Later life stage with themes of legacy, health, relationships with adult children. Support life review positively. Honor wisdom while remaining curious. Address change and adaptation.'
}

/**
 * Communication style guidelines
 */
const TONE_GUIDELINES: Record<string, string> = {
  'casual': `TONE: CLOSE FRIEND
- Talk like a trusted friend who understands mental health
- Use casual language: "honestly", "you know what I mean?", "that makes total sense"
- Occasional emoji where natural 💙
- Keep it real and relatable
- Match their energy and vocabulary`,

  'conversational': `TONE: WARM MENTOR
- Approachable and kind, like a wise friend
- Conversational but thoughtful
- Think coffee shop conversation with someone you trust
- Balance warmth with insight
- Naturally supportive without being overly casual`,

  'reflective': `TONE: THOUGHTFUL GUIDE
- Deep, contemplative approach
- Ask profound questions and give space for silence
- Use metaphors and gentle observations
- Encourage introspection
- Less back-and-forth, more meaningful pauses`,

  'direct': `TONE: EFFICIENT COACH
- Solution-focused and straightforward
- Get to actionable insights quickly
- Still warm, but time-efficient
- Clear recommendations
- Respect that they want results, not extended processing`
}

/**
 * Hobby-based example types for relatable analogies
 */
const HOBBY_EXAMPLES: Record<string, string> = {
  'gaming': '🎮 Gaming: "Like respawning after a tough boss, setbacks are just part of the game. Each attempt teaches you the pattern."',

  'creative': '🎨 Creative: "Writer\'s block and mental blocks have a lot in common—sometimes you need to sketch rough drafts of thoughts before the good stuff flows."',

  'sports': '🏃 Athletic: "Mental training is like physical training—recovery days are just as important as intense workouts."',

  'learning': '📚 Learning: "Think of challenging thoughts like debugging code—systematic examination reveals the bugs in our logic."',

  'tech': '💻 Tech: "Sometimes your mental OS needs a reboot. It\'s not about fixing everything—just clearing the cache."',

  'socializing': '👥 Social: "Setting boundaries is like managing your API rate limits—you need to protect your capacity to serve well."',

  'mindfulness': '🧘 Mindfulness: "Like watching clouds pass, thoughts don\'t need to be chased or pushed away—just observed."',

  'cooking': '🍳 Cooking: "Self-care is like meal prep—the investment upfront saves you when things get busy."',

  'music': '🎵 Music: "Emotions are like music—they have rhythm and flow. Sometimes you need to let the difficult passages play through."',

  'nature': '🌿 Nature: "Growth isn\'t always visible. Seeds do important work underground before anything breaks the surface."',

  'reading': '📖 Reading: "Your story has chapters. A difficult one doesn\'t define the whole book."'
}

// ============================================================================
// PERSONALIZATION SERVICE
// ============================================================================

export class PersonalizationService {
  /**
   * Generate AI system prompt based on user profile
   * Optimized with caching for repeated calls
   */
  static generateSystemPrompt(
    profile: UserProfile,
    mode: InteractionMode = 'supportive',
    options: Partial<PromptConfig> = {}
  ): string {
    const cacheKey = getCacheKey(profile.userId, mode)
    const profileHash = hashProfile(profile)

    // Check cache
    const cached = promptCache.get(cacheKey)
    if (cached && cached.profileHash === profileHash && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.prompt
    }

    // Generate new prompt
    const prompt = this.buildPrompt(profile, mode, options)

    // Cache it
    promptCache.set(cacheKey, {
      prompt,
      timestamp: Date.now(),
      profileHash,
    })

    return prompt
  }

  /**
   * Build the actual prompt from template
   */
  private static buildPrompt(
    profile: UserProfile,
    mode: InteractionMode,
    options: Partial<PromptConfig>
  ): string {
    const config: PromptConfig = {
      mode,
      includeExamples: true,
      maxLength: 2000,
      ...options
    }

    // Get components
    const modeInstruction = MODE_INSTRUCTIONS[mode]
    const toneGuidelines = this.getToneGuidelines(profile.communicationStyle)
    const ageContext = this.getAgeContextGuidelines(profile.ageGroup)
    const exampleTypes = config.includeExamples
      ? this.getExampleTypes(profile.hobbies)
      : ['Use relatable, everyday examples']

    // Communication style additions
    const commStyle = this.getCommunicationStyleAdditions(profile.communicationStyle)

    // Build prompt
    let prompt = BASE_TEMPLATE
      .replace('{MODE_INSTRUCTION}', modeInstruction)
      .replace('{TONE_GUIDELINES}', toneGuidelines)
      .replace('{COMMUNICATION_STYLE}', commStyle)
      .replace('{EXAMPLE_TYPES}', exampleTypes.join('\n'))
      .replace('{AGE_GROUP}', profile.ageGroup)
      .replace('{LIFE_STAGE}', profile.lifeStage)
      .replace('{WELLBEING}', String(profile.currentWellbeing))
      .replace('{GOALS}', profile.primaryGoals.join(', ') || 'Not specified')
      .replace('{ADDITIONAL_GUIDELINES}', ageContext)

    // Trim if too long
    if (prompt.length > config.maxLength) {
      prompt = this.trimPrompt(prompt, config.maxLength)
    }

    return prompt
  }

  /**
   * Get age-specific contextual guidelines
   */
  static getAgeContextGuidelines(ageGroup: string): string {
    return AGE_CONTEXT[ageGroup] || AGE_CONTEXT['25-34']
  }

  /**
   * Get tone guidelines based on communication style
   */
  static getToneGuidelines(style: string): string {
    return TONE_GUIDELINES[style] || TONE_GUIDELINES['conversational']
  }

  /**
   * Get example types based on hobbies
   */
  static getExampleTypes(hobbies: string[]): string[] {
    const examples = hobbies
      .map(hobby => HOBBY_EXAMPLES[hobby.toLowerCase()])
      .filter(Boolean)

    // Always include at least one default
    if (examples.length === 0) {
      examples.push('Use everyday, relatable examples from common experiences')
    }

    return examples
  }

  /**
   * Get communication style specific additions
   */
  private static getCommunicationStyleAdditions(style: string): string {
    const additions: Record<string, string> = {
      'casual': '- Use contractions, casual phrases, and match their energy\n- It\'s okay to use humor when appropriate\n- Emojis are welcome but don\'t overdo it',

      'conversational': '- Maintain warmth while being substantive\n- Ask follow-up questions naturally\n- Balance listening with gentle guidance',

      'reflective': '- Ask profound questions and allow silence\n- Use metaphors and imagery\n- Don\'t rush to solutions—sit with complexity',

      'direct': '- Be concise and action-oriented\n- Front-load important information\n- Provide clear, practical next steps'
    }

    return additions[style] || additions['conversational']
  }

  /**
   * Trim prompt while preserving key sections
   */
  private static trimPrompt(prompt: string, maxLength: number): string {
    if (prompt.length <= maxLength) return prompt

    // Find and remove EXAMPLE section first as it's lowest priority
    const exampleStart = prompt.indexOf('ANALOGIES & EXAMPLES:')
    const exampleEnd = prompt.indexOf('USER CONTEXT:', exampleStart)

    if (exampleStart > 0 && exampleEnd > exampleStart) {
      const trimmed = prompt.substring(0, exampleStart) +
        'EXAMPLES: Use relatable, everyday analogies.\n\n' +
        prompt.substring(exampleEnd)

      if (trimmed.length <= maxLength) return trimmed
    }

    // If still too long, truncate at the end
    return prompt.substring(0, maxLength - 50) + '\n\n[Prompt truncated for length]'
  }

  /**
   * Invalidate cached prompts for a user
   */
  static invalidateCache(userId: string): void {
    const modes: InteractionMode[] = ['supportive', 'challenge', 'celebrate', 'crisis']
    modes.forEach(mode => {
      promptCache.delete(getCacheKey(userId, mode))
    })
  }

  /**
   * Get quick summary of user's preferred style
   */
  static getStyleSummary(profile: UserProfile): string {
    return `${profile.communicationStyle} style, ${profile.ageGroup} age group, ${profile.lifeStage} life stage`
  }
}
