"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { 
  SendIcon, 
  BotIcon,
  UserIcon,
  ShoppingBagIcon,
  ExternalLinkIcon,
  TagIcon
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

interface ProjectChatProps {
  projectSlug: string
}

export function ProjectChat({ projectSlug }: ProjectChatProps) {
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

  // Get products data for the selected project
  const { data: allData } = useData(project?.id)
  const products = allData.filter(item => item.type === 'product')

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

        const { data, error: fetchError } = await supabase
          .from('projects')
          .select('*')
          .eq('slug', projectSlug)
          .single()

        if (fetchError) {
          if (fetchError.code === 'PGRST116') {
            setError('Project not found')
          } else {
            throw fetchError
          }
          return
        }

        setProject(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    if (projectSlug) {
      fetchProject()
    }
  }, [projectSlug])

  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return

    // Send message using the hook
    await sendMessage(currentMessage, projectSlug)
    setCurrentMessage("")
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleProductClick = (product: any) => {
    if (product.metadata?.affiliateLink) {
      window.open(product.metadata.affiliateLink, '_blank')
    } else if (product.affiliate_link) {
      window.open(product.affiliate_link, '_blank')
    }
  }

  // Products Panel Component
  const ProductsPanel = () => (
    <div className="flex flex-col h-full bg-background">
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        <div className="space-y-4">
          <h3 className="text-sidebar-foreground font-semibold text-lg font-general">
            Recommended Products
          </h3>
          
          {products.length > 0 ? (
            <div className="space-y-4">
              {products.map((product) => (
                <Card 
                  key={product.id}
                  className="bg-sidebar-accent border-sidebar-border p-4 hover:border-sidebar-foreground/20 transition-colors cursor-pointer"
                  onClick={() => handleProductClick(product)}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <h4 className="text-sidebar-foreground font-medium text-sm font-general line-clamp-2">
                        {product.title}
                      </h4>
                      {product.metadata?.affiliateLink && (
                        <ExternalLinkIcon className="h-4 w-4 text-sidebar-foreground/60 flex-shrink-0 ml-2" />
                      )}
                    </div>
                    
                    {product.description && (
                      <p className="text-sidebar-foreground/70 text-xs line-clamp-3 leading-relaxed">
                        {product.description}
                      </p>
                    )}
                    
                    {product.metadata?.price && (
                      <div className="flex items-center justify-between">
                        <span className="text-sidebar-foreground font-semibold">
                          ${product.metadata.price}
                        </span>
                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 text-xs">
                          Product
                        </Badge>
                      </div>
                    )}
                    
                    {product.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        <TagIcon className="h-3 w-3 text-sidebar-foreground/40 flex-shrink-0 mt-0.5" />
                        {product.tags.slice(0, 2).map((tag, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs bg-sidebar-foreground/5 text-sidebar-foreground/60 border-sidebar-foreground/10 max-w-[60px] truncate"
                          >
                            {tag}
                          </Badge>
                        ))}
                        {product.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs bg-sidebar-foreground/5 text-sidebar-foreground/60 border-sidebar-foreground/10">
                            +{product.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-sidebar-accent rounded-full flex items-center justify-center mx-auto mb-3">
                <ShoppingBagIcon className="h-6 w-6 text-sidebar-foreground/40" />
              </div>
              <p className="text-sidebar-foreground/70 text-sm">
                No products available yet
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-sidebar-foreground border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sidebar-foreground">Loading chat...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-sidebar-foreground mb-2 font-general">
            {error === 'Project not found' ? 'Chatbot Not Found' : 'Error'}
          </h2>
          <p className="text-sidebar-foreground/70 mb-4">
            {error === 'Project not found' 
              ? 'The chatbot you\'re looking for doesn\'t exist. Check Discover to explore our library of chatbots.'
              : error
            }
          </p>
          <button
            onClick={() => {
              window.history.pushState({}, '', '/admin/discover')
              window.dispatchEvent(new PopStateEvent('popstate'))
            }}
            className="px-4 py-2 bg-sidebar-foreground text-sidebar rounded-lg hover:bg-sidebar-foreground/90 transition-colors"
          >
            Discover Chatbots
          </button>
        </div>
      </div>
    )
  }

  if (!project) {
    return null
  }

  // Determine if we should show products panel (desktop only, not tablet or mobile)
  const showProductsPanel = !isMobile && !isTablet

  return (
    <div className="flex h-full w-full max-w-full overflow-hidden bg-background">
      {/* Left Panel - Chat Interface */}
      <div className="flex-1 flex flex-col min-h-0 border-r border-sidebar-border">
        {/* Chat Header */}
        <div className="border-b border-sidebar-border p-4 bg-background">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <BotIcon className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-sidebar-foreground font-medium text-sm font-general">{project.name}</h3>
                <p className="text-sidebar-foreground/70 text-xs">{project.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {(isMobile || isTablet) && products.length > 0 ? (
                <Sheet>
                  <SheetTrigger asChild>
                    <Button
                      variant="ghost"
                      className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent font-general"
                    >
                      <ShoppingBagIcon className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent 
                    side="right" 
                    className="w-full sm:max-w-md p-0 bg-background border-sidebar-border"
                  >
                    <SheetHeader>
                      <SheetTitle className="sr-only">Recommended Products</SheetTitle>
                      <SheetDescription className="sr-only">Browse and purchase recommended products for this project</SheetDescription>
                    </SheetHeader>
                    <ProductsPanel />
                  </SheetContent>
                </Sheet>
              ) : null}
            </div>
          </div>
        </div>

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
              <div className="bg-sidebar-accent text-sidebar-foreground rounded-lg p-3">
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
        <div className="border-t border-sidebar-border p-4 bg-background">
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
        <div className="w-80 flex flex-col min-h-0">
          <ProductsPanel />
        </div>
      )}
    </div>
  )
}