import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { useSemanticProcessing } from '@/hooks/use-semantic-processing'
import type { Database } from '@/lib/supabase'

// Union types for all data items
type ContextItem = Database['public']['Tables']['contexts']['Row'] & { type: 'context' }
type IssueItem = Database['public']['Tables']['issues']['Row'] & { type: 'issue'; metadata: { severity: string; status: string } }
type InquiryItem = Database['public']['Tables']['inquiries']['Row'] & { type: 'inquiry' }
type ProductItem = Database['public']['Tables']['products']['Row'] & { type: 'product'; metadata: { price?: number; affiliateLink?: string } }

type DataItem = ContextItem | IssueItem | InquiryItem | ProductItem

type ContextInsert = Database['public']['Tables']['contexts']['Insert']
type IssueInsert = Database['public']['Tables']['issues']['Insert']
type InquiryInsert = Database['public']['Tables']['inquiries']['Insert']
type ProductInsert = Database['public']['Tables']['products']['Insert']

type ContextUpdate = Database['public']['Tables']['contexts']['Update']
type IssueUpdate = Database['public']['Tables']['issues']['Update']
type InquiryUpdate = Database['public']['Tables']['inquiries']['Update']
type ProductUpdate = Database['public']['Tables']['products']['Update']

type DataType = 'context' | 'issue' | 'inquiry' | 'product'

interface CreateDataInput {
  title: string
  description?: string
  content?: string
  file_url?: string
  file_name?: string
  file_size?: number
  type: DataType
  tags?: string[]
  metadata?: Record<string, any>
  project_id: string
}

interface UseDataReturn {
  data: DataItem[]
  loading: boolean
  error: string | null
  createData: (data: CreateDataInput) => Promise<{ data: DataItem | null; error: string | null }>
  updateData: (id: string, type: DataType, updates: any) => Promise<{ data: DataItem | null; error: string | null }>
  deleteData: (id: string) => Promise<{ error: string | null }>
  getDataByProject: (projectId: string, type?: DataType) => Promise<{ data: DataItem[] | null; error: string | null }>
  refreshData: () => Promise<void>
}

const getTableName = (type: DataType): string => {
  switch (type) {
    case 'context': return 'contexts'
    case 'issue': return 'issues'
    case 'inquiry': return 'inquiries'
    case 'product': return 'products'
  }
}

const transformToDataItem = (item: any, type: DataType): DataItem => {
  const baseItem = { ...item, type }
  
  switch (type) {
    case 'issue':
      return {
        ...baseItem,
        metadata: {
          severity: item.severity,
          status: item.status
        }
      } as IssueItem
    case 'product':
      return {
        ...baseItem,
        metadata: {
          price: item.price,
          affiliateLink: item.affiliate_link
        }
      } as ProductItem
    default:
      return baseItem as DataItem
  }
}

export function useData(projectId?: string, type?: DataType): UseDataReturn {
  const { user } = useAuth()
  const { processContent, deleteContentEmbeddings } = useSemanticProcessing()
  const [data, setData] = useState<DataItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    if (!user) {
      setData([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      let allData: DataItem[] = []
      
      const typesToFetch = type ? [type] : ['context', 'issue', 'inquiry', 'product'] as DataType[]
      
      for (const dataType of typesToFetch) {
        const tableName = getTableName(dataType)
        let query = supabase
          .from(tableName as any)
          .select('*')
          .eq('user_id', user.id)

        // Filter by project if provided
        if (projectId) {
          query = query.eq('project_id', projectId)
        }

        const { data: fetchedData, error: fetchError } = await query
          .order('created_at', { ascending: false })

        if (fetchError) {
          throw fetchError
        }

        if (fetchedData) {
          const transformedData = fetchedData.map(item => transformToDataItem(item, dataType))
          allData = [...allData, ...transformedData]
        }
      }

      // Sort all data by created_at
      allData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setData(allData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const createData = async (dataInput: CreateDataInput) => {
    if (!user) {
      return { data: null, error: 'User not authenticated' }
    }

    try {
      const tableName = getTableName(dataInput.type)
      let insertData: any = {
        title: dataInput.title,
        description: dataInput.description,
        file_url: dataInput.file_url,
        file_name: dataInput.file_name,
        file_size: dataInput.file_size,
        tags: dataInput.tags || [],
        user_id: user.id,
        project_id: dataInput.project_id
      }

      // Add type-specific fields
      switch (dataInput.type) {
        case 'context':
          insertData.content = dataInput.content
          break
        case 'issue':
          insertData.severity = dataInput.metadata?.severity || 'medium'
          insertData.status = dataInput.metadata?.status || 'open'
          break
        case 'inquiry':
          insertData.description = dataInput.description || '' // Required for inquiries
          insertData.content = dataInput.content
          break
        case 'product':
          insertData.price = dataInput.metadata?.price
          insertData.affiliate_link = dataInput.metadata?.affiliateLink
          break
      }

      const { data: createdData, error: createError } = await supabase
        .from(tableName as any)
        .insert(insertData)
        .select()
        .single()

      if (createError) {
        throw createError
      }

      // Update local state
      const transformedData = transformToDataItem(createdData, dataInput.type)
      setData(prev => [transformedData, ...prev])

      // Process content for semantic search if there's meaningful content
      const contentToProcess = dataInput.content || dataInput.description
      if (contentToProcess && contentToProcess.length > 50) {
        try {
          await processContent(contentToProcess, createdData.id, dataInput.type, dataInput.project_id, dataInput.title)
        } catch (embeddingError) {
          console.warn('Failed to process embeddings:', embeddingError)
        }
      }

      return { data: transformedData, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create data'
      return { data: null, error: errorMessage }
    }
  }

  const updateData = async (id: string, type: DataType, updates: any) => {
    try {
      const tableName = getTableName(type)
      let updateData: any = { ...updates }

      // Transform metadata back to specific fields for issues and products
      if (type === 'issue' && updates.metadata) {
        updateData.severity = updates.metadata.severity
        updateData.status = updates.metadata.status
        delete updateData.metadata
      } else if (type === 'product' && updates.metadata) {
        updateData.price = updates.metadata.price
        updateData.affiliate_link = updates.metadata.affiliateLink
        delete updateData.metadata
      }

      const { data: updatedData, error: updateError } = await supabase
        .from(tableName as any)
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (updateError) {
        throw updateError
      }

      // Update local state
      const transformedData = transformToDataItem(updatedData, type)
      setData(prev => 
        prev.map(item => 
          item.id === id ? transformedData : item
        )
      )

      return { data: transformedData, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update data'
      return { data: null, error: errorMessage }
    }
  }

  const deleteData = async (id: string, type?: DataType) => {
    try {
      // If type is not provided, find it from current data
      const itemType = type || data.find(item => item.id === id)?.type
      
      if (!itemType) {
        throw new Error('Cannot determine data type for deletion')
      }

      const tableName = getTableName(itemType)
      const { error: deleteError } = await supabase
        .from(tableName as any)
        .delete()
        .eq('id', id)

      if (deleteError) {
        throw deleteError
      }

      // Delete associated embeddings
      try {
        await deleteContentEmbeddings(id, itemType)
      } catch (embeddingError) {
        console.warn('Failed to delete embeddings:', embeddingError)
      }

      // Update local state
      setData(prev => prev.filter(item => item.id !== id))

      return { error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete data'
      return { error: errorMessage }
    }
  }

  const getDataByProject = async (projectId: string, type?: DataType) => {
    try {
      let allData: DataItem[] = []
      
      const typesToFetch = type ? [type] : ['context', 'issue', 'inquiry', 'product'] as DataType[]
      
      for (const dataType of typesToFetch) {
        const tableName = getTableName(dataType)
        const { data: fetchedData, error: fetchError } = await supabase
          .from(tableName as any)
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })

        if (fetchError) {
          throw fetchError
        }

        if (fetchedData) {
          const transformedData = fetchedData.map(item => transformToDataItem(item, dataType))
          allData = [...allData, ...transformedData]
        }
      }

      // Sort all data by created_at
      allData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      return { data: allData, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data'
      return { data: null, error: errorMessage }
    }
  }

  const refreshData = async () => {
    await fetchData()
  }

  useEffect(() => {
    fetchData()
  }, [user, projectId, type])

  return {
    data,
    loading,
    error,
    createData,
    updateData,
    deleteData,
    getDataByProject,
    refreshData,
  }
}