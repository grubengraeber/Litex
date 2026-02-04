"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Filter,
  Circle,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  FileText,
  Building2,
  MessageSquare,
  Shield,
  ShieldCheck,
  UserCog,
  FolderOpen,
  History,
} from "lucide-react";
import { useRole } from "@/hooks/use-role";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS, type PermissionName } from "@/lib/permissions-constants";

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

// Navigation items with required permissions
type NavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission: PermissionName | null;
};

const employeeNavigation: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: PERMISSIONS.VIEW_DASHBOARD },
  { name: "Aufgaben", href: "/tasks", icon: FileText, permission: PERMISSIONS.VIEW_TASKS },
  { name: "Chats", href: "/chats", icon: MessageSquare, permission: null }, // No specific permission for chats yet
  { name: "Dateien", href: "/files", icon: FolderOpen, permission: null }, // No specific permission for files yet
  { name: "Mandanten", href: "/companies", icon: Building2, permission: PERMISSIONS.VIEW_CLIENTS },
];

const customerNavigation: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: PERMISSIONS.VIEW_DASHBOARD },
  { name: "Meine Aufgaben", href: "/tasks", icon: FileText, permission: PERMISSIONS.VIEW_TASKS },
  { name: "Chats", href: "/chats", icon: MessageSquare, permission: null },
  { name: "Meine Dateien", href: "/files", icon: FolderOpen, permission: null },
];

// Administration section - shown at the bottom
// Note: Audit Logs will be conditionally added based on permissions
const employeeAdministrationBase: NavItem[] = [
  { name: "Team", href: "/team", icon: Users, permission: PERMISSIONS.VIEW_TEAM },
  { name: "Benutzer", href: "/users", icon: UserCog, permission: PERMISSIONS.VIEW_USERS },
  { name: "Rollen", href: "/roles", icon: Shield, permission: PERMISSIONS.VIEW_ROLES },
  { name: "Berechtigungen", href: "/permissions", icon: ShieldCheck, permission: PERMISSIONS.VIEW_PERMISSIONS },
];

const customerAdministration: NavItem[] = [];

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
  const { isEmployee } = useRole();
  const { hasPermission, loading: permissionsLoading } = usePermissions();

  const baseNavigation = isEmployee ? employeeNavigation : customerNavigation;

  // Filter navigation items based on permissions
  const navigation = React.useMemo(() => {
    if (permissionsLoading) return [];
    return baseNavigation.filter((item) => {
      // If no permission is required, show the item
      if (!item.permission) return true;
      // Otherwise, check if user has the permission
      return hasPermission(item.permission);
    });
  }, [baseNavigation, hasPermission, permissionsLoading]);

  // Build administration menu with conditional items based on permissions
  const employeeAdministration = React.useMemo(() => {
    if (permissionsLoading) return [];

    const items = employeeAdministrationBase.filter((item) => {
      // If no permission is required, show the item
      if (!item.permission) return true;
      // Otherwise, check if user has the permission
      return hasPermission(item.permission);
    });

    // Add Audit Logs at the end if user has permission
    if (hasPermission(PERMISSIONS.VIEW_AUDIT_LOGS)) {
      items.push({
        name: "Audit Logs",
        href: "/audit-logs",
        icon: History,
        permission: PERMISSIONS.VIEW_AUDIT_LOGS,
      });
    }
    return items;
  }, [hasPermission, permissionsLoading]);

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
