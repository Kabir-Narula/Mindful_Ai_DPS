import OpenAI from 'openai'

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Centralized Model Constants
// High reasoning for complex tasks (Pattern detection, CBT reframing)
export const GPT_MODEL_REASONING = 'gpt-4' 
// Fast model for chat and simple feedback
export const GPT_MODEL_FAST = 'gpt-4o-mini' // Cost effective
// Balanced model for general analysis
export const GPT_MODEL_STANDARD = 'gpt-4o'

export interface ChatContext {
  recentMoods: Array<{ moodScore: number; createdAt: Date }>
  recentEntries: Array<{ title: string; moodRating: number; createdAt: Date }>
  userName?: string
  journalEntry?: {
    id: string
    title: string
    content: string
    moodRating: number
    sentimentLabel: string | null
    feedback: string | null
  }
}

export async function getChatResponse(
  userMessage: string,
  context: ChatContext,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  userProfile: any | null, // Using any to avoid circular dependency if needed, but preferably UserProfile
  userContext?: string  // NEW: Rich context from UserContextService
): Promise<string> {
  try {
    // Build context summary
    const avgMood = context.recentMoods.length > 0
      ? context.recentMoods.reduce((sum, m) => sum + m.moodScore, 0) / context.recentMoods.length
      : null

    let journalEntryContext = ''
    if (context.journalEntry) {
      journalEntryContext = `
The user wants to discuss a specific journal entry:
- Title: "${context.journalEntry.title}"
- Content: "${context.journalEntry.content}"
- Mood Rating: ${context.journalEntry.moodRating}/10
- Sentiment: ${context.journalEntry.sentimentLabel || 'neutral'}
${context.journalEntry.feedback ? `- Previous AI Feedback: "${context.journalEntry.feedback}"` : ''}

Please reference this entry in your responses and help them reflect on it. Ask thoughtful questions about their feelings, what they learned, or how they can grow from this experience.
`.trim()
    }

    // 1. Determine System Persona
    let systemPrompt = `You are a supportive, empathetic mental health companion. Your role is to:
- Listen without judgment
- Provide emotional support and validation
- Help users reflect on their feelings
- Suggest small, realistic steps to improve wellbeing
- Reframe negative thoughts in a constructive way`

    if (userProfile) {
      // Dynamic import to avoid circular dependencies if they exist
      const { PersonalizationService } = await import('@/lib/personalization-service')
      // Use 'supportive' as default but allow for variety in future
      systemPrompt = PersonalizationService.generateSystemPrompt(userProfile, 'supportive')
    }

    const contextPrompt = `
${systemPrompt}

User context:
${avgMood !== null ? `- Average mood recently: ${avgMood.toFixed(1)}/10` : '- No recent mood data'}
${context.recentEntries.length > 0 ? `- Recent journal entries: ${context.recentEntries.length}` : '- No recent journal entries'}
${context.userName ? `- User name: ${context.userName}` : ''}
${journalEntryContext}

${userContext || ''}

Be warm, genuine, and helpful. Keep responses concise but meaningful.
`.trim()

    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: contextPrompt },
      ...conversationHistory.slice(-6), // Keep last 6 messages for context
      { role: 'user', content: userMessage },
    ]

    const response = await openai.chat.completions.create({
      model: GPT_MODEL_STANDARD, // Use Standard for chat
      messages,
      temperature: 0.8,
      max_tokens: 300,
    })

    return response.choices[0]?.message?.content || 'I\'m here to listen. How are you feeling?'
  } catch (error) {
    console.error('Chat response error:', error)
    return 'I\'m having trouble connecting right now. But I\'m here for you. Would you like to try again?'
  }
}
