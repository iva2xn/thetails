"use client"

import * as React from "react"
import { DivideIcon as LucideIcon } from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/Sidebar'

export function NavSecondary({
  items,
  onNavigate,
  ...props
}: {
  items: {
    title: string
    url: string
    icon: LucideIcon
    onClick?: () => void
  }[]
  onNavigate?: (path: string) => void
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton 
                onClick={item.onClick || (() => onNavigate?.(item.url))}
              >
                  <item.icon />
                  <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
