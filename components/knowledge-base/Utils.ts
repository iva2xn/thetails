import { DataItem, FilterState } from './Types'
import { MOCK_REPORT_COUNTS } from './Constants'

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const formatDate = (dateString: string, mobile = false): string => {
  const date = new Date(dateString)
  if (mobile) {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }
  return date.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  })
}

export const getReportCount = (id: string): number => {
  return MOCK_REPORT_COUNTS[id] || Math.floor(Math.random() * 50) + 1
}

export const getPriorityFromMetadata = (metadata: Record<string, any>): 'high' | 'medium' | 'low' => {
  return metadata.priority || 'medium'
}

export const filterAndSortData = (data: DataItem[], filters: FilterState): DataItem[] => {
  let filtered = data

  // Apply search filter
  if (filters.search) {
    const searchLower = filters.search.toLowerCase()
    filtered = filtered.filter(item =>
      item.title.toLowerCase().includes(searchLower) ||
      item.description?.toLowerCase().includes(searchLower) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchLower))
    )
  }

  // Apply type filter
  filtered = filtered.filter(item => item.type === filters.type)

  // Apply sorting
  filtered.sort((a, b) => {
    switch (filters.sortBy) {
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      case 'title':
        return a.title.localeCompare(b.title)
      case 'newest':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
  })

  return filtered
}
