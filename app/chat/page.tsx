"use client"

import * as React from 'react'
import { useState, useEffect } from 'react'
import { 
  SearchIcon,
  FilterIcon,
  StarIcon,
  MessageSquareIcon,
  UsersIcon,
  TrendingUpIcon,
  ExternalLinkIcon,
  BotIcon,
  SparklesIcon,
  ArrowLeftIcon,
  PlusIcon,
  ArrowUpCircleIcon
} from "lucide-react"

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { supabase } from '@/lib/supabase'
import { 
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider
} from '@/components/ui/Sidebar'
import { Separator } from '@/components/ui/Separator'
import type { Database } from '@/lib/supabase'

type Project = Database['public']['Tables']['projects']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']

interface ProjectWithProfile extends Project {
  profiles?: Profile
}

const categories = [
  "All Categories",
  "Business",
  "Education",
  "Entertainment",
  "Health",
  "Technology",
  "Creative",
  "Other"
]

const filterTabs = [
  { name: "Featured", active: true },
  { name: "Trending", active: false },
  { name: "Most Popular", active: false },
  { name: "Recently Added", active: false },
  { name: "Top Rated", active: false }
]

// Project preview images - using Pexels for stock photos
const projectImages = [
  "/images/image-1.webp",
  "/images/image-2.webp",
  "/images/image-3.webp",
  "/images/image-4.webp",
  "/images/image-5.webp",
  "/images/image-1.webp"
]

export default function ChatPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All Categories")
  const [activeFilter, setActiveFilter] = useState("Featured")
  const [projects, setProjects] = useState<ProjectWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentView, setCurrentView] = useState<'discover' | 'create'>('discover')

  useEffect(() => {
    const fetchPublicProjects = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch only public projects
        const { data, error: fetchError } = await supabase
          .from('projects')
          .select('*')
          .eq('is_public', true)
          .order('created_at', { ascending: false })

        if (fetchError) {
          throw fetchError
        }

        setProjects(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch projects')
      } finally {
        setLoading(false)
      }
    }

    if (currentView === 'discover') {
      fetchPublicProjects()
    }
  }, [currentView])

  const filteredProjects = React.useMemo(() => {
    let filtered = projects
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(project => 
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    return filtered
  }, [searchTerm, projects])

  const handleProjectClick = (project: Project) => {
    // Navigate to individual chat with this project
    window.location.href = `/chat/${project.custom_slug || project.slug}`
  }

  const handleBackToAdmin = () => {
    window.location.href = '/admin'
  }

  const renderCreateView = () => {
    return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-sidebar-accent rounded-full flex items-center justify-center mx-auto mb-4">
          <PlusIcon className="h-8 w-8 text-sidebar-foreground/40" />
        </div>
        <h3 className="text-sidebar-foreground text-lg font-semibold mb-2 font-general">
          Create Your Own Chatbot
        </h3>
        <p className="text-sidebar-foreground/70 mb-6">
          To create your own AI chatbot, you'll need to access the admin panel where you can build, train, and deploy your custom AI assistant.
        </p>
        <Button
          onClick={handleBackToAdmin}
          className="font-general"
        >
          Go to Admin Panel
        </Button>
      </div>
    </div>
    )
  }

  const renderDiscoverView = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-sidebar-foreground border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sidebar-foreground">Loading chatbots...</p>
          </div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-sidebar-foreground mb-2 font-general">Error</h2>
            <p className="text-sidebar-foreground/70 mb-4">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-sidebar-foreground text-sidebar hover:bg-sidebar-foreground/90"
            >
              Try Again
            </Button>
          </div>
        </div>
      )
    }

    return (
      <div className="w-full">
        <div className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-medium text-white mb-2 font-general">
                    Discover Public Projects
                  </h1>
                  <p className="text-gray-400 font-general">
                    Explore public projects created by the community
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 font-general">
                    <SparklesIcon className="h-3 w-3 mr-1" />
                    {projects.length} Projects Available
                  </Badge>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative w-full max-w-2xl mx-auto mb-6">
                <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-sidebar-foreground/40" />
                <Input
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 py-3 bg-sidebar-accent border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/40 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-general"
                />
              </div>

            </div>

            {/* Projects Grid */}
            {filteredProjects.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {filteredProjects.map((project, index) => (
                  <Card
                    key={project.id}
                    className="group bg-sidebar-accent border-sidebar-border hover:border-sidebar-foreground/20 transition-all duration-200 cursor-pointer overflow-hidden"
                    onClick={() => handleProjectClick(project)}
                  >
                    {/* Project Preview */}
                    <div className="aspect-[4/3] relative overflow-hidden">
                      <img
                        src={projectImages[index % projectImages.length]}
                        alt={project.name}
                        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                        loading="lazy"
                      />
                      
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                      
                      {/* Action button */}
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
                        >
                          <ExternalLinkIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Project Info */}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-xs text-white font-medium flex-shrink-0">
                            🚀
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-sidebar-foreground/70 truncate font-general">
                              Public Project
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Project Title */}
                      <h3 className="text-lg font-semibold text-sidebar-foreground mb-2 line-clamp-1 font-general">
                        {project.name}
                      </h3>

                      {/* Description */}
                      <p className="text-sm text-sidebar-foreground/70 mb-4 line-clamp-2 font-general">
                        {project.description}
                      </p>

                      {/* Plan Badge */}
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs bg-sidebar-foreground/10 text-sidebar-foreground/70 border-sidebar-foreground/20 font-general">
                          {project.plan.charAt(0).toUpperCase() + project.plan.slice(1)}
                        </Badge>
                        <span className="text-xs text-sidebar-foreground/60 font-general">
                          {new Date(project.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-sidebar-foreground text-lg font-semibold mb-2 font-general">
                  {projects.length === 0 ? 'No public projects yet' : 'No projects found'}
                </h3>
                <p className="text-sidebar-foreground/70 mb-4 font-general">
                  {projects.length === 0 
                    ? 'Be the first to create a public project for the community!'
                    : 'No projects match your current search criteria.'
                  }
                </p>
                {projects.length === 0 ? (
                  <Button
                    onClick={handleBackToAdmin}
                    className="bg-sidebar-foreground text-sidebar hover:bg-sidebar-foreground/90 font-general"
                  >
                    Create Your First Project
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      setSearchTerm("")
                    }}
                    className="bg-sidebar-foreground text-sidebar hover:bg-sidebar-foreground/90 font-general"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="offcanvas" variant="inset">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className="data-[slot=sidebar-menu-button]:!p-1.5"
              >
                <a href="/chat">
                  <ArrowUpCircleIcon className="h-5 w-5" />
                  <span className="text-base font-semibold">Thetails</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <div className="flex flex-col gap-2 p-2">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={currentView === 'discover'}
                  onClick={() => setCurrentView('discover')}
                >
                  <SearchIcon className="h-4 w-4" />
                  <span>Discover</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={currentView === 'create'}
                  onClick={() => setCurrentView('create')}
                >
                  <PlusIcon className="h-4 w-4" />
                  <span>Create AI</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </div>
        </SidebarContent>
        <SidebarFooter>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex flex-col h-screen overflow-hidden">
        <div className="sticky top-0 z-50 bg-background rounded-t-xl overflow-hidden flex-shrink-0">
          <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
            <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
              <div className="-ml-1 text-white hover:text-white" />
              <Separator
                orientation="vertical"
                className="mx-2 data-[orientation=vertical]:h-4 bg-white/20"
              />
              <h1 className="text-base font-medium text-white">
                {currentView === 'discover' ? 'Discover' : 'Create AI'}
              </h1>
            </div>
          </header>
        </div>
        <div className="flex-1 flex flex-col min-h-0">
          {currentView === 'discover' ? renderDiscoverView() : renderCreateView()}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}