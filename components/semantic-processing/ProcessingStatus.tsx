"use client"

import * as React from "react"
import { CheckIcon, LoaderIcon, AlertCircleIcon } from "lucide-react"
import { Card } from "@/components/ui/Card"
import { Progress } from "@/components/ui/Progress"
import { Badge } from "@/components/ui/Badge"

interface ProcessingStatusProps {
  isProcessing: boolean
  progress: number
  currentStep: string
  error: string | null
  chunksGenerated?: number
  embeddingsStored?: number
}

export function ProcessingStatus({
  isProcessing,
  progress,
  currentStep,
  error,
  chunksGenerated,
  embeddingsStored
}: ProcessingStatusProps) {
  if (!isProcessing && !error && progress === 0) {
    return null
  }

  return (
    <Card className="bg-sidebar-accent border-sidebar-border p-4">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          {error ? (
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
              <AlertCircleIcon className="h-4 w-4 text-white" />
            </div>
          ) : progress === 100 && !isProcessing ? (
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <CheckIcon className="h-4 w-4 text-white" />
            </div>
          ) : (
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <LoaderIcon className="h-4 w-4 text-white animate-spin" />
            </div>
          )}
          
          <div className="flex-1">
            <h4 className="text-sidebar-foreground font-medium">
              {error ? 'Processing Failed' : progress === 100 && !isProcessing ? 'Processing Complete' : 'Processing Content'}
            </h4>
            <p className="text-sidebar-foreground/70 text-sm">
              {error || currentStep}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        {!error && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-sidebar-foreground/60">
              <span>{progress}% complete</span>
              {isProcessing && <span>Processing...</span>}
            </div>
          </div>
        )}

        {/* Stats */}
        {(chunksGenerated || embeddingsStored) && (
          <div className="flex gap-2">
            {chunksGenerated && (
              <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                {chunksGenerated} chunks
              </Badge>
            )}
            {embeddingsStored && (
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                {embeddingsStored} embeddings
              </Badge>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
