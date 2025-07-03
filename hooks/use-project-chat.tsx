import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface UseProjectChatReturn {
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
  sendMessage: (message: string, projectSlug: string) => Promise<void>
  clearMessages: () => void
}

export function useProjectChat(): UseProjectChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendMessage = useCallback(async (message: string, projectSlug: string) => {
    if (!message.trim() || !projectSlug) return

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

      // Format chat history for the API (excluding the message we just added)
      const chatHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      // Call the chat-query edge function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: message,
          chatHistory,
          projectSlug,
          threshold: 0.4 // Set threshold to 40%
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to get response from AI')
      }

      const data = await response.json()
      
     // Check if this was a knowledge gap and notify the user
     if (data.knowledgeGap) {
       const isIssue = data.knowledgeGapType === 'issue'
       toast.info(`Your ${isIssue ? 'issue' : 'question'} has been logged for future reference.`, {
         duration: 5000,
        position: 'bottom-center',
        icon: isIssue ? '🐛' : '❓'
       })
     }
     
      // Add AI response to chat
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, assistantMessage])

    } catch (err) {
      console.error('Error in project chat:', err)
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
  }, [messages])

  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages
  }
}