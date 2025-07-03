"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { 
  ArrowLeftIcon,
  SettingsIcon,
  ExternalLinkIcon,
  EditIcon,
  TrashIcon,
  CopyIcon
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Textarea } from "@/components/ui/Textarea"
import { Switch } from "@/components/ui/Switch"
import { supabase } from "@/lib/supabase"
import { useProjects } from "@/hooks/use-projects"
import type { Database } from "@/lib/supabase"

type Project = Database['public']['Tables']['projects']['Row']

interface DashboardProjectDetailProps {
  projectSlug: string
  onNavigate: (path: string) => void
}

export function DashboardProjectDetail({ projectSlug, onNavigate }: DashboardProjectDetailProps) {
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    is_public: false,
    custom_slug: ''
  })
  const { updateProject, deleteProject } = useProjects()

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
        setEditForm({
          name: data.name,
          description: data.description,
          is_public: data.is_public,
          custom_slug: data.custom_slug || ''
        })
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

  const handleSave = async () => {
    if (!project) return

    const { error } = await updateProject(project.id, {
      name: editForm.name,
      description: editForm.description,
      is_public: editForm.is_public,
      custom_slug: editForm.custom_slug || null
    })

    if (error) {
      toast.error(error)
    } else {
      toast.success('Project updated successfully')
      setProject(prev => prev ? { 
        ...prev, 
        name: editForm.name, 
        description: editForm.description,
        is_public: editForm.is_public,
        custom_slug: editForm.custom_slug || null
      } : null)
      setIsEditing(false)
    }
  }

  const handleDelete = async () => {
    if (!project) return

    if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      const { error } = await deleteProject(project.id)

      if (error) {
        toast.error(error)
      } else {
        toast.success('Project deleted successfully')
        onNavigate('/dashboard/projects')
      }
    }
  }

  const copyProjectUrl = () => {
    if (!project) return
    
    const url = `${window.location.origin}/chat/${project.slug}`
    navigator.clipboard.writeText(url)
    toast.success('Project URL copied to clipboard')
  }

  const openProjectChat = () => {
    if (!project) return
    
    const url = `${window.location.origin}/chat/${project.slug}`
    window.open(url, '_blank')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-sidebar-foreground border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sidebar-foreground">Loading project...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-sidebar-foreground mb-2">
            {error === 'Project not found' ? 'Project Not Found' : 'Error'}
          </h2>
          <p className="text-sidebar-foreground/70 mb-4">
            {error === 'Project not found' 
              ? 'The project you\'re looking for doesn\'t exist or has been removed.'
              : error
            }
          </p>
          <Button
            onClick={() => onNavigate('/dashboard/projects')}
            className="bg-sidebar-foreground text-sidebar hover:bg-sidebar-foreground/90"
          >
            Back to Projects
          </Button>
        </div>
      </div>
    )
  }

  if (!project) {
    return null
  }

  return (
    <div className="flex flex-col h-full w-full max-w-full overflow-hidden bg-background">
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onNavigate('/dashboard/projects')}
                className="text-sidebar-foreground hover:bg-sidebar-accent"
              >
                <ArrowLeftIcon className="h-4 w-4" />
              </Button>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-sidebar-foreground font-general">
                  {project.name}
                </h1>
                <p className="text-sidebar-foreground/70">
                  Manage your project settings and configuration
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyProjectUrl}
                  className="bg-sidebar-accent border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent/80"
                >
                  <CopyIcon className="h-4 w-4 mr-2" />
                  Copy URL
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openProjectChat}
                  className="bg-sidebar-accent border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent/80"
                >
                  <ExternalLinkIcon className="h-4 w-4 mr-2" />
                  Open Chat
                </Button>
              </div>
            </div>

            {/* Project Details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="bg-sidebar-accent border-sidebar-border p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-sidebar-foreground font-general">
                      Project Information
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(!isEditing)}
                      className="text-sidebar-foreground hover:bg-sidebar-accent"
                    >
                      <EditIcon className="h-4 w-4 mr-2" />
                      {isEditing ? 'Cancel' : 'Edit'}
                    </Button>
                  </div>

                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name" className="text-sidebar-foreground">
                          Project Name
                        </Label>
                        <Input
                          id="name"
                          value={editForm.name}
                          onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                          className="bg-sidebar border-sidebar-border text-sidebar-foreground"
                        />
                      </div>
                      <div>
                        <Label htmlFor="description" className="text-sidebar-foreground">
                          Description
                        </Label>
                        <Textarea
                          id="description"
                          value={editForm.description}
                          onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                          className="bg-sidebar border-sidebar-border text-sidebar-foreground min-h-[100px]"
                        />
                      </div>
                      <div>
                        <Label htmlFor="custom_slug" className="text-sidebar-foreground">
                          Custom URL (optional)
                        </Label>
                        <Input
                          id="custom_slug"
                          value={editForm.custom_slug}
                          onChange={(e) => setEditForm(prev => ({ ...prev, custom_slug: e.target.value }))}
                          placeholder="my-custom-url"
                          className="bg-sidebar border-sidebar-border text-sidebar-foreground"
                        />
                        <p className="text-xs text-sidebar-foreground/60 mt-1">
                          Leave empty to auto-generate from project name
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="is_public"
                          checked={editForm.is_public}
                          onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, is_public: checked }))}
                        />
                        <Label htmlFor="is_public" className="text-sidebar-foreground">
                          Make this chatbot publicly available
                        </Label>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleSave}
                          className="bg-sidebar-foreground text-sidebar hover:bg-sidebar-foreground/90"
                        >
                          Save Changes
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setIsEditing(false)}
                          className="bg-sidebar-accent border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent/80"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sidebar-foreground/70">Project Name</Label>
                        <p className="text-sidebar-foreground font-medium">{project.name}</p>
                      </div>
                      <div>
                        <Label className="text-sidebar-foreground/70">Description</Label>
                        <p className="text-sidebar-foreground">{project.description}</p>
                      </div>
                      <div>
                        <Label className="text-sidebar-foreground/70">Project URL</Label>
                        <p className="text-sidebar-foreground font-mono text-sm">
                          {window.location.origin}/chat/{project.custom_slug || project.slug}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sidebar-foreground/70">Visibility</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className={`text-xs ${
                            project.is_public 
                              ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                              : 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                          }`}>
                            {project.is_public ? 'Public' : 'Private'}
                          </Badge>
                          <span className="text-xs text-sidebar-foreground/60">
                            {project.is_public ? 'Anyone can access this chatbot' : 'Only you can access this chatbot'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>

                {/* Danger Zone */}
                <Card className="bg-sidebar-accent border-red-500/20 p-6">
                  <h2 className="text-lg font-semibold text-red-500 mb-4 font-general">
                    Danger Zone
                  </h2>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sidebar-foreground font-medium">Delete Project</p>
                      <p className="text-sidebar-foreground/70 text-sm">
                        Permanently delete this project and all its data. This action cannot be undone.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleDelete}
                      className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                    >
                      <TrashIcon className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <Card className="bg-sidebar-accent border-sidebar-border p-6">
                  <h3 className="text-lg font-semibold text-sidebar-foreground mb-4 font-general">
                    Project Details
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sidebar-foreground/70 text-sm">Plan</Label>
                      <div className="mt-1">
                        <Badge variant="outline" className="bg-sidebar-foreground/10 text-sidebar-foreground border-sidebar-foreground/20">
                          {project.plan.charAt(0).toUpperCase() + project.plan.slice(1)}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sidebar-foreground/70 text-sm">Created</Label>
                      <p className="text-sidebar-foreground text-sm">
                        {new Date(project.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sidebar-foreground/70 text-sm">Last Updated</Label>
                      <p className="text-sidebar-foreground text-sm">
                        {new Date(project.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="bg-sidebar-accent border-sidebar-border p-6">
                  <h3 className="text-lg font-semibold text-sidebar-foreground mb-4 font-general">
                    Quick Actions
                  </h3>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-sidebar-accent border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent/80"
                      onClick={() => onNavigate('/admin/playground')}
                    >
                      <SettingsIcon className="h-4 w-4 mr-2" />
                      Configure AI
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-sidebar-accent border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent/80"
                      onClick={() => onNavigate('/admin/data-library')}
                    >
                      <SettingsIcon className="h-4 w-4 mr-2" />
                      Manage Knowledge
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
