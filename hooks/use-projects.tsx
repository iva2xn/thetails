import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { slugify } from '@/lib/utils'
import type { Database } from '@/lib/supabase'

type Project = Database['public']['Tables']['projects']['Row']
type ProjectInsert = Database['public']['Tables']['projects']['Insert']
type ProjectUpdate = Database['public']['Tables']['projects']['Update']

interface CachedProjectsData {
  projects: Project[]
  timestamp: number
  userId: string
}

interface UseProjectsReturn {
  projects: Project[]
  loading: boolean
  error: string | null
  createProject: (project: Omit<ProjectInsert, 'user_id'>) => Promise<{ data: Project | null; error: string | null }>
  updateProject: (id: string, updates: ProjectUpdate) => Promise<{ data: Project | null; error: string | null }>
  deleteProject: (id: string) => Promise<{ error: string | null }>
  getProjectBySlug: (slug: string) => Promise<{ data: Project | null; error: string | null }>
  refreshProjects: () => Promise<void>
}

const CACHE_KEY = 'projects_cache'
const CACHE_DURATION = 10 * 60 * 1000 // 10 minutes - longer cache duration
const MIN_LOADING_TIME = 600 // Reduced minimum loading time

// Global cache to persist across component unmounts
let globalProjectsCache: { [userId: string]: { projects: Project[], timestamp: number } } = {}
export function useProjects(): UseProjectsReturn {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>(() => {
    // Initialize with cached data if available
    if (user?.id && globalProjectsCache[user.id]) {
      const cached = globalProjectsCache[user.id]
      if (Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.projects
      }
    }
    return []
  })
  const [loading, setLoading] = useState(() => {
    // Only show loading if we don't have cached data
    if (user?.id && globalProjectsCache[user.id]) {
      const cached = globalProjectsCache[user.id]
      if (Date.now() - cached.timestamp < CACHE_DURATION) {
        return false
      }
    }
    return true
  })
  const [error, setError] = useState<string | null>(null)
  const loadingStartTime = useRef<number>(0)
  const hasFetchedOnce = useRef<boolean>(false)

  const getCachedProjects = (userId: string): Project[] | null => {
    try {
      // Check global cache first
      if (globalProjectsCache[userId]) {
        const cached = globalProjectsCache[userId]
        if (Date.now() - cached.timestamp < CACHE_DURATION) {
          return cached.projects
        }
      }

      // Check localStorage cache
      const cached = localStorage.getItem(CACHE_KEY)
      if (!cached) return null

      const data: CachedProjectsData = JSON.parse(cached)
      
      // Check if cache is valid (same user and not expired)
      if (
        data.userId === userId &&
        Date.now() - data.timestamp < CACHE_DURATION
      ) {
        // Update global cache
        globalProjectsCache[userId] = {
          projects: data.projects,
          timestamp: data.timestamp
        }
        return data.projects
      }
      
      // Remove expired cache
      localStorage.removeItem(CACHE_KEY)
      delete globalProjectsCache[userId]
      return null
    } catch {
      localStorage.removeItem(CACHE_KEY)
      if (userId) delete globalProjectsCache[userId]
      return null
    }
  }

  const setCachedProjects = (projects: Project[], userId: string) => {
    try {
      const timestamp = Date.now()
      
      // Update global cache
      globalProjectsCache[userId] = {
        projects,
        timestamp
      }

      // Update localStorage cache
      const data: CachedProjectsData = {
        projects,
        timestamp,
        userId
      }
      localStorage.setItem(CACHE_KEY, JSON.stringify(data))
    } catch {
      // Ignore cache errors
    }
  }

  const ensureMinimumLoadingTime = async (startTime: number) => {
    const elapsed = Date.now() - startTime
    if (elapsed < MIN_LOADING_TIME) {
      await new Promise(resolve => setTimeout(resolve, MIN_LOADING_TIME - elapsed))
    }
  }

  const fetchProjects = async (forceLoading = false) => {
    if (!user) {
      setProjects([])
      setLoading(false)
      return
    }

    try {
      // Check cache first
      const cachedProjects = getCachedProjects(user.id)
      
      if (cachedProjects) {
        // Use cached data immediately
        setProjects(cachedProjects)
        setLoading(false)
        hasFetchedOnce.current = true
        
        const cacheAge = Date.now() - (globalProjectsCache[user.id]?.timestamp || 0)
        if (cacheAge > CACHE_DURATION / 2) { // Refresh when cache is half expired
          const { data, error: fetchError } = await supabase
            .from('projects')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

          if (!fetchError && data) {
            setProjects(data)
            setCachedProjects(data, user.id)
          }
        }
        return
      }

      // No cache available, show loading and fetch data
      if (!hasFetchedOnce.current || forceLoading) {
        setLoading(true)
        loadingStartTime.current = Date.now()
      }
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (fetchError) {
        throw fetchError
      }

      // Ensure minimum loading time for better UX
      if (!hasFetchedOnce.current || forceLoading) {
        await ensureMinimumLoadingTime(loadingStartTime.current)
      }

      setProjects(data || [])
      setCachedProjects(data || [], user.id)
      hasFetchedOnce.current = true
    } catch (err) {
      if (!hasFetchedOnce.current || forceLoading) {
        await ensureMinimumLoadingTime(loadingStartTime.current)
      }
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const createProject = async (projectData: Omit<ProjectInsert, 'user_id'>) => {
    if (!user) {
      return { data: null, error: 'User not authenticated' }
    }

    try {
      // Generate slug if not provided
      const slug = projectData.slug || slugify(projectData.name)
      
      const { data, error: createError } = await supabase
        .from('projects')
        .insert({
          ...projectData,
          slug,
          user_id: user.id,
        })
        .select()
        .single()

      if (createError) {
        throw createError
      }

      // Update local state and cache
      const newProjects = [data, ...projects]
      setProjects(newProjects)
      setCachedProjects(newProjects, user.id)

      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create project'
      return { data: null, error: errorMessage }
    }
  }

  const updateProject = async (id: string, updates: ProjectUpdate) => {
    try {
      const { data, error: updateError } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (updateError) {
        throw updateError
      }

      // Update local state and cache
      const updatedProjects = projects.map(project => 
        project.id === id ? data : project
      )
      setProjects(updatedProjects)
      setCachedProjects(updatedProjects, user?.id || '')

      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update project'
      return { data: null, error: errorMessage }
    }
  }

  const deleteProject = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)

      if (deleteError) {
        throw deleteError
      }

      // Update local state and cache
      const filteredProjects = projects.filter(project => project.id !== id)
      setProjects(filteredProjects)
      setCachedProjects(filteredProjects, user?.id || '')

      return { error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete project'
      return { error: errorMessage }
    }
  }

  const getProjectBySlug = async (slug: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('projects')
        .select('*')
        .eq('slug', slug)
        .single()

      if (fetchError) {
        throw fetchError
      }

      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch project'
      return { data: null, error: errorMessage }
    }
  }

  const refreshProjects = async () => {
    // Clear cache and force fresh fetch
    if (user) {
      localStorage.removeItem(CACHE_KEY)
      delete globalProjectsCache[user.id]
      hasFetchedOnce.current = false
    }
    await fetchProjects(true)
  }

  useEffect(() => {
    fetchProjects()
  }, [user])

  return {
    projects,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    getProjectBySlug,
    refreshProjects,
  }
}