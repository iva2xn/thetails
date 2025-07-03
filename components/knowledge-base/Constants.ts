import { 
  BookOpenIcon, 
  AlertTriangleIcon, 
  HelpCircleIcon, 
  PackageIcon,
  AlertCircleIcon,
  InfoIcon,
  CheckCircleIcon
} from "lucide-react"

export const DATA_TYPES = [
  { id: 'context' as const, name: 'Context', icon: BookOpenIcon, description: 'Background information and documentation' },
  { id: 'issue' as const, name: 'Issues', icon: AlertTriangleIcon, description: 'Problems and bug reports' },
  { id: 'inquiry' as const, name: 'Inquiries', icon: HelpCircleIcon, description: 'Questions and requests for information' },
  { id: 'product' as const, name: 'Products', icon: PackageIcon, description: 'Product information and specifications' }
]

export const PRIORITY_LEVELS = {
  high: { color: 'border-orange-500/30 bg-orange-500/10 text-orange-600', icon: AlertCircleIcon },
  medium: { color: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-600', icon: InfoIcon },
  low: { color: 'border-green-500/30 bg-green-500/10 text-green-600', icon: CheckCircleIcon }
}

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'title', label: 'Title A-Z' }
]

export const MOCK_REPORT_COUNTS: Record<string, number> = {
  '1': 43,
  '2': 28,
  '3': 15,
  '4': 7,
  '5': 32,
  '6': 19
}