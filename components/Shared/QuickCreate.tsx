"use client"

import * as React from "react"
import { useState } from "react"
import { 
  CheckIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  BotIcon,
  SparklesIcon,
  XIcon,
  TwitterIcon,
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
  GlobeIcon,
  BookOpenIcon,
  FlaskConicalIcon,
  DatabaseIcon,
  ArrowUpRightIcon,
  ZapIcon
} from "lucide-react"

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import { Badge } from '@/components/ui/Badge'
import { Switch } from '@/components/ui/Switch'
import { useProjects } from '@/hooks/use-projects'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'

interface Plan {
  id: 'personal' | 'creator' | 'business'
  name: string
  price: number
  description: string
  features: string[]
  popular?: boolean
  badge?: string
  buttonText?: string
  buttonVariant?: 'default' | 'outline' | 'secondary'
}

const plans: Plan[] = [
  {
    id: 'personal',
    name: 'Personal',
    price: 2,
    description: 'Perfect for individual creators and personal projects',
    features: [
      '500+ Long Chats',
      '10,000+ Short Chats',
      'Standard data templates',
      'Publicly accessible chatbots',
      'Analytics feature'
    ],
    buttonText: 'Get Started',
    buttonVariant: 'outline'
  },
  {
    id: 'creator',
    name: 'Creator',
    price: 19,
    description: 'More power for content creators and professionals',
    features: [
      'Everything in Personal',
      '2 Project Collaborators',
      '5,000+ Long Chats',
      '100,000+ Short Chats',
      'Image context'
    ],
    popular: true,
    badge: 'POPULAR',
    buttonText: 'Start Creating',
    buttonVariant: 'default'
  },
  {
    id: 'business',
    name: 'Business',
    price: 99,
    description: 'Enterprise features for teams and organizations',
    features: [
      'Everything in Creator plan',
      '10 Project Collaborators',
      '50,000+ Long Chats',
      '1,000,000+ Short Chats',
      'Priority support'
    ],
    buttonText: 'Scale Your Business',
    buttonVariant: 'outline'
  }
]

const socialPlatforms = [
  { id: 'twitter', name: 'Twitter', icon: TwitterIcon, placeholder: 'https://twitter.com/username' },
  { id: 'facebook', name: 'Facebook', icon: FacebookIcon, placeholder: 'https://facebook.com/page' },
  { id: 'instagram', name: 'Instagram', icon: InstagramIcon, placeholder: 'https://instagram.com/username' },
  { id: 'linkedin', name: 'LinkedIn', icon: LinkedinIcon, placeholder: 'https://linkedin.com/in/username' },
  { id: 'website', name: 'Website', icon: GlobeIcon, placeholder: 'https://yourwebsite.com' }
]

interface QuickCreateProps {
  onClose: () => void
  onComplete: (projectSlug?: string) => void
}

export function QuickCreate({ onClose, onComplete }: QuickCreateProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedPlan, setSelectedPlan] = useState<'personal' | 'creator' | 'business'>('creator')
  const [projectName, setProjectName] = useState('')
  const [description, setDescription] = useState('')
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({})
  const [customSlug, setCustomSlug] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  
  const { createProject } = useProjects()
  const { user } = useAuth()

  const handleNext = () => {
    if (currentStep === 2) {
      // Create project after step 2 is completed
      handleCreateProject()
    } else if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    } else {
      // Navigate to customize project (step 3 completion)
      handleCustomizeProject()
    }
  }

  const handleCreateProject = async () => {
    if (!user) {
      toast.error('You must be logged in to create a project')
      return
    }

    if (!projectName.trim() || !description.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsCreating(true)

    try {
      // Filter out empty social links
      const filteredSocialLinks = Object.fromEntries(
        Object.entries(socialLinks).filter(([_, value]) => value.trim() !== '')
      )

      const { data, error } = await createProject({
        name: projectName.trim(),
        description: description.trim(),
        plan: selectedPlan,
        is_public: isPublic,
        custom_slug: customSlug.trim() || null,
        social_links: Object.keys(filteredSocialLinks).length > 0 ? filteredSocialLinks : null,
      })

      if (error) {
        toast.error(`Failed to create project: ${error}`)
        return
      }

      if (data) {
        toast.success(`Project "${data.name}" created successfully!`)
        // Move to step 3 (success page) after successful creation
        setCurrentStep(3)
      }
    } catch (err) {
      toast.error('An unexpected error occurred while creating the project')
      console.error('Project creation error:', err)
    } finally {
      setIsCreating(false)
    }
  }

  const handleCustomizeProject = () => {
    // Get the project slug from the created project
    // Since we just created it, we can generate the slug from the project name
    const projectSlug = projectName.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .replace(/^-+|-+$/g, '')
    
    onComplete(projectSlug)
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedPlan !== null
      case 2:
        return projectName.trim() !== '' && description.trim() !== ''
      case 3:
        return true // Guide step, always can proceed
      default:
        return false
    }
  }

  const handleSocialLinkChange = (platform: string, value: string) => {
    setSocialLinks(prev => ({
      ...prev,
      [platform]: value
    }))
  }

  const renderStep1 = () => (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-sidebar-foreground mb-3 font-general">Choose Your Plan</h2>
        <p className="text-sidebar-foreground/70 text-lg">Select the plan that best fits your needs</p>
        
        {/* Billing Toggle with better spacing */}
        <div className="flex items-center justify-center gap-6 mt-8">
          <span className="text-sm text-sidebar-foreground/70 font-medium">Monthly</span>
          <div className="relative">
            <div className="w-12 h-6 bg-sidebar-border rounded-full p-1">
              <div className="w-4 h-4 bg-sidebar-foreground rounded-full transition-transform"></div>
            </div>
          </div>
          <span className="text-sm text-sidebar-foreground/70 font-medium">Annual</span>
          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 text-xs">
            Save 10%
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`relative p-8 cursor-pointer transition-all duration-300 hover:scale-105 flex flex-col bg-sidebar-accent ${
              selectedPlan === plan.id
                ? 'shadow-lg shadow-sidebar-foreground/20'
                : 'hover:shadow-lg'
            } ${plan.popular ? 'scale-105' : ''}`}
            onClick={() => setSelectedPlan(plan.id)}
          >
            {plan.badge && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-sidebar-foreground text-sidebar px-4 py-1.5 text-xs font-semibold shadow-lg">
                  {plan.badge}
                </Badge>
              </div>
            )}

            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-sidebar-foreground mb-3 font-general">{plan.name}</h3>
              <p className="text-sidebar-foreground/70 text-sm mb-6 leading-relaxed">{plan.description}</p>
              
              <div className="mb-4">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-sidebar-foreground">${plan.price}</span>
                  <span className="text-sidebar-foreground/70 text-lg">/ month</span>
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-8 flex-1">
              {plan.features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center mt-0.5">
                    <CheckIcon className="h-3 w-3 text-green-500" />
                  </div>
                  <span className="text-sidebar-foreground/80 text-sm leading-relaxed">{feature}</span>
                </div>
              ))}
            </div>

            <Button
              className={`w-full py-3 font-semibold transition-all duration-200 mt-auto ${
                selectedPlan === plan.id
                  ? 'bg-sidebar-foreground hover:bg-sidebar-foreground/90 text-sidebar shadow-lg'
                  : plan.popular
                  ? 'bg-sidebar-foreground hover:bg-sidebar-foreground/90 text-sidebar shadow-lg'
                  : 'bg-sidebar-accent border-2 border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent/80 hover:border-sidebar-foreground/30'
              }`}
              variant={selectedPlan === plan.id ? 'default' : plan.buttonVariant}
            >
              {selectedPlan === plan.id ? (
                <div className="flex items-center gap-2">
                  <CheckIcon className="h-4 w-4" />
                  Selected
                </div>
              ) : (
                plan.buttonText
              )}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-sidebar-foreground mb-2 font-general">Project Setup</h2>
        <p className="text-sidebar-foreground/70">Configure your chatbot's basic information</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="project-name" className="text-sidebar-foreground font-medium">
            Project Name *
          </Label>
          <Input
            id="project-name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Enter your project name"
            className="bg-sidebar-accent border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/50"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="custom-slug" className="text-sidebar-foreground font-medium">
            Custom URL (optional)
          </Label>
          <Input
            id="custom-slug"
            value={customSlug}
            onChange={(e) => setCustomSlug(e.target.value)}
            placeholder="my-custom-chatbot-url"
            className="bg-sidebar-accent border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/50"
          />
          <p className="text-xs text-sidebar-foreground/60">
            Leave empty to auto-generate from project name. Only letters, numbers, and hyphens allowed.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-sidebar-foreground font-medium">
            Description *
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what your chatbot should do and how it should behave..."
            className="min-h-[120px] bg-sidebar-accent border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/50"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="is-public"
            checked={isPublic}
            onCheckedChange={setIsPublic}
          />
          <Label htmlFor="is-public" className="text-sidebar-foreground font-medium">
            Make this chatbot publicly available
          </Label>
        </div>
        <p className="text-xs text-sidebar-foreground/60 -mt-2">
          Public chatbots can be discovered and used by anyone. You can change this later.
        </p>

        <div className="space-y-4">
          <Label className="text-sidebar-foreground font-medium">
            Social Links (Optional)
          </Label>
          <p className="text-xs text-sidebar-foreground/60 -mt-2">
            Add your social media profiles to help train your chatbot with your brand voice
          </p>
          
          <div className="grid grid-cols-1 gap-4">
            {socialPlatforms.map((platform) => (
              <div key={platform.id} className="flex items-center gap-3">
                <div className="flex items-center gap-2 min-w-[100px]">
                  <platform.icon className="h-4 w-4 text-sidebar-foreground/70" />
                  <span className="text-sm text-sidebar-foreground/80">{platform.name}</span>
                </div>
                <Input
                  value={socialLinks[platform.id] || ''}
                  onChange={(e) => handleSocialLinkChange(platform.id, e.target.value)}
                  placeholder={platform.placeholder}
                  className="flex-1 bg-sidebar-accent border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/50"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckIcon className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-sidebar-foreground mb-2 font-circular-web">Project Created Successfully!</h2>
        <p className="text-sidebar-foreground/70">Your chatbot project "{projectName}" is ready. Here's how to continue:</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Data Library Guide */}
        <Card className="bg-sidebar-accent border-sidebar-border p-6 hover:border-sidebar-foreground/20 transition-colors">
          <div className="flex items-start gap-4">
            <div className="bg-purple-500 p-3 rounded-lg flex-shrink-0">
              <DatabaseIcon className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-sidebar-foreground font-semibold mb-2 font-general">
                Add Knowledge to Your AI
              </h3>
              <p className="text-sidebar-foreground/70 text-sm mb-4 leading-relaxed">
                Visit the <strong>Data Library</strong> to upload documents, add website content, or create custom knowledge bases. This is where you train your AI with specific information.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-sidebar-foreground/60">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                  <span>Upload PDFs, docs, and text files</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-sidebar-foreground/60">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                  <span>Import website content</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-sidebar-foreground/60">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                  <span>Create custom knowledge entries</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Playground Guide */}
        <Card className="bg-sidebar-accent border-sidebar-border p-6 hover:border-sidebar-foreground/20 transition-colors">
          <div className="flex items-start gap-4">
            <div className="bg-blue-500 p-3 rounded-lg flex-shrink-0">
              <FlaskConicalIcon className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-sidebar-foreground font-semibold mb-2 font-general">
                Test Your Chatbot
              </h3>
              <p className="text-sidebar-foreground/70 text-sm mb-4 leading-relaxed">
                Use the <strong>Playground</strong> to test your AI chatbot in real-time. Adjust settings, refine responses, and perfect the conversation flow.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-sidebar-foreground/60">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  <span>Real-time conversation testing</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-sidebar-foreground/60">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  <span>Adjust AI parameters</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-sidebar-foreground/60">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  <span>Fine-tune responses</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Project Summary */}
      <Card className="bg-sidebar-accent border-sidebar-border p-6">
        <h4 className="text-sidebar-foreground font-medium mb-4 font-general">Project Summary</h4>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-sidebar-foreground/70">Project Name:</span>
            <span className="text-sidebar-foreground font-medium">{projectName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sidebar-foreground/70">Plan:</span>
            <span className="text-sidebar-foreground font-medium">{plans.find(p => p.id === selectedPlan)?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sidebar-foreground/70">Visibility:</span>
            <span className="text-sidebar-foreground font-medium">{isPublic ? 'Public' : 'Private'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sidebar-foreground/70">Monthly Price:</span>
            <span className="text-sidebar-foreground font-medium">${plans.find(p => p.id === selectedPlan)?.price}/month</span>
          </div>
          {customSlug && (
            <div className="flex justify-between">
              <span className="text-sidebar-foreground/70">Custom URL:</span>
              <span className="text-sidebar-foreground font-medium font-mono text-sm">{customSlug}</span>
            </div>
          )}
          {Object.keys(socialLinks).filter(key => socialLinks[key]).length > 0 && (
            <div className="pt-2 border-t border-sidebar-border">
              <span className="text-sidebar-foreground/70 text-xs">Connected Social Links:</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {Object.entries(socialLinks).filter(([_, url]) => url).map(([platform, _]) => (
                  <Badge key={platform} variant="outline" className="text-xs bg-sidebar-foreground/10 text-sidebar-foreground/70 border-sidebar-foreground/20">
                    {socialPlatforms.find(p => p.id === platform)?.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )

  return (
    <div className="flex flex-col h-full w-full max-w-full overflow-hidden bg-background">
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* Content */}
        <div className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-sidebar-border bg-background px-4 sm:px-6 lg:px-8 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="text-white/70 hover:text-white hover:bg-sidebar-accent"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="flex items-center gap-3">
            <span className="text-sm text-white/60">
              Step {currentStep} of 3
            </span>
            <Button
              onClick={currentStep === 3 ? handleCustomizeProject : handleNext}
              disabled={!canProceed() || isCreating}
              className="bg-white hover:bg-gray-100 text-black font-medium"
            >
              {isCreating ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  {currentStep === 3 ? `Go to ${projectName}` : 'Continue'}
                  <ArrowRightIcon className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
