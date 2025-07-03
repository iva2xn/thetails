import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      contexts: {
        Row: {
          id: string
          title: string
          description: string | null
          content: string | null
          file_url: string | null
          file_name: string | null
          file_size: number | null
          tags: string[]
          user_id: string
          project_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          content?: string | null
          file_url?: string | null
          file_name?: string | null
          file_size?: number | null
          tags?: string[]
          user_id: string
          project_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          content?: string | null
          file_url?: string | null
          file_name?: string | null
          file_size?: number | null
          tags?: string[]
          user_id?: string
          project_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      issues: {
        Row: {
          id: string
          title: string
          description: string | null
          severity: 'low' | 'medium' | 'high' | 'critical'
          status: 'open' | 'in-progress' | 'resolved' | 'closed'
          file_url: string | null
          file_name: string | null
          file_size: number | null
          tags: string[]
          user_id: string
          project_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          severity?: 'low' | 'medium' | 'high' | 'critical'
          status?: 'open' | 'in-progress' | 'resolved' | 'closed'
          file_url?: string | null
          file_name?: string | null
          file_size?: number | null
          tags?: string[]
          user_id: string
          project_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          severity?: 'low' | 'medium' | 'high' | 'critical'
          status?: 'open' | 'in-progress' | 'resolved' | 'closed'
          file_url?: string | null
          file_name?: string | null
          file_size?: number | null
          tags?: string[]
          user_id?: string
          project_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      inquiries: {
        Row: {
          id: string
          title: string
          description: string
          content: string | null
          file_url: string | null
          file_name: string | null
          file_size: number | null
          tags: string[]
          user_id: string
          project_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          content?: string | null
          file_url?: string | null
          file_name?: string | null
          file_size?: number | null
          tags?: string[]
          user_id: string
          project_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          content?: string | null
          file_url?: string | null
          file_name?: string | null
          file_size?: number | null
          tags?: string[]
          user_id?: string
          project_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          title: string
          description: string | null
          price: number | null
          affiliate_link: string | null
          file_url: string | null
          file_name: string | null
          file_size: number | null
          tags: string[]
          user_id: string
          project_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          price?: number | null
          affiliate_link?: string | null
          file_url?: string | null
          file_name?: string | null
          file_size?: number | null
          tags?: string[]
          user_id: string
          project_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          price?: number | null
          affiliate_link?: string | null
          file_url?: string | null
          file_name?: string | null
          file_size?: number | null
          tags?: string[]
          user_id?: string
          project_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          name: string
          description: string
          plan: 'personal' | 'creator' | 'business'
          social_links: Record<string, any> | null
          user_id: string
          slug: string
          is_public: boolean
          custom_slug: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          plan?: 'personal' | 'creator' | 'business'
          social_links?: Record<string, any> | null
          user_id: string
          slug?: string
          is_public?: boolean
          custom_slug?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          plan?: 'personal' | 'creator' | 'business'
          social_links?: Record<string, any> | null
          user_id?: string
          slug?: string
          is_public?: boolean
          custom_slug?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      data: {
        Row: {
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
        Insert: {
          id?: string
          title: string
          description?: string | null
          content?: string | null
          file_url?: string | null
          file_name?: string | null
          file_size?: number | null
          type: 'context' | 'issue' | 'inquiry' | 'product'
          tags?: string[]
          metadata?: Record<string, any>
          user_id: string
          project_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          content?: string | null
          file_url?: string | null
          file_name?: string | null
          file_size?: number | null
          type?: 'context' | 'issue' | 'inquiry' | 'product'
          tags?: string[]
          metadata?: Record<string, any>
          user_id?: string
          project_id?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}