import { useState } from 'react'
import { useSemanticProcessing } from '@/hooks/use-semantic-processing'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface UseAIChatReturn {
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
  sendMessage: (message: string, projectId: string) => Promise<void>
  clearMessages: () => void
}

export function useAIChat(): UseAIChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { searchContent } = useSemanticProcessing()

  const sendMessage = async (message: string, projectId: string) => {
    if (!message.trim() || !projectId) return

    try {
      setError(null)
      setIsLoading(true)

      // Add user message to chat
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: message,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, userMessage])

      // Search for relevant content
      const searchResults = await searchContent(message, projectId, {
        threshold: 0.4, // Lowered threshold to 40%
        limit: 5
      })

      // Call Gemini API to generate response
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-response`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: message,
          context: searchResults.map(result => result.content).join('\n\n'),
          chatHistory: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        })
      })

      if (!response.ok) {
        throw new Error(`Error generating response: ${response.statusText}`)
      }

      const responseData = await response.json()
      
      // Add AI response to chat
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseData.response || "I'm sorry, I couldn't generate a response at this time.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, assistantMessage])

    } catch (err) {
      console.error('Error in AI chat:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
      
      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error while processing your request. Please try again later.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const clearMessages = () => {
    setMessages([])
    setError(null)
  }

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages
  }
}