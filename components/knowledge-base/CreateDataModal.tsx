"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { XIcon, LoaderIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { DATA_TYPES } from './Constants'
import { CreateDataFormData, DataType } from './Types'

interface CreateDataModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateDataFormData) => Promise<void>
  defaultType?: DataType
}

export function CreateDataModal({ isOpen, onClose, onSubmit, defaultType = 'context' }: CreateDataModalProps) {
  const [formData, setFormData] = useState<CreateDataFormData>({
    title: '',
    description: '',
    content: '',
    type: defaultType,
    tags: [],
    metadata: {}
  })
  const [tagInput, setTagInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Update form type when defaultType changes and reset form
  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: '',
        description: '',
        content: '',
        type: defaultType,
        tags: [],
        metadata: {}
      })
      setTagInput('')
    }
  }, [defaultType, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      toast.error('Please enter a title')
      return
    }

    // Type-specific validation
    if (formData.type === 'product') {
      if (!formData.metadata.price) {
        toast.error('Please enter a price for the product')
        return
      }
    }

    if (formData.type === 'inquiry') {
      if (!formData.description.trim()) {
        toast.error('Please enter a description for the inquiry')
        return
      }
    }

    if (formData.type === 'issue') {
      if (!formData.metadata.severity) {
        toast.error('Please select a severity level')
        return
      }
      if (!formData.metadata.status) {
        toast.error('Please select a status')
        return
      }
    }

    setIsSubmitting(true)
    try {
      await onSubmit({
        ...formData,
        project_id: formData.project_id || 'default-project-id'
      })
      // Reset form
      setFormData({
        title: '',
        description: '',
        content: '',
        type: defaultType,
        tags: [],
        metadata: {}
      })
      setTagInput('')
      onClose()
      toast.success('Data created successfully!')
    } catch (error) {
      toast.error('Failed to create data')
    } finally {
      setIsSubmitting(false)
    }
  }

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }))
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  const updateMetadata = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        [key]: value
      }
    }))
  }

  const getTypeDisplayName = () => {
    const typeConfig = DATA_TYPES.find(t => t.id === formData.type)
    return typeConfig?.name || 'Data'
  }

  const renderTypeSpecificFields = () => {
    switch (formData.type) {
      case 'product':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="price" className="text-sidebar-foreground font-medium">
                Price *
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.metadata.price || ''}
                onChange={(e) => updateMetadata('price', parseFloat(e.target.value) || '')}
                placeholder="0.00"
                className="bg-sidebar-accent border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/50"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="affiliate-link" className="text-sidebar-foreground font-medium">
                Affiliate Link
              </Label>
              <Input
                id="affiliate-link"
                type="url"
                value={formData.metadata.affiliateLink || ''}
                onChange={(e) => updateMetadata('affiliateLink', e.target.value)}
                placeholder="https://example.com/product"
                className="bg-sidebar-accent border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/50"
                disabled={isSubmitting}
              />
            </div>
          </>
        )

      case 'issue':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="severity" className="text-sidebar-foreground font-medium">
                Severity *
              </Label>
              <Select 
                value={formData.metadata.severity || ''} 
                onValueChange={(value) => updateMetadata('severity', value)}
                disabled={isSubmitting}
              >
                <SelectTrigger className="bg-sidebar-accent border-sidebar-border text-sidebar-foreground">
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="text-sidebar-foreground font-medium">
                Status *
              </Label>
              <Select 
                value={formData.metadata.status || ''} 
                onValueChange={(value) => updateMetadata('status', value)}
                disabled={isSubmitting}
              >
                <SelectTrigger className="bg-sidebar-accent border-sidebar-border text-sidebar-foreground">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tags for issues */}
            <div className="space-y-2">
              <Label htmlFor="tags" className="text-sidebar-foreground font-medium">
                Tags
              </Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Add tags..."
                  className="flex-1 bg-sidebar-accent border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/50"
                  disabled={isSubmitting}
                />
                <Button
                  type="button"
                  onClick={addTag}
                  variant="outline"
                  className="bg-sidebar-accent border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent/80"
                  disabled={isSubmitting}
                >
                  Add
                </Button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="bg-sidebar-foreground/10 text-sidebar-foreground border-sidebar-foreground/20 cursor-pointer hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 transition-colors"
                      onClick={() => removeTag(tag)}
                    >
                      {tag} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </>
        )

      default:
        return null
    }
  }

  const getTitleLabel = () => {
    switch (formData.type) {
      case 'product':
        return 'Product Name *'
      case 'inquiry':
        return 'Question *'
      case 'issue':
        return 'Issue Title *'
      default:
        return 'Title *'
    }
  }

  const getTitlePlaceholder = () => {
    switch (formData.type) {
      case 'product':
        return 'Enter the product name'
      case 'inquiry':
        return 'What is your question?'
      case 'issue':
        return 'Brief description of the issue'
      default:
        return 'Enter a descriptive title'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-sidebar border border-sidebar-border rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-sidebar-border">
          <h2 className="text-xl font-semibold text-sidebar-foreground">Add New {getTypeDisplayName()}</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <XIcon className="h-5 w-5" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sidebar-foreground font-medium">
              {getTitleLabel()}
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder={getTitlePlaceholder()}
              className="bg-sidebar-accent border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/50"
              disabled={isSubmitting}
            />
          </div>

          {/* Type-specific fields */}
          {renderTypeSpecificFields()}

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sidebar-foreground font-medium">
              Description {formData.type === 'inquiry' ? '*' : ''}
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder={
                formData.type === 'inquiry' 
                  ? 'Provide more details about your question'
                  : formData.type === 'issue'
                  ? 'Detailed description of the issue'
                  : formData.type === 'product'
                  ? 'Product description and features'
                  : 'Brief description of this data'
              }
              className="min-h-[80px] bg-sidebar-accent border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/50 resize-none"
              disabled={isSubmitting}
            />
          </div>

          {/* Content field for context type only */}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-sidebar-border">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="bg-sidebar-accent border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent/80"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-sidebar-foreground text-sidebar hover:bg-sidebar-foreground/90"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <LoaderIcon className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              `Create ${getTypeDisplayName()}`
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
