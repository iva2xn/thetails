"use client"

import * as React from "react"
import { useState } from "react"
import { SearchIcon, FilterIcon, SparklesIcon } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select"
import { useSemanticProcessing } from "@/hooks/use-semantic-processing"
import { ProcessingStatus } from "./ProcessingStatus"

interface SemanticSearchProps {
  projectId: string
  onResultClick?: (result: any) => void
}

export function SemanticSearch({ projectId, onResultClick }: SemanticSearchProps) {
  const [query, setQuery] = useState("")
  const [sourceType, setSourceType] = useState<string>("all")
  const [threshold, setThreshold] = useState(0.4)
  const [results, setResults] = useState<any[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  
  const { state, searchContent } = useSemanticProcessing()

  const handleSearch = async () => {
    if (!query.trim()) return

    try {
      const searchResults = await searchContent(query, projectId, {
        threshold,
        limit: 20,
        sourceType: sourceType === "all" ? undefined : sourceType as any
      })
      
      setResults(searchResults)
      setHasSearched(true)
    } catch (error) {
      console.error('Search failed:', error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const formatSimilarity = (similarity: number) => {
    return `${Math.round(similarity * 100)}%`
  }

  const getSourceTypeColor = (type: string) => {
    switch (type) {
      case 'context':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      case 'issue':
        return 'bg-red-500/10 text-red-500 border-red-500/20'
      case 'inquiry':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20'
      case 'product':
        return 'bg-green-500/10 text-green-500 border-green-500/20'
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
    }
  }

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <SparklesIcon className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-sidebar-foreground">Semantic Search</h3>
        </div>
        
        {/* Search Input */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sidebar-foreground/40" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search your knowledge base semantically..."
              className="pl-10 bg-sidebar border-sidebar-border text-sidebar-foreground"
              disabled={state.isProcessing}
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={!query.trim() || state.isProcessing}
            className="bg-sidebar-foreground text-sidebar hover:bg-sidebar-foreground/90"
          >
            <SearchIcon className="h-4 w-4 mr-2" />
            Search
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 items-center">
          <FilterIcon className="h-4 w-4 text-sidebar-foreground/60" />
          
          <Select value={sourceType} onValueChange={setSourceType}>
            <SelectTrigger className="w-40 bg-sidebar-accent border-sidebar-border text-sidebar-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="context">Context</SelectItem>
              <SelectItem value="issue">Issues</SelectItem>
              <SelectItem value="inquiry">Inquiries</SelectItem>
              <SelectItem value="product">Products</SelectItem>
            </SelectContent>
          </Select>

          <Select value={threshold.toString()} onValueChange={(value) => setThreshold(parseFloat(value))}>
            <SelectTrigger className="w-40 bg-sidebar-accent border-sidebar-border text-sidebar-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0.4">40% similarity</SelectItem>
              <SelectItem value="0.5">50% similarity</SelectItem>
              <SelectItem value="0.6">60% similarity</SelectItem>
              <SelectItem value="0.7">70% similarity</SelectItem>
              <SelectItem value="0.8">80% similarity</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Processing Status */}
      <ProcessingStatus
        isProcessing={state.isProcessing}
        progress={state.progress}
        currentStep={state.currentStep}
        error={state.error}
      />

      {/* Search Results */}
      {hasSearched && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sidebar-foreground font-medium">
              Search Results
            </h4>
            <span className="text-sidebar-foreground/60 text-sm">
              {results.length} results found
            </span>
          </div>

          {results.length > 0 ? (
            <div className="space-y-3">
              {results.map((result, index) => (
                <Card
                  key={index}
                  className="bg-sidebar-accent border-sidebar-border p-4 hover:border-sidebar-foreground/20 transition-colors cursor-pointer"
                  onClick={() => onResultClick?.(result)}
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getSourceTypeColor(result.sourceType)}>
                          {result.sourceType}
                        </Badge>
                        <Badge variant="outline" className="bg-sidebar-foreground/10 text-sidebar-foreground border-sidebar-foreground/20">
                          {formatSimilarity(result.similarity)} match
                        </Badge>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-2">
                      {result.metadata?.summary && (
                        <p className="text-sidebar-foreground font-medium text-sm">
                          {result.metadata.summary}
                        </p>
                      )}
                      <p className="text-sidebar-foreground/70 text-sm line-clamp-3 leading-relaxed">
                        {result.content}
                      </p>
                    </div>

                    {/* Keywords */}
                    {result.metadata?.keywords && result.metadata.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {result.metadata.keywords.slice(0, 5).map((keyword: string, idx: number) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="text-xs bg-sidebar-foreground/5 text-sidebar-foreground/60 border-sidebar-foreground/10"
                          >
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Chunk Info */}
                    {result.metadata?.chunkIndex && (
                      <div className="text-xs text-sidebar-foreground/50">
                        Chunk {result.metadata.chunkIndex} of {result.metadata.totalChunks}
                        {result.metadata.originalTitle && ` from "${result.metadata.originalTitle}"`}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-sidebar-accent border-sidebar-border p-8">
              <div className="text-center">
                <SearchIcon className="h-12 w-12 text-sidebar-foreground/40 mx-auto mb-4" />
                <h4 className="text-sidebar-foreground font-medium mb-2">No results found</h4>
                <p className="text-sidebar-foreground/70 text-sm">
                  Try adjusting your search query or lowering the similarity threshold.
                </p>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
