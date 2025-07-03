"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { PlusIcon } from "lucide-react"
import { Button } from '@/components/ui/Button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { useData } from '@/hooks/use-data'
import { useProjects } from '@/hooks/use-projects'
import { SearchAndFilters } from "../knowledge-base/SearchAndFilters"
import { DataCard } from "../knowledge-base/DataCard"
import { CreateDataModal } from "../knowledge-base/CreateDataModal"
import { EmptyState } from "../knowledge-base/EmptyState"
import { SemanticSearch } from '../semantic-processing/SemanticSearch'
import { filterAndSortData } from "../knowledge-base/Utils"
import { FilterState, CreateDataFormData } from "../knowledge-base/Types"
import { DATA_TYPES } from "../knowledge-base/Constants"

export function KnowledgeBase() {
  const { projects } = useProjects()
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'browse' | 'search'>('browse')
  const { data, loading, createData } = useData(selectedProjectId || undefined)
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    type: 'context',
    sortBy: 'newest'
  })
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  // Set default project when projects load
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id)
    }
  }, [projects, selectedProjectId])

  // Get selected project details
  const selectedProject = projects.find(p => p.id === selectedProjectId)

  const filteredData = filterAndSortData(data, filters)
  const hasFilters = filters.search !== ''

  // Get the display name for the current filter type
  const getFilterDisplayName = (type: DataType) => {
    const typeConfig = DATA_TYPES.find(t => t.id === type)
    return typeConfig?.name || 'Data'
  }

  // Get the button text based on current filter
  const getAddButtonText = () => {
    const displayName = getFilterDisplayName(filters.type)
    return `Add ${displayName}`
  }

  const handleCreateData = async (formData: CreateDataFormData) => {
    if (!selectedProjectId) {
      return
    }
    
    await createData({
      ...formData,
      project_id: selectedProjectId
    })
  }

  const handleClearFilters = () => {
    setFilters({
      search: '',
      type: 'context',
      sortBy: 'newest'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-sidebar-foreground border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sidebar-foreground">Loading data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full w-full max-w-full overflow-hidden bg-background">
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
              <div>
                <div className="flex items-center gap-4 mb-2">
                  <h1 className="text-2xl sm:text-3xl font-semibold text-sidebar-foreground font-circular-web">
                    {selectedProject?.name || 'Data Library'}
                  </h1>
                </div>
                <div className="flex items-center gap-4">
                  <div className="min-w-[200px]">
                    <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                      <SelectTrigger className="bg-sidebar-accent border-sidebar-border text-sidebar-foreground">
                        <SelectValue placeholder="Select a project" />
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
                  <p className="text-sidebar-foreground/70">
                    Manage your knowledge base and training data
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                disabled={!selectedProjectId}
                className="bg-sidebar-foreground text-sidebar hover:bg-sidebar-foreground/90 w-full sm:w-auto"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                {getAddButtonText()}
              </Button>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-2 mb-6">
              <Button
                variant={activeTab === 'browse' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('browse')}
                className={activeTab === 'browse' ? 'bg-sidebar-foreground text-sidebar' : 'text-sidebar-foreground hover:bg-sidebar-accent'}
              >
                Browse Data
              </Button>
              <Button
                variant={activeTab === 'search' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('search')}
                className={activeTab === 'search' ? 'bg-sidebar-foreground text-sidebar' : 'text-sidebar-foreground hover:bg-sidebar-accent'}
              >
                Semantic Search
              </Button>
            </div>

            {/* Search and Filters */}
            {activeTab === 'browse' && <SearchAndFilters
              filters={filters}
              onFiltersChange={setFilters}
              resultCount={filteredData.length}
            />}

            {/* Semantic Search */}
            {activeTab === 'search' && selectedProjectId && (
              <SemanticSearch 
                projectId={selectedProjectId}
                onResultClick={(result) => {
                  console.log('Search result clicked:', result)
                  // You can implement navigation to the source item here
                }}
              />
            )}

            {/* Content */}
            {activeTab === 'browse' && filteredData.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-6 sm:mt-8">
                {filteredData.map((item) => (
                  <DataCard key={item.id} item={item} />
                ))}
              </div>
            ) : activeTab === 'browse' && !selectedProjectId ? (
              <div className="text-center py-12">
                <div className="bg-sidebar-accent rounded-lg p-8 max-w-md mx-auto">
                  <div className="text-4xl mb-4">📁</div>
                  <h3 className="text-sidebar-foreground text-lg font-semibold mb-2 font-circular-web">
                    No project selected
                  </h3>
                  <p className="text-sidebar-foreground/70 mb-4">
                    Please select a project to view and manage its data
                  </p>
                </div>
              </div>
            ) : activeTab === 'browse' ? (
              <EmptyState
                hasFilters={hasFilters}
                onClearFilters={handleClearFilters}
                onCreateData={() => setIsCreateModalOpen(true)}
                currentType={getFilterDisplayName(filters.type)}
              />
            ) : null}
          </div>
        </div>
      </div>

      {/* Create Data Modal */}
      <CreateDataModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateData}
        defaultType={filters.type}
      />
    </div>
  )
}
