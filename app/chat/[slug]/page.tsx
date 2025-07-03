"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { 
  SendIcon, 
  BotIcon, 
  UserIcon, 
  ShoppingBagIcon,
  ExternalLinkIcon,
  TagIcon,
  ArrowLeftIcon,
  TwitterIcon,
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
  GlobeIcon
} from "lucide-react"

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@/components/ui/Sheet'
import { supabase } from "@/lib/supabase"
import { useData } from "@/hooks/use-data"
import { useProjectChat } from "@/hooks/use-project-chat"
import useIsMobile from '@/hooks/use-mobile'
import type { Database } from "@/lib/supabase"

type Project = Database['public']['Tables']['projects']['Row']

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ChatSlugPageProps {
  params: { slug: string }
}

// Token plans for demonstration
const tokenPlans = [
  {
    id: '1',
    title: 'Free',
    price: 0,
    tokens: '1M Tokens / Month',
    affiliateLink: 'https://example.com/free'
  },
  {
    id: '2',
    title: 'Pro',
    price: 20,
    tokens: '10M Tokens / Month',
    affiliateLink: 'https://example.com/pro'
  },
  {
    id: '3',
    title: 'Teams',
    price: 30,
    tokens: '10M Tokens / Month',
    affiliateLink: 'https://example.com/teams'
  }
]

export default function ChatSlugPage({ params }: ChatSlugPageProps) {
  const isMobile = useIsMobile()
  const [isTablet, setIsTablet] = React.useState(false)
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Use the project chat hook
  const { 
    messages: chatMessages, 
    isLoading: isLoadingMessage, 
    sendMessage 
  } = useProjectChat()
  
  // Initialize with welcome message if no messages yet
  const [initialMessage] = React.useState<ChatMessage>(
    {
      id: '1',
      role: 'assistant',
      content: `Hello! I'm an AI assistant for ${project?.name || 'this project'}. How can I help you today?`,
      timestamp: new Date()
    }
  )
  
  // Combine initial welcome message with chat messages
  const messages = React.useMemo(() => {
    return chatMessages.length > 0 ? chatMessages : [initialMessage]
  }, [chatMessages, initialMessage, project?.name])
  
  const [currentMessage, setCurrentMessage] = React.useState("")

  // Get products data for the selected project (fallback to dummy products)
  const { data: allData } = useData(project?.id)
  const realProducts = allData.filter(item => item.type === 'product')
  const products = realProducts.length > 0 ? realProducts : tokenPlans

  // Check for tablet view (768px to 1024px)
  React.useEffect(() => {
    const checkTablet = () => {
      const width = window.innerWidth
      setIsTablet(width >= 768 && width < 1024)
    }
    
    checkTablet()
    window.addEventListener('resize', checkTablet)
    return () => window.removeEventListener('resize', checkTablet)
  }, [])

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true)
        setError(null)

        // Try to find project by custom_slug first, then by slug
        let { data, error: fetchError } = await supabase
          .from('projects')
          .select('*')
          .eq('custom_slug', params.slug)
          .eq('is_public', true)
          .single()

        // If not found by custom_slug, try by regular slug
        if (fetchError && fetchError.code === 'PGRST116') {
          const { data: slugData, error: slugError } = await supabase
            .from('projects')
            .select('*')
            .eq('slug', params.slug)
            .eq('is_public', true)
            .single()

          if (slugError) {
            if (slugError.code === 'PGRST116') {
              setError('Chatbot not found or not publicly available')
            } else {
              throw slugError
            }
            return
          }

          data = slugData
        } else if (fetchError) {
          throw fetchError
        }

        setProject(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    if (params.slug) {
      fetchProject()
    }
  }, [params.slug])

  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return

    // Send message using the hook
    await sendMessage(currentMessage, params.slug)
    setCurrentMessage("")
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleProductClick = (product: any) => {
    if (product.affiliateLink) {
      window.open(product.affiliateLink, '_blank')
    } else if (product.metadata?.affiliateLink) {
      window.open(product.metadata.affiliateLink, '_blank')
    }
  }

  const handleBackToDiscover = () => {
    window.location.href = '/chat'
  }

  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'twitter':
        return TwitterIcon
      case 'facebook':
        return FacebookIcon
      case 'instagram':
        return InstagramIcon
      case 'linkedin':
        return LinkedinIcon
      case 'website':
        return GlobeIcon
      default:
        return GlobeIcon
    }
  }

  // Products Panel Component
  const ProductsPanel = () => {
    return (
      <div className="flex flex-col h-full bg-background">
        {/* Products Section */}
        <div className="flex-1 p-6 space-y-4 overflow-y-auto">
          <div className="space-y-3">
            <h3 className="text-sidebar-foreground font-semibold text-lg font-general">
              Recommended Products
            </h3>
            
            <div className="space-y-3">
              {products.map((product) => (
                <Card 
                  key={product.id}
                  className="bg-sidebar-accent border-sidebar-border p-3 hover:border-sidebar-foreground/20 transition-all duration-200 cursor-pointer group"
                  onClick={() => handleProductClick(product)}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h4 className="text-sidebar-foreground font-medium text-sm font-general group-hover:text-blue-400 transition-colors">
                        {product.title}
                      </h4>
                      <ExternalLinkIcon className="h-4 w-4 text-sidebar-foreground/60 flex-shrink-0 ml-2 group-hover:text-blue-400 transition-colors" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sidebar-foreground font-semibold text-base">
                        ${product.price}{product.price > 0 ? '/month' : ''}
                      </span>
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-xs">
                        {product.tokens || `${product.metadata?.tokens || 'Tokens'}`}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-sidebar flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-sidebar-foreground border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sidebar-foreground">Loading chat...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-sidebar flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-sidebar-foreground mb-2 font-general">
            {error === 'Chatbot not found or not publicly available' ? 'Chatbot Not Found' : 'Error'}
          </h2>
          <p className="text-sidebar-foreground/70 mb-4">
            {error === 'Chatbot not found or not publicly available' 
              ? 'The chatbot you\'re looking for doesn\'t exist or is not publicly available.'
              : error
            }
          </p>
          <Button
            onClick={handleBackToDiscover}
            className="bg-sidebar-foreground text-sidebar hover:bg-sidebar-foreground/90"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Discover
          </Button>
        </div>
      </div>
    )
  }

  if (!project) {
    return null
  }

  // Determine if we should show products panel (desktop only, not tablet or mobile)
  const showProductsPanel = !isMobile && !isTablet
  const socialLinks = project?.social_links || {}
  const hasSocialLinks = Object.keys(socialLinks).length > 0 && Object.values(socialLinks).some(link => link)

  return (
    <div className="flex flex-col h-screen w-full max-w-full overflow-hidden bg-background">
      {/* Chat Header */}
      <div className="border-b border-sidebar-border p-4 bg-background flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBackToDiscover}
              className="text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-sidebar-foreground font-general">
                {project.name}
              </h1>
            </div>
          </div>
          
          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {/* Social Icons - Desktop Only */}
            {hasSocialLinks && !isMobile && !isTablet && (
              <div className="flex gap-1">
                {Object.entries(socialLinks).map(([platform, url]) => {
                  if (!url) return null
                  const IconComponent = getSocialIcon(platform)
                  return (
                    <Button
                      key={platform}
                      variant="ghost"
                      size="icon"
                      onClick={() => window.open(url as string, '_blank')}
                      className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-blue-400 transition-colors h-8 w-8"
                    >
                      <IconComponent className="h-4 w-4" />
                    </Button>
                  )
                })}
              </div>
            )}
            
            {/* Mobile/Tablet Products Sheet */}
            {(isMobile || isTablet) && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-sidebar-foreground hover:bg-sidebar-accent h-8 w-8"
                  >
                    <ShoppingBagIcon className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent 
                  side="right" 
                  className="w-full sm:max-w-md p-0 bg-background border-sidebar-border"
                >
                  <SheetHeader className="sr-only">
                    <SheetTitle>Recommended Products</SheetTitle>
                    <SheetDescription>Browse and purchase recommended products for this chatbot</SheetDescription>
                  </SheetHeader>
                  <ProductsPanel />
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Panel - Chat Interface */}
        <div className="flex-1 flex flex-col min-h-0 border-r border-sidebar-border">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <BotIcon className="h-4 w-4 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-sidebar-foreground text-sidebar'
                      : 'bg-sidebar-accent text-sidebar-foreground'
                  }`}
                >
                  <p className="text-sm leading-relaxed font-general">{message.content}</p>
                  <p className="text-xs opacity-60 mt-1 font-general">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 bg-sidebar-foreground rounded-full flex items-center justify-center flex-shrink-0">
                    <UserIcon className="h-4 w-4 text-sidebar" />
                  </div>
                )}
              </div>
            ))}
            {isLoadingMessage && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <BotIcon className="h-4 w-4 text-white" />
                </div>
                <div className="bg-sidebar-accent text-sidebar-foreground rounded-lg p-3 max-w-[70%]">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-sidebar-foreground/40 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-sidebar-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-sidebar-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="border-t border-sidebar-border p-4 bg-background flex-shrink-0">
            <div className="flex gap-3">
              <Input
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 bg-sidebar-accent border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-general"
                disabled={isLoadingMessage}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!currentMessage.trim() || isLoadingMessage}
                className="bg-sidebar-foreground text-sidebar hover:bg-sidebar-foreground/90 font-general"
              >
                <SendIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Right Panel - Desktop Only (not tablet) */}
        {showProductsPanel && (
          <div className="w-80 flex flex-col min-h-0 flex-shrink-0">
            <ProductsPanel />
          </div>
        )}
      </div>
    </div>
  )
}