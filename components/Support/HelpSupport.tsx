"use client"

import * as React from "react"
import { 
  SearchIcon,
  BookOpenIcon,
  MessageCircleIcon,
  MailIcon,
  PhoneIcon,
  HelpCircleIcon,
  FileTextIcon,
  VideoIcon,
  ExternalLinkIcon,
  ChevronRightIcon,
  ClockIcon,
  CheckCircleIcon,
  SettingsIcon
} from "lucide-react"

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'

const faqItems = [
  {
    id: 1,
    question: "How do I create my first AI chatbot?",
    answer: "You can create your first chatbot by clicking the 'Quick Create' button in the sidebar or navigating to the Projects page and clicking 'Create Project'.",
    category: "Getting Started"
  },
  {
    id: 2,
    question: "What file formats can I upload to the knowledge base?",
    answer: "You can upload PDF, DOC, DOCX, TXT files, and also add content from URLs or create custom text entries.",
    category: "Knowledge Base"
  },
  {
    id: 3,
    question: "How do I integrate my chatbot with my website?",
    answer: "Once your chatbot is created, you can embed it using our JavaScript widget or use our API for custom integrations.",
    category: "Integration"
  },
  {
    id: 4,
    question: "What's the difference between the pricing plans?",
    answer: "Personal plan is for individual use, Creator plan adds collaboration features, and Business plan includes enterprise features and priority support.",
    category: "Billing"
  },
  {
    id: 5,
    question: "How do I train my AI with custom data?",
    answer: "Use the Data Library to upload documents, add website content, or create custom knowledge entries that your AI will use to answer questions.",
    category: "AI Training"
  },
  {
    id: 6,
    question: "Can I customize the appearance of my chatbot?",
    answer: "Yes, you can customize colors, fonts, and styling through the appearance settings in your project configuration.",
    category: "Customization"
  }
]

const supportChannels = [
  {
    id: 'chat',
    name: 'Live Chat',
    description: 'Get instant help from our support team',
    icon: MessageCircleIcon,
    availability: 'Available 24/7',
    responseTime: 'Usually responds in minutes',
    action: 'Start Chat',
    available: true,
    color: 'bg-blue-500'
  },
  {
    id: 'email',
    name: 'Email Support',
    description: 'Send us a detailed message',
    icon: MailIcon,
    availability: 'Available 24/7',
    responseTime: 'Usually responds within 4 hours',
    action: 'Send Email',
    available: true,
    color: 'bg-green-500'
  },
  {
    id: 'phone',
    name: 'Phone Support',
    description: 'Speak directly with our team',
    icon: PhoneIcon,
    availability: 'Mon-Fri, 9AM-6PM EST',
    responseTime: 'Immediate',
    action: 'Call Now',
    available: false,
    color: 'bg-purple-500'
  }
]

const resources = [
  {
    id: 1,
    title: "Getting Started Guide",
    description: "Learn the basics of creating and managing your AI chatbots",
    icon: BookOpenIcon,
    type: "Documentation",
    readTime: "5 min read",
    color: 'bg-blue-500'
  },
  {
    id: 2,
    title: "API Documentation",
    description: "Complete reference for integrating with our API",
    icon: FileTextIcon,
    type: "Documentation",
    readTime: "15 min read",
    color: 'bg-green-500'
  },
  {
    id: 3,
    title: "Video Tutorials",
    description: "Step-by-step video guides for common tasks",
    icon: VideoIcon,
    type: "Video",
    readTime: "10 min watch",
    color: 'bg-red-500'
  },
  {
    id: 4,
    title: "Best Practices",
    description: "Tips and tricks for optimizing your chatbot performance",
    icon: CheckCircleIcon,
    type: "Guide",
    readTime: "8 min read",
    color: 'bg-purple-500'
  }
]

export function HelpSupport() {
  const [searchTerm, setSearchTerm] = React.useState("")
  const [selectedCategory, setSelectedCategory] = React.useState("All")

  const categories = ["All", "Getting Started", "Knowledge Base", "Integration", "Billing", "AI Training", "Customization"]

  const filteredFAQs = faqItems.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.answer.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="flex flex-col h-full w-full max-w-full overflow-hidden bg-background">
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-semibold text-sidebar-foreground mb-2 font-general">
                Help & Support
              </h1>
              <p className="text-sidebar-foreground/70">
                Get help, find answers, and learn how to make the most of your AI chatbots
              </p>
            </div>

            {/* Search */}
            <div className="mb-8">
              <div className="relative max-w-2xl mx-auto">
                <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-sidebar-foreground/40" />
                <Input
                  placeholder="Search for help articles, guides, and FAQs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 py-4 bg-sidebar border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/40 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                />
              </div>
            </div>

            {/* Support Channels */}
            <div className="mb-12">
              <h2 className="text-xl font-semibold text-sidebar-foreground mb-6 font-general">Contact Support</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {supportChannels.map((channel) => (
                  <Card
                    key={channel.id}
                    className={`bg-sidebar-accent border-sidebar-border p-6 transition-all duration-200 ${
                      channel.available 
                        ? 'hover:border-sidebar-foreground/20 hover:shadow-lg cursor-pointer' 
                        : 'opacity-60'
                    }`}
                  >
                    <div className="flex flex-col h-full">
                      <div className="flex items-start gap-4 mb-4">
                        <div className={`${channel.color} p-3 rounded-lg flex-shrink-0`}>
                          <channel.icon className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sidebar-foreground font-semibold mb-1 font-general">{channel.name}</h3>
                          <p className="text-sidebar-foreground/70 text-sm">{channel.description}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-4 flex-1">
                        <div className="flex items-center gap-2 text-xs text-sidebar-foreground/60">
                          <ClockIcon className="h-3 w-3 flex-shrink-0" />
                          <span>{channel.availability}</span>
                        </div>
                        <p className="text-xs text-sidebar-foreground/60">{channel.responseTime}</p>
                      </div>
                      
                      <Button
                        size="sm"
                        disabled={!channel.available}
                        className={`w-full ${
                          channel.available
                            ? "bg-sidebar-foreground text-sidebar hover:bg-sidebar-foreground/90"
                            : "bg-sidebar-border text-sidebar-foreground/50 cursor-not-allowed"
                        }`}
                      >
                        {channel.action}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Resources */}
            <div className="mb-12">
              <h2 className="text-xl font-semibold text-sidebar-foreground mb-6 font-general">Resources</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {resources.map((resource) => (
                  <Card
                    key={resource.id}
                    className="bg-sidebar-accent border-sidebar-border hover:border-sidebar-foreground/20 hover:shadow-lg transition-all duration-200 cursor-pointer p-6"
                  >
                    <div className="flex flex-col h-full">
                      <div className="flex items-start gap-3 mb-4">
                        <div className={`${resource.color} p-2 rounded-lg flex-shrink-0`}>
                          <resource.icon className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sidebar-foreground font-medium mb-2 line-clamp-2 leading-tight font-general">
                            {resource.title}
                          </h3>
                        </div>
                      </div>
                      
                      <p className="text-sidebar-foreground/70 text-sm mb-4 line-clamp-2 flex-1">
                        {resource.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs bg-sidebar-foreground/10 text-sidebar-foreground/70 border-sidebar-foreground/20">
                          {resource.type}
                        </Badge>
                        <span className="text-xs text-sidebar-foreground/60">{resource.readTime}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* FAQ Section */}
            <div>
              <h2 className="text-xl font-semibold text-sidebar-foreground mb-6 font-general">Frequently Asked Questions</h2>
              
              {/* Category Filters */}
              <div className="mb-6">
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
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
                      }`}
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </div>

              {/* FAQ Items */}
              {filteredFAQs.length > 0 ? (
                <div className="space-y-4">
                  {filteredFAQs.map((faq) => (
                    <Card
                      key={faq.id}
                      className="bg-sidebar-accent border-sidebar-border hover:border-sidebar-foreground/20 hover:shadow-lg transition-all duration-200 cursor-pointer p-6"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                            <h3 className="text-sidebar-foreground font-medium flex-1 font-general">
                              {faq.question}
                            </h3>
                            <Badge variant="outline" className="text-xs bg-sidebar-foreground/10 text-sidebar-foreground/70 border-sidebar-foreground/20 w-fit">
                              {faq.category}
                            </Badge>
                          </div>
                          <p className="text-sidebar-foreground/70 text-sm leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                        <ChevronRightIcon className="h-5 w-5 text-sidebar-foreground/40 flex-shrink-0 mt-1" />
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-sidebar-accent rounded-full flex items-center justify-center mx-auto mb-4">
                    <HelpCircleIcon className="h-8 w-8 text-sidebar-foreground/40" />
                  </div>
                  <h3 className="text-sidebar-foreground font-medium mb-2 font-general">No FAQs found</h3>
                  <p className="text-sidebar-foreground/70 mb-6">
                    No FAQs found matching your search criteria.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("")
                      setSelectedCategory("All")
                    }}
                    className="bg-sidebar-accent border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent/80"
                  >
                    Clear filters
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
