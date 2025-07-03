"use client"

import * as React from "react"
import { 
  UserIcon,
  BellIcon,
  ShieldIcon,
  CreditCardIcon,
  KeyIcon,
  DatabaseIcon,
  PaletteIcon,
  GlobeIcon,
  DownloadIcon,
  TrashIcon,
  SaveIcon,
  CheckIcon,
  Settings as SettingsIcon
} from "lucide-react"

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import { Badge } from '@/components/ui/Badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'

const settingsCategories = [
  {
    id: 'profile',
    name: 'Profile',
    icon: UserIcon,
    description: 'Personal information'
  },
  {
    id: 'notifications',
    name: 'Notifications',
    icon: BellIcon,
    description: 'Updates and alerts'
  },
  {
    id: 'security',
    name: 'Security',
    icon: ShieldIcon,
    description: 'Password & 2FA'
  },
  {
    id: 'billing',
    name: 'Billing',
    icon: CreditCardIcon,
    description: 'Subscription & payments'
  },
  {
    id: 'api',
    name: 'API Keys',
    icon: KeyIcon,
    description: 'Integration keys'
  },
  {
    id: 'data',
    name: 'Data & Privacy',
    icon: DatabaseIcon,
    description: 'Export & privacy'
  },
  {
    id: 'appearance',
    name: 'Appearance',
    icon: PaletteIcon,
    description: 'Theme & UI'
  },
  {
    id: 'integrations',
    name: 'Integrations',
    icon: GlobeIcon,
    description: 'External services'
  }
]

export function Settings() {
  const [activeCategory, setActiveCategory] = React.useState('profile')
  const [isSaving, setIsSaving] = React.useState(false)
  const { user } = useAuth()

  const handleSave = async () => {
    setIsSaving(true)
    // Simulate save operation
    await new Promise(resolve => setTimeout(resolve, 1000))
    toast.success('Settings saved successfully!')
    setIsSaving(false)
  }

  const renderProfileSettings = () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-semibold text-sidebar-foreground mb-2 font-general">Profile Information</h3>
        <p className="text-sidebar-foreground/70 text-sm mb-6">Update your personal details and preferences.</p>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="full-name" className="text-sidebar-foreground font-medium">
                Full Name
              </Label>
              <Input
                id="full-name"
                defaultValue={user?.user_metadata?.full_name || ''}
                placeholder="Enter your full name"
                className="bg-sidebar border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sidebar-foreground font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                defaultValue={user?.email || ''}
                disabled
                className="bg-sidebar-accent/50 border-sidebar-border text-sidebar-foreground/70 cursor-not-allowed"
              />
              <p className="text-xs text-sidebar-foreground/60">Email cannot be changed</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sidebar-foreground font-medium">
                Username
              </Label>
              <Input
                id="username"
                defaultValue={user?.email?.split('@')[0] || ''}
                placeholder="Choose a username"
                className="bg-sidebar border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="timezone" className="text-sidebar-foreground font-medium">
                Timezone
              </Label>
              <Select defaultValue="utc">
                <SelectTrigger className="bg-sidebar border-sidebar-border text-sidebar-foreground focus:ring-2 focus:ring-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="utc">UTC (Coordinated Universal Time)</SelectItem>
                  <SelectItem value="est">EST (Eastern Standard Time)</SelectItem>
                  <SelectItem value="pst">PST (Pacific Standard Time)</SelectItem>
                  <SelectItem value="cet">CET (Central European Time)</SelectItem>
                  <SelectItem value="jst">JST (Japan Standard Time)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio" className="text-sidebar-foreground font-medium">
              Bio
            </Label>
            <Textarea
              id="bio"
              placeholder="Tell us about yourself..."
              className="min-h-[100px] bg-sidebar border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-sidebar-foreground/60">Brief description for your profile</p>
          </div>
        </div>
      </div>
    </div>
  )

  const renderPlaceholderContent = (title: string, description: string, comingSoon = true) => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-sidebar-foreground mb-2">{title}</h3>
        <p className="text-sidebar-foreground/70 text-sm mb-6">{description}</p>
      </div>
      
      <Card className="bg-sidebar border-sidebar-border p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-sidebar-accent rounded-full flex items-center justify-center mx-auto mb-4">
            <SettingsIcon className="w-6 h-6 mr-2" />
          </div>
          <h4 className="text-sidebar-foreground font-medium mb-2 font-general">
            {comingSoon ? 'Coming Soon' : 'Not Available'}
          </h4>
          <p className="text-sidebar-foreground/70 text-sm">
            {comingSoon 
              ? 'This feature is currently in development and will be available soon.'
              : 'This feature is not available in your current plan.'
            }
          </p>
        </div>
      </Card>
    </div>
  )

  const renderCategoryContent = () => {
    switch (activeCategory) {
      case 'profile':
        return renderProfileSettings()
      case 'notifications':
        return renderPlaceholderContent(
          'Notification Preferences',
          'Configure how you want to receive notifications and updates.'
        )
      case 'security':
        return renderPlaceholderContent(
          'Security Settings',
          'Manage your password, two-factor authentication, and security preferences.'
        )
      case 'billing':
        return renderPlaceholderContent(
          'Billing & Subscription',
          'Manage your subscription, payment methods, and billing history.'
        )
      case 'api':
        return renderPlaceholderContent(
          'API Keys',
          'Generate and manage API keys for integrations and custom applications.'
        )
      case 'data':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-sidebar-foreground mb-2 font-general">Data & Privacy</h3>
              <p className="text-sidebar-foreground/70 text-sm mb-6">Export your data and manage privacy settings.</p>
            </div>
            
            <div className="space-y-4">
              <Card className="bg-sidebar border-sidebar-border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sidebar-foreground font-medium mb-1 font-general">Export Data</h4>
                    <p className="text-sidebar-foreground/70 text-sm">Download all your data in JSON format</p>
                  </div>
                  <Button variant="outline" className="bg-sidebar-accent border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent/80">
                    <DownloadIcon className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </Card>
              
              <Card className="bg-sidebar border-red-500/20 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-red-500 font-medium mb-1 font-general">Delete Account</h4>
                    <p className="text-sidebar-foreground/70 text-sm">Permanently delete your account and all data</p>
                  </div>
                  <Button variant="outline" className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white">
                    <TrashIcon className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        )
      case 'appearance':
        return renderPlaceholderContent(
          'Appearance',
          'Customize the look and feel of your workspace with themes and layout options.'
        )
      case 'integrations':
        return renderPlaceholderContent(
          'Integrations',
          'Connect with external services and tools to enhance your workflow.'
        )
      default:
        return renderProfileSettings()
    }
  }

  return (
    <div className="flex flex-col h-full w-full max-w-full overflow-hidden bg-background">
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-semibold text-sidebar-foreground mb-2 font-general">
                Settings
              </h1>
              <p className="text-sidebar-foreground/70">
                Manage your account settings and preferences
              </p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
              {/* Settings Categories - Mobile: Horizontal scroll, Desktop: Vertical */}
              <div className="lg:w-80 flex-shrink-0">
                <div className="lg:sticky lg:top-6">
                  {/* Mobile: Horizontal scroll */}
                  <div className="lg:hidden">
                    <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
                      {settingsCategories.map((category) => (
                        <Button
                          key={category.id}
                          variant={activeCategory === category.id ? "default" : "ghost"}
                          size="sm"
                          className={`whitespace-nowrap flex-shrink-0 ${
                            activeCategory === category.id
                              ? "bg-sidebar-foreground text-sidebar"
                              : "text-sidebar-foreground hover:bg-sidebar-accent"
                          }`}
                          onClick={() => setActiveCategory(category.id)}
                        >
                          <category.icon className="h-4 w-4 mr-2" />
                          {category.name}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Desktop: Vertical list */}
                  <div className="hidden lg:block">
                    <div className="space-y-1">
                      {settingsCategories.map((category) => (
                        <Button
                          key={category.id}
                          variant={activeCategory === category.id ? "default" : "ghost"}
                          className={`w-full justify-start text-left h-auto p-4 ${
                            activeCategory === category.id
                              ? "bg-sidebar-foreground text-sidebar"
                              : "text-sidebar-foreground hover:bg-sidebar-accent"
                          }`}
                          onClick={() => setActiveCategory(category.id)}
                        >
                          <div className="flex items-center gap-3 w-full">
                            <category.icon className="h-5 w-5 flex-shrink-0" />
                            <div className="text-left min-w-0 flex-1">
                              <div className="font-medium">{category.name}</div>
                              <div className="text-xs opacity-70 mt-0.5 truncate">{category.description}</div>
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Settings Content */}
              <div className="flex-1 min-w-0">
                <Card className="bg-sidebar-accent border-sidebar-border">
                  <div className="p-6 sm:p-8">
                    {renderCategoryContent()}
                    
                    {/* Save Button - Only show for profile */}
                    {activeCategory === 'profile' && (
                      <div className="mt-8 pt-6 border-t border-sidebar-border">
                        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                          <p className="text-sm text-sidebar-foreground/70">
                            Changes will be saved to your profile
                          </p>
                          <Button 
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-sidebar-foreground text-sidebar hover:bg-sidebar-foreground/90 disabled:opacity-50"
                          >
                            {isSaving ? (
                              <>
                                <div className="w-4 h-4 border-2 border-sidebar border-t-transparent rounded-full animate-spin mr-2"></div>
                                Saving...
                              </>
                            ) : (
                              <>
                                <SaveIcon className="h-4 w-4 mr-2" />
                                Save Changes
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
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
