"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Settings,
  Filter,
  Calendar,
  Circle,
  CheckCircle2,
  AlertCircle,
  FileText,
  Building2,
} from "lucide-react";
import { useRole } from "@/hooks/use-role";

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
} from "@/components/ui/sidebar";

const employeeNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Aufgaben", href: "/tasks", icon: FileText },
  { name: "Team", href: "/team", icon: Users },
  { name: "Mandanten", href: "/companies", icon: Building2 },
  { name: "Einstellungen", href: "/settings", icon: Settings },
];

const customerNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Meine Aufgaben", href: "/tasks", icon: FileText },
  { name: "Einstellungen", href: "/settings", icon: Settings },
];

// Filters based on traffic light system
const filters = [
  { name: "Alle", icon: Filter, count: 24, filter: "all" },
  { name: "Diese Woche", icon: Calendar, count: 8, filter: "this-week" },
  { name: "Nicht bearbeitet", icon: Circle, count: 5, filter: "yellow", color: "text-yellow-500" },
  { name: "Bearbeitet", icon: CheckCircle2, count: 12, filter: "green", color: "text-green-500" },
  { name: "Überfällig", icon: AlertCircle, count: 3, filter: "red", color: "text-red-500" },
  { name: "Erledigt", icon: CheckCircle2, count: 10, filter: "completed", color: "text-slate-400" },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentFilter = searchParams.get("filter") || "all";
  const { isEmployee } = useRole();

  const navigation = isEmployee ? employeeNavigation : customerNavigation;

  const getFilterHref = (filter: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (filter === "all") {
      params.delete("filter");
    } else {
      params.set("filter", filter);
    }
    const queryString = params.toString();
    return `/tasks${queryString ? `?${queryString}` : ""}`;
  };

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

        {/* Filters - Ampel-System */}
        <SidebarGroup>
          <SidebarGroupLabel>Aufgaben-Filter</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filters.map((filter) => (
                <SidebarMenuItem key={filter.name}>
                  <SidebarMenuButton
                    asChild
                    isActive={currentFilter === filter.filter && pathname.startsWith("/tasks")}
                    tooltip={filter.name}
                  >
                    <Link href={getFilterHref(filter.filter)}>
                      <filter.icon className={filter.color} />
                      <span>{filter.name}</span>
                    </Link>
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
  );
}
