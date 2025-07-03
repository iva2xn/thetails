export interface SemanticChunk {
  content: string
  summary: string
  keywords: string[]
  chunkIndex: number
  totalChunks: number
}

export class GeminiChunker {
  async chunkContent(content: string, maxWordsPerChunk = 75): Promise<SemanticChunk[]> {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chunk-content`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, maxWordsPerChunk })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data.chunks
    } catch (error) {
      console.error('Error chunking content:', error)
      // Fallback: simple word-based chunking
      return this.fallbackChunking(content, maxWordsPerChunk)
    }
  }

  private fallbackChunking(content: string, maxWords = 75): SemanticChunk[] {
    const words = content.split(/\s+/)
    const chunks: SemanticChunk[] = []
    
    for (let i = 0; i < words.length; i += maxWords) {
      const chunkWords = words.slice(i, i + maxWords)
      const chunkContent = chunkWords.join(' ')
      
      chunks.push({
        content: chunkContent,
        summary: `Chunk ${chunks.length + 1} of content`,
        keywords: this.extractSimpleKeywords(chunkContent),
        chunkIndex: chunks.length + 1,
        totalChunks: Math.ceil(words.length / maxWords)
      })
    }
    
    return chunks
  }

  private extractSimpleKeywords(text: string): string[] {
    // Simple keyword extraction - get meaningful words
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !['this', 'that', 'with', 'have', 'will', 'been', 'from', 'they', 'know', 'want', 'been', 'good', 'much', 'some', 'time', 'very', 'when', 'come', 'here', 'just', 'like', 'long', 'make', 'many', 'over', 'such', 'take', 'than', 'them', 'well', 'were'].includes(word))
    
    // Get unique words and return top 5
    const uniqueWords = [...new Set(words)]
    return uniqueWords.slice(0, 5)
  }
}

export const geminiChunker = new GeminiChunker()