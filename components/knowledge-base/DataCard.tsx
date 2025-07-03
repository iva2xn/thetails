"use client"

import * as React from "react"
import { 
  CalendarIcon, 
  TagIcon, 
  FileIcon, 
  ArrowUpIcon, 
  MessageSquareIcon, 
  ShareIcon,
  TrendingUpIcon,
  UserIcon
} from "lucide-react"
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { DataType, DataItem } from './Types'
import { DATA_TYPES, PRIORITY_LEVELS } from './Constants'
import { formatFileSize, formatDate, getReportCount, getPriorityFromMetadata } from './Utils'

interface DataCardProps {
  item: DataItem
  onEdit?: (item: DataItem) => void
  onDelete?: (id: string, type: DataType) => void
}

export function DataCard({ item, onEdit, onDelete }: DataCardProps) {
  const typeConfig = DATA_TYPES.find(t => t.id === item.type)
  const TypeIcon = typeConfig?.icon || FileIcon

  const renderContextCard = () => (
    <Card className="bg-sidebar-accent border-sidebar-border hover:border-sidebar-foreground/20 transition-all duration-200 cursor-pointer overflow-hidden">
      <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center flex-shrink-0">
              <UserIcon className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-sidebar-foreground/70 truncate">
                community
              </p>
            </div>
          </div>
          <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-xs flex-shrink-0">
            {typeConfig?.name}
          </Badge>
        </div>

        {/* Title */}
        <h3 className="text-base sm:text-lg font-semibold text-sidebar-foreground line-clamp-2 sm:line-clamp-3 leading-tight font-general">
          {item.title}
        </h3>

        {/* Dates */}
        <div className="space-y-1 text-xs sm:text-sm text-sidebar-foreground/60">
          <div className="flex items-center gap-1 sm:gap-2">
            <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            <span>{formatDate(item.created_at, true)}</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            <span>{formatDate(item.updated_at, true)}</span>
          </div>
        </div>

        {/* Description */}
        {item.description && (
          <p className="text-xs sm:text-sm text-sidebar-foreground/70 line-clamp-2 sm:line-clamp-3 leading-relaxed">
            {item.description}
          </p>
        )}

        {/* Tags */}
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 sm:gap-2">
            {item.tags.slice(0, 3).map((tag, index) => (
              <Badge
                key={index}
                variant="outline"
                className="text-xs bg-sidebar-foreground/5 text-sidebar-foreground/60 border-sidebar-foreground/10 max-w-[80px] truncate"
              >
                {tag}
              </Badge>
            ))}
            {item.tags.length > 3 && (
              <Badge variant="outline" className="text-xs bg-sidebar-foreground/5 text-sidebar-foreground/60 border-sidebar-foreground/10">
                +{item.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="border-t border-sidebar-border p-3 sm:p-4 bg-sidebar-accent/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-sidebar-foreground/60">
            <div className="flex items-center gap-1 hover:text-sidebar-foreground transition-colors cursor-pointer">
              <ArrowUpIcon className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Upvote</span>
            </div>
            <div className="flex items-center gap-1 hover:text-sidebar-foreground transition-colors cursor-pointer">
              <MessageSquareIcon className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Reply</span>
            </div>
            <div className="flex items-center gap-1 hover:text-sidebar-foreground transition-colors cursor-pointer">
              <ShareIcon className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Share</span>
            </div>
          </div>
          <Badge variant="outline" className="bg-sidebar-foreground/10 text-sidebar-foreground/70 border-sidebar-foreground/20 text-xs">
            {item.tags[0] || 'General'}
          </Badge>
        </div>
      </div>
    </Card>
  )

  const renderIssueCard = () => {
    const reportCount = getReportCount(item.id)
    const priority: keyof typeof PRIORITY_LEVELS = item.type === 'issue' ? ((item as any).severity || 'medium') : 'medium'
    const priorityConfig = PRIORITY_LEVELS[priority]
    const PriorityIcon = priorityConfig.icon

    return (
      <Card className={`bg-sidebar-accent border-l-4 ${priorityConfig.color.split(' ')[0]} hover:border-sidebar-foreground/20 transition-all duration-200 cursor-pointer overflow-hidden`}>
        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
          {/* Header with badges and report count */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="bg-sidebar-foreground/10 text-sidebar-foreground border-sidebar-foreground/20 text-xs">
                <TypeIcon className="h-3 w-3 mr-1" />
                Issue
              </Badge>
              <Badge className={`${priorityConfig.color} text-xs`}>
                <PriorityIcon className="h-3 w-3 mr-1" />
                <span className="sm:hidden">{priority.charAt(0).toUpperCase()}</span>
                <span className="hidden sm:inline">{priority}</span>
              </Badge>
            </div>
            <div className="flex items-center gap-1 text-xs sm:text-sm text-sidebar-foreground/60 flex-shrink-0">
              <TrendingUpIcon className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="font-medium">{reportCount}</span>
              <span className="hidden xs:inline">reports</span>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-base sm:text-lg font-semibold text-sidebar-foreground line-clamp-2 sm:line-clamp-3 leading-tight font-general">
            {item.title}
          </h3>

          {/* Description */}
          {item.description && (
            <p className="text-xs sm:text-sm text-sidebar-foreground/70 line-clamp-2 sm:line-clamp-3 leading-relaxed">
              {item.description}
            </p>
          )}

          {/* Footer with dates and status */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 pt-2 border-t border-sidebar-border">
            <div className="flex items-center gap-1 sm:gap-2 text-xs text-sidebar-foreground/60">
              <CalendarIcon className="h-3 w-3 flex-shrink-0" />
              <span>Reported {formatDate(item.created_at, true)}</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 text-xs text-sidebar-foreground/60">
              <TrendingUpIcon className="h-3 w-3 flex-shrink-0" />
              <span>Active</span>
              <span className="text-sidebar-foreground/40">#{item.id.slice(-6)}</span>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  const renderGenericCard = () => (
    <Card className="bg-sidebar-accent border-sidebar-border hover:border-sidebar-foreground/20 transition-all duration-200 cursor-pointer overflow-hidden">
      <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <TypeIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base sm:text-lg font-semibold text-sidebar-foreground line-clamp-1 sm:line-clamp-2 leading-tight font-general">
                {item.title}
              </h3>
              <p className="text-xs sm:text-sm text-sidebar-foreground/60 mt-1">
                {formatDate(item.created_at, true)}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-xs flex-shrink-0">
            {typeConfig?.name}
          </Badge>
        </div>

        {/* Description */}
        {item.description && (
          <p className="text-xs sm:text-sm text-sidebar-foreground/70 line-clamp-2 sm:line-clamp-3 leading-relaxed">
            {item.description}
          </p>
        )}

        {/* File info */}
        {item.file_url && (
          <div className="flex items-center gap-2 p-2 sm:p-3 bg-sidebar border border-sidebar-border rounded-lg">
            <FileIcon className="h-4 w-4 sm:h-5 sm:w-5 text-sidebar-foreground/60 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-sidebar-foreground truncate">
                {item.file_name}
              </p>
              {item.file_size && (
                <p className="text-xs text-sidebar-foreground/60">
                  {formatFileSize(item.file_size)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Tags */}
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 sm:gap-2">
            <TagIcon className="h-3 w-3 sm:h-4 sm:w-4 text-sidebar-foreground/40 flex-shrink-0 mt-0.5" />
            {item.tags.slice(0, 3).map((tag, index) => (
              <Badge
                key={index}
                variant="outline"
                className="text-xs bg-sidebar-foreground/5 text-sidebar-foreground/60 border-sidebar-foreground/10 max-w-[80px] truncate"
              >
                {tag}
              </Badge>
            ))}
            {item.tags.length > 3 && (
              <Badge variant="outline" className="text-xs bg-sidebar-foreground/5 text-sidebar-foreground/60 border-sidebar-foreground/10">
                +{item.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </div>
    </Card>
  )

  // Render different card types based on data type
  switch (item.type) {
    case 'inquiry':
      return renderContextCard()
    case 'issue':
      return renderIssueCard()
    default:
      return renderGenericCard()
  }
}
