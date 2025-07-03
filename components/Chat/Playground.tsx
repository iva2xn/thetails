"use client"

import * as React from "react"
import { 
  SendIcon, 
  BotIcon,
  UserIcon, 
  RefreshCwIcon,
  SettingsIcon,
  SaveIcon,
  DatabaseIcon
} from "lucide-react"

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { Card } from '@/components/ui/Card'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@/components/ui/Sheet'
import { toast } from 'sonner'
import { useProjects } from '@/hooks/use-projects'
import { useProjectChat } from '@/hooks/use-project-chat'
import useIsMobile from '@/hooks/use-mobile'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export function Playground() {
  const isMobile = useIsMobile()
  const [isTablet, setIsTablet] = React.useState(false)
  const { projects, loading: projectsLoading, updateProject } = useProjects()
  const [selectedProject, setSelectedProject] = React.useState("")
  const { messages, isLoading: aiLoading, sendMessage, clearMessages } = useProjectChat()
  const [description, setDescription] = React.useState<string>("")
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false)
  
  const [initialMessage] = React.useState<ChatMessage>(
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI assistant. How can I help you today?',
      timestamp: new Date()
    }
  )
  const [currentMessage, setCurrentMessage] = React.useState("")
  
  // Combine initial welcome message with AI chat messages
  const allMessages = React.useMemo(() => {
    return messages.length > 0 ? messages : [initialMessage]
  }, [messages, initialMessage])

  // Set default project when projects load
  React.useEffect(() => {
    if (projects.length > 0 && !selectedProject) {
      const firstProject = projects[0]
      setSelectedProject(firstProject.id)
      setDescription(firstProject.description)
    }
  }, [projects, selectedProject])

  // Update description when project changes
  React.useEffect(() => {
    if (selectedProject && projects.length > 0) {
      // Only update description when project changes, not on every render
      const selectedProjectData = projects.find(p => p.id === selectedProject)
      if (selectedProjectData) {
        setDescription(selectedProjectData.description)
      }
    }
  }, [selectedProject])

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

  // Scroll to bottom of chat when messages change
  const messagesEndRef = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [allMessages])

  const selectedProjectName = projects.find(p => p.id === selectedProject)?.name || 'My Chatbot'

  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return
    
    // Get the project slug from the selected project
    const project = projects.find(p => p.id === selectedProject)
    if (!project) return
    
    // Send message to project chat using the slug
    await sendMessage(currentMessage, project.slug)
    setCurrentMessage("")
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleSave = async () => {
    // Handle save functionality
    console.log('Saving chatbot configuration...')
    
    if (selectedProject && description.trim()) {
      try {
        // Update the project description
        await updateProject(selectedProject, {
          description: description.trim()
        })
        toast.success('Chatbot configuration saved successfully')
      } catch (error) {
        console.error('Error saving configuration:', error)
        toast.error('Failed to save configuration')
      }
    }
  }

  const handleResetChat = () => {
    if (confirm('Are you sure you want to reset the chat? This will clear all messages.')) {
      clearMessages()
    }
  }

  const handleDatabase = () => {
    // Handle database functionality
    console.log('Opening database...')
  }

  // Settings Panel Component
  const SettingsPanel = () => (
    <div className="flex flex-col h-full bg-background">
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        <div className="space-y-4">
          <h3 className="text-sidebar-foreground font-semibold text-lg font-general">Configurations</h3>
          
          <div className="space-y-3">
            <Label htmlFor="project-select" className="text-sidebar-foreground font-medium">
              Project
            </Label>
            <Select 
              value={selectedProject} 
              onValueChange={setSelectedProject}
              disabled={projectsLoading}
            >
              <SelectTrigger className="bg-sidebar-accent border-sidebar-border text-sidebar-foreground">
                <SelectValue placeholder={projectsLoading ? "Loading projects..." : "Select a project"} />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label htmlFor="description" className="text-sidebar-foreground font-medium">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
              }}
              placeholder="Describe what your chatbot should do, its personality, and how it should behave..."
              className="min-h-[120px] resize-none bg-sidebar-accent border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={!selectedProject}
            />
            <p className="text-xs text-sidebar-foreground/60">
              This is the most important setting. Be specific about your chatbot's role, tone, and capabilities.
            </p>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Actions - Side by Side */}
      <div className="p-6 border-t border-sidebar-border bg-background">
        <div className="flex gap-3">
          <Button
            onClick={handleDatabase}
            variant="outline"
            className="flex-1 bg-sidebar-accent border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent/80"
            disabled={!selectedProject}
          >
            <DatabaseIcon className="h-4 w-4 mr-2" />
            Database
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 bg-sidebar-foreground text-sidebar hover:bg-sidebar-foreground/90"
            disabled={!selectedProject || !description.trim()}
          >
            <SaveIcon className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </div>
    </div>
  )

  // Determine if we should show settings panel (desktop only, not tablet or mobile)
  const showSettingsPanel = !isMobile && !isTablet

  return (
    <div className="flex h-full w-full max-w-full overflow-hidden bg-background">
      {/* Left Panel - Chat Interface */}
      <div className="flex-1 flex flex-col min-h-0 border-r border-sidebar-border">
        {/* Chat Header */}
        <div className="border-b border-sidebar-border p-4 bg-background">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <BotIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-sidebar-foreground font-medium text-sm font-general">{selectedProjectName}</h3>
                <p className="text-sidebar-foreground/60 text-xs">AI-powered assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleResetChat}
                className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                title="Reset Chat"
              >
                <RefreshCwIcon className="h-4 w-4" />
              </Button>
              {(isMobile || isTablet) ? (
                <Sheet>
                  <SheetTrigger asChild>
                    <Button
                      variant="ghost"
                      className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent font-general"
                    >
                      <SettingsIcon className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent 
                    side="right" 
                    className="w-full sm:max-w-md p-0 bg-background border-sidebar-border"
                  >
                    <SheetHeader>
                      <SheetTitle className="sr-only">Chatbot Configuration</SheetTitle>
                      <SheetDescription className="sr-only">Configure your chatbot settings and save changes</SheetDescription>
                    </SheetHeader>
                    <SettingsPanel />
                  </SheetContent>
                </Sheet>
              ) : (
                <Button
                  onClick={handleSave}
                  variant="ghost"
                  size="sm"
                  className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent font-general"
                  disabled={!selectedProject || !description.trim()}
                >
                  <SaveIcon className="h-4 w-4 mr-2" />
                  Save
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
          {allMessages.map((message) => (
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
          {aiLoading && (
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
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div className="border-t border-sidebar-border p-4 bg-background">
          <div className="flex gap-3">
            <Input
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={selectedProject ? "Type your message..." : "Select a project to start chatting"}
              className="flex-1 bg-sidebar-accent border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-general py-3"
              disabled={aiLoading || !selectedProject}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!currentMessage.trim() || aiLoading || !selectedProject}
              className="bg-sidebar-foreground text-sidebar hover:bg-sidebar-foreground/90 font-general"
            >
              <SendIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Right Panel - Desktop Only (not tablet) */}
      {showSettingsPanel && (
        <div className="w-80 flex flex-col min-h-0">
          <SettingsPanel />
        </div>
      )}
    </div>
  )
}