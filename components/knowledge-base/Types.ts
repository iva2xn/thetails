export interface DataItem {
  id: string
  title: string
  description: string | null
  content: string | null
  file_url: string | null
  file_name: string | null
  file_size: number | null
  type: 'context' | 'issue' | 'inquiry' | 'product'
  tags: string[]
  metadata: Record<string, any>
  user_id: string
  project_id: string
  created_at: string
  updated_at: string
}

export type DataType = 'context' | 'issue' | 'inquiry' | 'product'

export interface FilterState {
  search: string
  type: DataType
  sortBy: 'newest' | 'oldest' | 'title'
}

export interface CreateDataFormData {
  title: string
  description: string
  content: string
  type: DataType
  tags: string[]
  metadata: Record<string, any>
  project_id?: string
}