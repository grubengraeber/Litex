"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Settings,
  Filter,
  Calendar,
  Star,
  CheckCircle,
  Archive,
  FileText,
  Building2,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Aufgaben", href: "/tasks", icon: FileText },
  { name: "Team", href: "/team", icon: Users },
  { name: "Mandanten", href: "/companies", icon: Building2 },
  { name: "Einstellungen", href: "/settings", icon: Settings },
]

const filters = [
  { name: "Alle", icon: Filter, count: 24, filter: "all" },
  { name: "Diese Woche", icon: Calendar, count: 8, filter: "due-this-week" },
  { name: "Prioritäten", icon: Star, count: 5, filter: "priorities" },
  { name: "Erledigt", icon: CheckCircle, count: 12, filter: "completed" },
  { name: "Archiviert", icon: Archive, count: 3, filter: "archived" },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const [activeFilter, setActiveFilter] = React.useState("all")

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                  <span className="font-bold">L</span>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Litex</span>
                  <span className="truncate text-xs text-muted-foreground">ALB Klientenportal</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
                    tooltip={item.name}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Filters */}
        <SidebarGroup>
          <SidebarGroupLabel>Filter</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filters.map((filter) => (
                <SidebarMenuItem key={filter.name}>
                  <SidebarMenuButton
                    isActive={activeFilter === filter.filter}
                    onClick={() => setActiveFilter(filter.filter)}
                    tooltip={filter.name}
                  >
                    <filter.icon />
                    <span>{filter.name}</span>
                  </SidebarMenuButton>
                  <SidebarMenuBadge>{filter.count}</SidebarMenuBadge>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Einstellungen">
              <Link href="/settings">
                <Settings />
                <span>Einstellungen</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
