"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { 
  SearchIcon,
  FilterIcon,
  StarIcon,
  MessageSquareIcon,
  UsersIcon,
  TrendingUpIcon,
  ClockIcon,
  ExternalLinkIcon,
  HeartIcon,
  EyeIcon,
  BotIcon,
  SparklesIcon
} from "lucide-react"

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { supabase } from '@/lib/supabase'
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

export function Discover() {
  const [searchTerm, setSearchTerm] = React.useState("")
  const [selectedCategory, setSelectedCategory] = React.useState("All Categories")
  const [activeFilter, setActiveFilter] = React.useState("Featured")
  const [projects, setProjects] = useState<ProjectWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPublicProjects = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch all projects with their creator profiles
        const { data, error: fetchError } = await supabase
          .from('projects')
          .select(`
            *,
            profiles (
              id,
              email,
              full_name,
              avatar_url
            )
          `)
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

    fetchPublicProjects()
  }, [])

  // Helper function to get category from project description or plan
  const getProjectCategory = (project: Project) => {
    const description = project.description.toLowerCase()
    const name = project.name.toLowerCase()
    
    if (description.includes('business') || description.includes('enterprise') || name.includes('business')) return 'Business'
    if (description.includes('education') || description.includes('learn') || name.includes('education')) return 'Education'
    if (description.includes('health') || description.includes('wellness') || name.includes('health')) return 'Health'
    if (description.includes('creative') || description.includes('art') || name.includes('creative')) return 'Creative'
    if (description.includes('tech') || description.includes('api') || name.includes('tech')) return 'Technology'
    if (description.includes('game') || description.includes('fun') || name.includes('entertainment')) return 'Entertainment'
    
    return 'Other'
  }

  // Helper function to generate avatar emoji based on category
  const getProjectAvatar = (project: Project) => {
    const category = getProjectCategory(project)
    const avatars = {
      'Business': '💼',
      'Education': '📚',
      'Health': '🏥',
      'Creative': '🎨',
      'Technology': '💻',
      'Entertainment': '🎮',
      'Other': '🤖'
    }
    return avatars[category as keyof typeof avatars] || '🤖'
  }

  // Helper function to get color based on category
  const getProjectColor = (project: Project) => {
    const category = getProjectCategory(project)
    const colors = {
      'Business': 'bg-blue-500',
      'Education': 'bg-purple-500',
      'Health': 'bg-green-500',
      'Creative': 'bg-pink-500',
      'Technology': 'bg-indigo-500',
      'Entertainment': 'bg-orange-500',
      'Other': 'bg-gray-500'
    }
    return colors[category as keyof typeof colors] || 'bg-gray-500'
  }

  const filteredBots = React.useMemo(() => {
    if (loading || !projects.length) return []
    
    let botsToFilter = projects.map((project, index) => ({
      id: project.id,
      name: project.name,
      description: project.description,
      creator: project.profiles?.full_name || project.profiles?.email?.split('@')[0] || 'Anonymous',
      avatar: getProjectAvatar(project),
      category: getProjectCategory(project),
      rating: 4.0 + Math.random() * 1, // Random rating between 4.0-5.0
      conversations: Math.floor(Math.random() * 10000) + 1000,
      users: Math.floor(Math.random() * 2000) + 100,
      tags: [getProjectCategory(project), project.plan.charAt(0).toUpperCase() + project.plan.slice(1)],
      featured: index < 3, // First 3 projects are featured
      trending: Math.random() > 0.7, // 30% chance of being trending
      color: getProjectColor(project),
      slug: project.slug
    }))

    // Apply filter
    if (activeFilter === "Featured") {
      botsToFilter = botsToFilter.filter(bot => bot.featured)
    } else if (activeFilter === "Trending") {
      botsToFilter = botsToFilter.filter(bot => bot.trending)
    } else if (activeFilter === "Most Popular") {
      botsToFilter = [...botsToFilter].sort((a, b) => b.users - a.users)
    } else if (activeFilter === "Top Rated") {
      botsToFilter = [...botsToFilter].sort((a, b) => b.rating - a.rating)
    }

    // Apply category filter
    if (selectedCategory !== "All Categories") {
      botsToFilter = botsToFilter.filter(bot => bot.category === selectedCategory)
    }

    // Apply search filter
    if (searchTerm) {
      botsToFilter = botsToFilter.filter(bot => 
        bot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bot.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bot.creator.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bot.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    return botsToFilter
  }, [searchTerm, selectedCategory, activeFilter, projects, loading])

  const handleBotClick = (bot: typeof filteredBots[0]) => {
    // Navigate to chat with this bot
    window.history.pushState({}, '', `/chat/${bot.slug || bot.name.toLowerCase().replace(/\s+/g, '-')}`)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

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
    <div className="flex flex-col h-full w-full max-w-full bg-background">
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-medium text-white mb-2 font-general">
                    Discover AI Chatbots
                  </h1>
                  <p className="text-gray-400 font-general">
                    Explore our library of public AI chatbots created by the community
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 font-general">
                    <SparklesIcon className="h-3 w-3 mr-1" />
                    {projects.length} Bots Available
                  </Badge>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative w-full max-w-2xl mx-auto mb-6">
                <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-sidebar-foreground/40" />
                <Input
                  placeholder="Search chatbots, creators, or categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 py-3 bg-sidebar-accent border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/40 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-general"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-4 mb-6 overflow-x-auto">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 bg-sidebar-accent border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent/80 flex-shrink-0 font-general"
                >
                  <FilterIcon className="h-4 w-4" />
                  Filters
                </Button>
                
                <div className="flex items-center gap-2 overflow-x-auto">
                  {filterTabs.map((tab) => (
                    <Button
                      key={tab.name}
                      variant={activeFilter === tab.name ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setActiveFilter(tab.name)}
                      className={`whitespace-nowrap flex-shrink-0 ${
                        activeFilter === tab.name
                          ? "bg-sidebar-foreground text-sidebar hover:bg-sidebar-foreground/90"
                          : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                      } font-general`}
                    >
                      {tab.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Category Filters */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className={`whitespace-nowrap flex-shrink-0 ${
                      selectedCategory === category
                        ? "bg-sidebar-foreground text-sidebar hover:bg-sidebar-foreground/90"
                        : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                    } font-general`}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>

            {/* Results Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-sidebar-foreground font-general">
                  {activeFilter} Chatbots
                </h2>
                <span className="text-sidebar-foreground/60 text-sm">
                  {filteredBots.length} results
                </span>
              </div>
              <p className="text-sidebar-foreground/60 text-sm font-general">
                {activeFilter === "Featured" 
                  ? "Hand-picked chatbots showcasing the best of our community"
                  : `Discover amazing ${activeFilter.toLowerCase()} chatbots from our community`
                }
              </p>
            </div>

            {/* Chatbots Grid */}
            {filteredBots.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBots.map((bot) => (
                  <Card
                    key={bot.id}
                    className="group bg-sidebar-accent border-sidebar-border hover:border-sidebar-foreground/20 transition-all duration-200 cursor-pointer overflow-hidden"
                    onClick={() => handleBotClick(bot)}
                  >
                    {/* Bot Preview */}
                    <div className={`${bot.color} aspect-[4/3] flex items-center justify-center text-white relative overflow-hidden`}>
                      <div className="text-6xl opacity-80">
                        {bot.avatar}
                      </div>
                      
                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex gap-2">
                        {bot.featured && (
                          <Badge className="bg-yellow-500 text-yellow-900 text-xs">
                            Featured
                          </Badge>
                        )}
                        {bot.trending && (
                          <Badge className="bg-red-500 text-white text-xs">
                            <TrendingUpIcon className="h-3 w-3 mr-1" />
                            Trending
                          </Badge>
                        )}
                      </div>
                      
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

                    {/* Bot Info */}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-xs text-white font-medium flex-shrink-0">
                            <BotIcon className="h-3 w-3" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-sidebar-foreground/70 truncate font-general">
                              {bot.creator}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <StarIcon className="h-3 w-3 text-yellow-500 fill-current" />
                          <span className="text-xs text-sidebar-foreground/70">{bot.rating}</span>
                        </div>
                      </div>

                      {/* Bot Title */}
                      <h3 className="text-lg font-semibold text-sidebar-foreground mb-2 line-clamp-1 font-general">
                        {bot.name}
                      </h3>

                      {/* Description */}
                      <p className="text-sm text-sidebar-foreground/70 mb-4 line-clamp-2 leading-relaxed font-general">
                        {bot.description}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 mb-4">
                        {bot.tags.slice(0, 3).map((tag, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs bg-sidebar-foreground/5 text-sidebar-foreground/60 border-sidebar-foreground/10 font-general"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      {/* Stats */}
                      <div className="flex items-center justify-between text-xs text-sidebar-foreground/60 font-general">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <MessageSquareIcon className="h-3 w-3" />
                            <span>{bot.conversations.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <UsersIcon className="h-3 w-3" />
                            <span>{bot.users.toLocaleString()}</span>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs bg-sidebar-foreground/10 text-sidebar-foreground/70 border-sidebar-foreground/20 font-general">
                          {bot.category}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              /* Empty State */
              <div className="text-center py-12">
                <div className="bg-sidebar-accent rounded-lg p-8 max-w-md mx-auto">
                  <div className="text-4xl mb-4">🔍</div>
                  <h3 className="text-sidebar-foreground text-lg font-semibold mb-2 font-general">
                    {projects.length === 0 ? 'No public chatbots yet' : 'No chatbots found'}
                  </h3>
                  <p className="text-sidebar-foreground/70 mb-4 font-general">
                    {projects.length === 0 
                      ? 'Be the first to create a public chatbot for the community!'
                      : 'No chatbots match your current search and filter criteria.'
                    }
                  </p>
                  {projects.length === 0 ? (
                    <Button
                      onClick={() => {
                        window.history.pushState({}, '', '/dashboard/quick-create')
                        window.dispatchEvent(new PopStateEvent('popstate'))
                      }}
                      className="bg-sidebar-foreground text-sidebar hover:bg-sidebar-foreground/90 font-general"
                    >
                      Create Your First Bot
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        setSearchTerm("")
                        setSelectedCategory("All Categories")
                        setActiveFilter("Featured")
                      }}
                      className="bg-sidebar-foreground text-sidebar hover:bg-sidebar-foreground/90 font-general"
                    >
                      Clear Filters
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
