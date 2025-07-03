import { Separator } from '@/components/ui/Separator'
import { SidebarTrigger } from '@/components/ui/Sidebar'

export function SiteHeader({ currentView }: { currentView?: string }) {
  const getPageTitle = () => {
    switch (currentView) {
      case 'dashboard':
        return 'Dashboard'
      case 'settings':
        return 'Settings'
      case 'help-support':
        return 'Help & Support'
      case 'discover':
        return 'Discover'
      case 'playground':
        return 'Playground'
      case 'projects':
        return 'Projects'
      case 'dashboard-project-detail':
        return 'Project Details'
      case 'data-library':
        return 'Data Library'
      case 'quick-create':
        return 'Quick Create'
      case 'chat':
        return 'Chat'
      default:
        return 'Dashboard'
    }
  }

  return (
    <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center gap-2 border-b border-sidebar-border bg-background transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1 text-sidebar-foreground hover:text-sidebar-foreground" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4 bg-sidebar-border"
        />
        <h1 className="text-base font-medium text-sidebar-foreground font-general">{getPageTitle()}</h1>
      </div>
    </header>
  )
}
