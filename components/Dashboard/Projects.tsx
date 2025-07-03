"use client"

import * as React from "react"
import { 
  SearchIcon,
  FilterIcon,
  ExternalLinkIcon
} from "lucide-react"

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { useProjects } from '@/hooks/use-projects'
import { useAuth } from '@/hooks/use-auth'

const filterTabs = [
  { name: "Your Projects", active: false },
  { name: "Content Creators", active: false },
  { name: "Featured", active: true },
  { name: "Most used", active: false },
  { name: "Trending", active: false }
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

export function Projects() {
  const [searchTerm, setSearchTerm] = React.useState("")
  const [activeTab, setActiveTab] = React.useState("Your Projects")
  const [showFilters, setShowFilters] = React.useState(false)
  
  const { projects: userProjects, loading } = useProjects()
  const { user } = useAuth()

  const handleProjectClick = (projectSlug: string) => {
    window.history.pushState({}, '', `/admin/projects/${projectSlug}`)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  // Enhanced skeleton loader component with improved visual design
  const ProjectSkeleton = () => (
    <Card className="group bg-sidebar-accent border-sidebar-border overflow-hidden">
      {/* Project Preview Skeleton - Full gradient with pulse animation */}
      <div className="aspect-[4/3] bg-gradient-to-br from-sidebar-border via-sidebar-accent to-sidebar-border animate-pulse relative overflow-hidden">
        {/* Subtle shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-sidebar-foreground/5 to-transparent animate-pulse"></div>
      </div>
      
      {/* Project Info Skeleton */}
      <div className="p-4 space-y-3">
        {/* Author info section */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {/* Avatar skeleton */}
            <div className="w-6 h-6 rounded-full bg-sidebar-border animate-pulse" />
            <div className="min-w-0 flex-1">
              {/* Author name skeleton */}
              <div className="h-3 w-20 mb-1 bg-sidebar-border rounded-full animate-pulse" />
            </div>
          </div>
          {/* PRO badge skeleton */}
          <div className="h-5 w-10 bg-sidebar-border rounded-full animate-pulse" />
        </div>
        
        {/* Project Title Skeleton */}
        <div className="h-5 w-28 bg-sidebar-border rounded-full mb-3 animate-pulse" />
        
        {/* Category Badge Skeleton */}
        <div className="h-6 w-24 bg-sidebar-border border border-sidebar-border rounded-full animate-pulse" />
      </div>
    </Card>
  )

  // Format user projects for display with images
  const formattedUserProjects = React.useMemo(() => {
    return userProjects.map((project, index) => ({
      id: `user-${project.id}`,
      title: project.name,
      slug: project.slug,
      author: user?.user_metadata?.full_name || user?.email || 'You',
      authorAvatar: "🚀",
      isPro: project.plan !== 'personal',
      category: "Your Projects",
      preview: {
        imageUrl: projectImages[index % projectImages.length],
        textColor: "text-white",
        content: "🚀"
      }
    }))
  }, [userProjects, user])

  const filteredProjects = React.useMemo(() => {
    let projectsToFilter: any[] = []
    
    if (activeTab === "Your Projects") {
      projectsToFilter = formattedUserProjects
    } else {
      // For other filters, show empty for now since we removed dummy data
      projectsToFilter = []
    }

    return projectsToFilter.filter(project => {
      const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           project.author.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesSearch
    })
  }, [formattedUserProjects, activeTab, searchTerm])

  return (
    <div className="flex flex-col h-full w-full max-w-full overflow-hidden bg-background">
      {/* Main content area - scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* Header Section */}
        <div className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="max-w-7xl mx-auto">
            {/* Top Navigation */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    className="text-sidebar-foreground font-medium hover:bg-sidebar-accent"
                  >
                    Projects
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-sidebar-foreground/60 font-medium hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  >
                    People
                  </Button>
                </div>
              </div>
              
              {/* Search Bar */}
              <div className="relative w-full sm:w-96">
                <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-sidebar-foreground/40" />
                <Input
                  placeholder="Search across 1M+ independents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 py-3 bg-sidebar-accent border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/40 focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-full font-general"
                />
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-4 mb-8 overflow-x-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 bg-sidebar-accent border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent/80 flex-shrink-0 font-general"
              >
                <FilterIcon className="h-4 w-4" />
                Filters
              </Button>
              
              <div className="flex items-center gap-2 overflow-x-auto">
                {filterTabs.map((tab) => (
                  <Button
                    key={tab.name}
                    variant={activeTab === tab.name ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTab(tab.name)}
                    className={`whitespace-nowrap flex-shrink-0 ${
                      activeTab === tab.name
                        ? "bg-sidebar-foreground text-sidebar hover:bg-sidebar-foreground/90"
                        : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                    } font-general`}
                  >
                    {tab.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Section Header - Uses current filter as title */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl sm:text-2xl font-bold text-sidebar-foreground font-general">
                  {activeTab}
                </h2>
                {filteredProjects.length > 0 && (
                  <Button
                    variant="ghost"
                    className="text-sidebar-foreground/60 hover:text-sidebar-foreground text-sm font-general"
                  >
                    View more
                  </Button>
                )}
              </div>
              <p className="text-sidebar-foreground/60 text-sm sm:text-base font-general">
                {activeTab === "Your Projects" 
                  ? "Projects you've created and are working on"
                  : `Discover amazing projects in ${activeTab.toLowerCase()}`
                }
              </p>
            </div>

            {/* Projects Grid */}
            {loading ? (
              /* Skeleton Loading State */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-12">
                {Array.from({ length: 6 }).map((_, index) => (
                  <ProjectSkeleton key={index} />
                ))}
              </div>
            ) : filteredProjects.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-12">
                {filteredProjects.map((project) => (
                  <Card
                    key={project.id}
                    className="group bg-sidebar-accent border-sidebar-border hover:border-sidebar-foreground/20 transition-all duration-200 cursor-pointer overflow-hidden"
                    onClick={() => project.slug && handleProjectClick(project.slug)}
                  >
                    {/* Project Preview with Image */}
                    <div className="aspect-[4/3] relative overflow-hidden">
                      <img
                        src={project.preview.imageUrl}
                        alt={project.title}
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
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-xs text-white font-medium flex-shrink-0">
                            {project.authorAvatar}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-sidebar-foreground truncate font-general">
                              {project.author}
                            </p>
                            {project.isPro && (
                              <Badge variant="secondary" className="text-xs mt-1 bg-sidebar-foreground/10 text-sidebar-foreground/70 font-general">
                                PRO
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Project Title */}
                      <h3 className="text-sm font-medium text-sidebar-foreground mb-2 line-clamp-1 font-general">
                        {project.title}
                      </h3>

                      {/* Category Badge */}
                      {project.category === "Your Projects" && (
                        <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-500 border-blue-500/20 font-general">
                          Your Project
                        </Badge>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              /* Empty State */
              <div className="text-center py-12">
                <div className="bg-sidebar-accent rounded-lg p-8 max-w-md mx-auto">
                  <div className="text-4xl mb-4">📁</div>
                  <h3 className="text-sidebar-foreground text-lg font-semibold mb-2 font-general">
                    {activeTab === "Your Projects" ? "No projects yet" : `No ${activeTab.toLowerCase()} projects`}
                  </h3>
                  <p className="text-sidebar-foreground/70 mb-4 font-general">
                    {activeTab === "Your Projects" 
                      ? "Create your first project to get started"
                      : `We're working on adding more ${activeTab.toLowerCase()} content`
                    }
                  </p>
                  {activeTab === "Your Projects" && (
                    <Button
                      onClick={() => window.history.pushState({}, '', '/admin/quick-create')}
                      className="bg-sidebar-foreground text-sidebar hover:bg-sidebar-foreground/90 font-general"
                    >
                      Create Project
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
