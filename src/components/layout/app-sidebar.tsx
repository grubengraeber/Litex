"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Settings,
  Filter,
  Circle,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  FileText,
  Building2,
  UserPlus,
  MessageSquare,
  Shield,
  ShieldCheck,
  UserCog,
  FolderOpen,
  History,
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
  { name: "Chats", href: "/chats", icon: MessageSquare },
  { name: "Dateien", href: "/files", icon: FolderOpen },
  { name: "Mandanten", href: "/companies", icon: Building2 },
];

const customerNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Meine Aufgaben", href: "/tasks", icon: FileText },
  { name: "Chats", href: "/chats", icon: MessageSquare },
  { name: "Meine Dateien", href: "/files", icon: FolderOpen },
];

// Administration section - shown at the bottom
const employeeAdministration = [
  { name: "Team", href: "/team", icon: Users },
  { name: "Benutzer", href: "/users", icon: UserCog },
  { name: "Rollen", href: "/roles", icon: Shield },
  { name: "Berechtigungen", href: "/permissions", icon: ShieldCheck },
  { name: "Audit Logs", href: "/audit-logs", icon: History },
  { name: "Einstellungen", href: "/settings", icon: Settings },
];

const customerAdministration = [
  { name: "Einstellungen", href: "/settings", icon: Settings },
];

// Filters based on status workflow and traffic light
const filters = [
  { name: "Alle", icon: Filter, count: 24, filter: "all" },
  { name: "Offen", icon: Circle, count: 8, filter: "open" },
  { name: "Eingereicht", icon: Clock, count: 5, filter: "submitted" },
  { name: "Erledigt", icon: CheckCircle2, count: 10, filter: "completed" },
  { name: "Dringend (>60 Tage)", icon: AlertCircle, count: 3, filter: "red", color: "text-red-500" },
  { name: "Warnung (>30 Tage)", icon: AlertTriangle, count: 5, filter: "yellow", color: "text-yellow-500" },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentFilter = searchParams.get("filter") || "all";
  const { isEmployee, permissions } = useRole();

  const navigation = isEmployee ? employeeNavigation : customerNavigation;
  const administration = isEmployee ? employeeAdministration : customerAdministration;

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

        {/* Filters - Status Workflow + Ampel */}
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

        {/* Quick Actions for Employees */}
        {isEmployee && permissions.canInviteUsers && (
          <SidebarGroup>
            <SidebarGroupLabel>Aktionen</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Benutzer einladen">
                    <UserPlus />
                    <span>Benutzer einladen</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Spacer to push Verwaltung to bottom */}
        <div className="flex-1" />

        {/* Administration Section - at the bottom */}
        <SidebarGroup>
          <SidebarGroupLabel>Verwaltung</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {administration.map((item) => (
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
      </SidebarContent>

      <SidebarFooter>
        {/* Footer bleibt leer - Einstellungen sind bereits in der Navigation */}
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
