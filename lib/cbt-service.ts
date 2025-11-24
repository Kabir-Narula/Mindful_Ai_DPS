import { openai, GPT_MODEL_REASONING } from './openai'
import { prisma } from './prisma'
import { PersonalizationService } from './personalization-service'
import { anonymizeText, parseAIJSON } from '@/lib/utils'

export class CBTService {
  /**
   * Step 1: Validate if the thought is suitable for challenging
   * (e.g., negative self-talk, cognitive distortions)
   */
  static async validateThought(thought: string): Promise<{ isValid: boolean; reason?: string }> {
    try {
      // Anonymize before sending to AI
      const safeThought = anonymizeText(thought)

      const response = await openai.chat.completions.create({
        model: GPT_MODEL_REASONING,
        messages: [
          {
            role: 'system',
            content: `You are a CBT therapist. Analyze if the user's thought contains a cognitive distortion (e.g., all-or-nothing thinking, catastrophizing) and is suitable for a thought record.
            
            CRITICAL: Err on the side of "isValid: true". Only reject if the thought is completely gibberish, a positive affirmation, or a simple fact with no emotion.
            If it's borderline, accept it.
            
            Return JSON: { "isValid": boolean, "reason": string }`
          },
          { role: 'user', content: safeThought }
        ],
        temperature: 0.3,
      })

      return parseAIJSON(response.choices[0]?.message?.content || '{}', { isValid: true })
    } catch (error) {
      console.error('CBT validation error:', error)
      return { isValid: true } // Default to allowing it if AI fails
    }
  }

  /**
   * Step 2: Generate personalized questions to challenge the thought
   */
  static async generateChallengeQuestions(thought: string, userId: string): Promise<string[]> {
    const profile = await prisma.userProfile.findUnique({ where: { userId } })
    const safeThought = anonymizeText(thought)
    
    // Default questions if profile missing
    if (!profile) {
      return [
        "What evidence do you have that this thought is true?",
        "What evidence suggests it might not be true?",
        "What would you tell a friend in this situation?"
      ]
    }

    // Use 'challenge' mode for CBT exercises naturally
    const systemPrompt = PersonalizationService.generateSystemPrompt(profile, 'challenge')
    
    const response = await openai.chat.completions.create({
      model: GPT_MODEL_REASONING,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `The user has this negative thought: "${safeThought}"
          Generate 3 brief, empathetic, but probing questions to help them challenge this thought using CBT techniques.
          Format as a JSON array of strings.`
        }
      ],
      temperature: 0.7,
    })

    return parseAIJSON(response.choices[0]?.message?.content || '[]', [
        "What makes you feel this is 100% true?",
        "Is there another way to look at this?",
        "How does this thought help you right now?"
    ])
  }

  /**
   * Step 3: Generate a reframe based on user's answers
   */
  static async generateReframe(
    thought: string,
    answers: { question: string; answer: string }[],
    userId: string
  ): Promise<string> {
    const profile = await prisma.userProfile.findUnique({ where: { userId } })
    // Default to supportive for the final reframe
    const systemPrompt = profile ? PersonalizationService.generateSystemPrompt(profile, 'supportive') : 'You are a helpful therapist.'

    const conversationContext = answers.map(a => `Q: ${a.question}\nA: ${a.answer}`).join('\n\n')

    const response = await openai.chat.completions.create({
      model: GPT_MODEL_REASONING,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Original Negative Thought: "${anonymizeText(thought)}"
          
          User's Reflection:
          ${anonymizeText(conversationContext)}
          
          Based on their reflection, suggest a healthier, more balanced "Reframed Thought" that is realistic (not toxic positivity). Keep it to 1-2 sentences.`
        }
      ],
      temperature: 0.7,
    })

    return response.choices[0]?.message?.content || "I'm doing my best, and that's enough."
  }

  /**
   * Save the completed exercise
   */
  static async saveExercise(userId: string, data: {
    originalThought: string
    reframedThought: string
    conversation: any
  }) {
    return await prisma.therapyExercise.create({
      data: {
        userId,
        type: 'thought-challenging',
        originalThought: data.originalThought,
        reframedThought: data.reframedThought,
        conversation: data.conversation,
      }
    })
  }
}
