import { supabase } from './supabase'
import { SemanticChunk } from './gemini'

export interface EmbeddingResult {
  id: string
  content: string
  embedding: number[]
  metadata: {
    summary: string
    keywords: string[]
    chunkIndex: number
    totalChunks: number
    originalTitle?: string
  }
}

export class EmbeddingService {
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-embedding`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Embedding API error:', errorText)
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      if (!data.embedding || !Array.isArray(data.embedding)) {
        throw new Error('Invalid embedding response format')
      }
      
      return data.embedding
    } catch (error) {
      console.error('Error generating embedding:', error)
      throw new Error('Failed to generate embedding')
    }
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const embeddings = await Promise.all(
        texts.map(text => this.generateEmbedding(text))
      )
      return embeddings
    } catch (error) {
      console.error('Error generating batch embeddings:', error)
      throw new Error('Failed to generate batch embeddings')
    }
  }

  async storeChunkEmbeddings(
    chunks: SemanticChunk[],
    sourceId: string,
    sourceType: 'context' | 'issue' | 'inquiry' | 'product',
    projectId: string,
    userId: string,
    originalTitle?: string
  ): Promise<EmbeddingResult[]> {
    try {
      const results: EmbeddingResult[] = []

      for (const chunk of chunks) {
        // Generate embedding for the chunk content
        const embedding = await this.generateEmbedding(chunk.content)

        // Prepare metadata
        const metadata = {
          summary: chunk.summary,
          keywords: chunk.keywords,
          chunkIndex: chunk.chunkIndex,
          totalChunks: chunk.totalChunks,
          originalTitle
        }

        // Store in database - convert embedding array to PostgreSQL vector format
        const { data, error } = await supabase
          .from('embeddings')
          .insert({
            content: chunk.content,
            embedding: JSON.stringify(embedding), // Let PostgreSQL handle the conversion
            metadata,
            source_type: sourceType,
            source_id: sourceId,
            project_id: projectId,
            user_id: userId
          })
          .select()
          .single()

        if (error) {
          console.error('Error storing embedding:', error)
          throw error
        }

        results.push({
          id: data.id,
          content: chunk.content,
          embedding,
          metadata
        })
      }

      return results
    } catch (error) {
      console.error('Error storing chunk embeddings:', error)
      throw new Error('Failed to store embeddings')
    }
  }

  async searchSimilar(
    query: string,
    projectId: string,
    userId: string,
    options: {
      threshold?: number // Default changed in implementation
      limit?: number
      sourceType?: 'context' | 'issue' | 'inquiry' | 'product'
    } = {}
  ) {
    try {
      const {
        threshold = 0.4, // Changed default threshold to 40%
        limit = 10,
        sourceType
      } = options

      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(query)

      // Use the similarity_search function from the database
      const { data, error } = await supabase.rpc('similarity_search', {
        query_embedding: JSON.stringify(queryEmbedding), // Convert to JSON string
        match_threshold: threshold,
        match_count: limit,
        filter_project_id: projectId,
        filter_user_id: userId
      })

      if (error) {
        console.error('Error searching embeddings:', error)
        throw error
      }

      // Filter by source type if specified
      let results = data || []
      if (sourceType) {
        results = results.filter((item: any) => item.source_type === sourceType)
      }

      return results.map((item: any) => ({
        id: item.id,
        content: item.content,
        similarity: item.similarity,
        metadata: item.metadata,
        sourceType: item.source_type,
        sourceId: item.source_id
      }))

    } catch (error) {
      console.error('Error performing similarity search:', error)
      throw new Error('Failed to search embeddings')
    }
  }

  async deleteEmbeddingsBySource(sourceId: string, sourceType: string) {
    try {
      const { error } = await supabase
        .from('embeddings')
        .delete()
        .eq('source_id', sourceId)
        .eq('source_type', sourceType)

      if (error) {
        console.error('Error deleting embeddings:', error)
        throw error
      }
    } catch (error) {
      console.error('Error deleting embeddings by source:', error)
      throw new Error('Failed to delete embeddings')
    }
  }
}

export const embeddingService = new EmbeddingService()