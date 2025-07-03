import { useState } from 'react'
import { geminiChunker, SemanticChunk } from '@/lib/gemini'
import { embeddingService, EmbeddingResult } from '@/lib/embeddings'
import { useAuth } from '@/hooks/use-auth'

interface ProcessingState {
  isProcessing: boolean
  progress: number
  currentStep: string
  error: string | null
}

interface UseSemanticProcessingReturn {
  state: ProcessingState
  processContent: (
    content: string,
    sourceId: string,
    sourceType: 'context' | 'issue' | 'inquiry' | 'product',
    projectId: string,
    originalTitle?: string
  ) => Promise<EmbeddingResult[]>
  searchContent: (
    query: string,
    projectId: string,
    options?: {
      threshold?: number // Default changed in implementation
      limit?: number
      sourceType?: 'context' | 'issue' | 'inquiry' | 'product'
    }
  ) => Promise<any[]>
  deleteContentEmbeddings: (sourceId: string, sourceType: string) => Promise<void>
}

export function useSemanticProcessing(): UseSemanticProcessingReturn {
  const { user } = useAuth()
  const [state, setState] = useState<ProcessingState>({
    isProcessing: false,
    progress: 0,
    currentStep: '',
    error: null
  })

  const updateState = (updates: Partial<ProcessingState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }

  const processContent = async (
    content: string,
    sourceId: string,
    sourceType: 'context' | 'issue' | 'inquiry' | 'product',
    projectId: string,
    originalTitle?: string
  ): Promise<EmbeddingResult[]> => {
    if (!user) {
      throw new Error('User must be authenticated')
    }

    try {
      updateState({
        isProcessing: true,
        progress: 0,
        currentStep: 'Analyzing content...',
        error: null
      })

      // Step 1: Semantic chunking
      updateState({
        progress: 20,
        currentStep: 'Breaking content into semantic chunks...'
      })

      const chunks = await geminiChunker.chunkContent(content)

      if (chunks.length === 0) {
        throw new Error('No chunks generated from content')
      }

      // Step 2: Generate embeddings and store
      updateState({
        progress: 50,
        currentStep: `Generating embeddings for ${chunks.length} chunks...`
      })

      const results = await embeddingService.storeChunkEmbeddings(
        chunks,
        sourceId,
        sourceType,
        projectId,
        user.id,
        originalTitle
      )

      updateState({
        progress: 100,
        currentStep: 'Processing complete!',
        isProcessing: false
      })

      return results

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Processing failed'
      updateState({
        isProcessing: false,
        error: errorMessage
      })
      throw error
    }
  }

  const searchContent = async (
    query: string,
    projectId: string,
    options: {
      threshold?: number // Default changed in implementation
      limit?: number
      sourceType?: 'context' | 'issue' | 'inquiry' | 'product'
    } = {}
  ) => {
    if (!user) {
      throw new Error('User must be authenticated')
    }

    try {
      updateState({
        isProcessing: true,
        progress: 50,
        currentStep: 'Searching similar content...',
        error: null
      })

      const {
        threshold = 0.4, // Changed default threshold to 40%
        limit = 10,
        sourceType
      } = options

      const results = await embeddingService.searchSimilar(
        query,
        projectId,
        user.id,
        { threshold, limit, sourceType }
      )

      updateState({
        isProcessing: false,
        progress: 100,
        currentStep: 'Search complete!'
      })

      return results

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Search failed'
      updateState({
        isProcessing: false,
        error: errorMessage
      })
      throw error
    }
  }

  const deleteContentEmbeddings = async (sourceId: string, sourceType: string) => {
    try {
      updateState({
        isProcessing: true,
        progress: 50,
        currentStep: 'Deleting embeddings...',
        error: null
      })

      await embeddingService.deleteEmbeddingsBySource(sourceId, sourceType)

      updateState({
        isProcessing: false,
        progress: 100,
        currentStep: 'Deletion complete!'
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Deletion failed'
      updateState({
        isProcessing: false,
        error: errorMessage
      })
      throw error
    }
  }

  return {
    state,
    processContent,
    searchContent,
    deleteContentEmbeddings
  }
}