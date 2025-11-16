import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface SentimentAnalysis {
  score: number // -1 to 1
  label: 'positive' | 'neutral' | 'negative'
  feedback: string
}

export async function analyzeSentiment(content: string, title: string): Promise<SentimentAnalysis> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are an empathetic mental health assistant analyzing journal entries. 
          Provide a sentiment score from -1 (very negative) to 1 (very positive), 
          a label (positive/neutral/negative), and brief empathetic feedback (2-3 sentences).
          Format your response as JSON: {"score": number, "label": string, "feedback": string}`
        },
        {
          role: 'user',
          content: `Analyze this journal entry:\n\nTitle: ${title}\n\nContent: ${content}`
        }
      ],
      temperature: 0.7,
    })

    const result = response.choices[0]?.message?.content
    if (!result) throw new Error('No response from OpenAI')

    const parsed = JSON.parse(result)
    return {
      score: Math.max(-1, Math.min(1, parsed.score)),
      label: parsed.label,
      feedback: parsed.feedback,
    }
  } catch (error) {
    console.error('Sentiment analysis error:', error)
    // Fallback to neutral
    return {
      score: 0,
      label: 'neutral',
      feedback: 'Thank you for sharing your thoughts. Keep journaling to track your emotional journey.',
    }
  }
}

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
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
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

    const contextPrompt = `
You are a supportive, empathetic mental health companion. Your role is to:
- Listen without judgment
- Provide emotional support and validation
- Help users reflect on their feelings
- Suggest small, realistic steps to improve wellbeing
- Reframe negative thoughts in a constructive way

User context:
${avgMood !== null ? `- Average mood recently: ${avgMood.toFixed(1)}/10` : '- No recent mood data'}
${context.recentEntries.length > 0 ? `- Recent journal entries: ${context.recentEntries.length}` : '- No recent journal entries'}
${context.userName ? `- User name: ${context.userName}` : ''}
${journalEntryContext}

Be warm, genuine, and helpful. Keep responses concise but meaningful.
`.trim()

    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: contextPrompt },
      ...conversationHistory.slice(-6), // Keep last 6 messages for context
      { role: 'user', content: userMessage },
    ]

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
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

