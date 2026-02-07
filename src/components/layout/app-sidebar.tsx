"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  Building2,
  MessageSquare,
  Shield,
  ShieldCheck,
  UserCog,
  FolderOpen,
  History,
  ChevronRight,
  BookOpen,
  ClipboardList,
  Settings,
  Import,
} from "lucide-react";
import { useRole } from "@/hooks/use-role";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS, type PermissionName } from "@/lib/permissions-constants";
import { CompanySelector } from "./company-selector";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

type NavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission: PermissionName | null;
};

type NavItemWithSub = NavItem & {
  subItems?: Array<{
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
  }>;
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { isEmployee } = useRole();
  const { hasPermission, loading: permissionsLoading } = usePermissions();

  const isTasksActive = pathname.startsWith("/tasks");

  const navigation = React.useMemo((): NavItemWithSub[] => {
    if (permissionsLoading) return [];

    const items: NavItemWithSub[] = [
      {
        name: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        permission: PERMISSIONS.VIEW_DASHBOARD,
      },
    ];

    if (hasPermission(PERMISSIONS.VIEW_TASKS)) {
      if (isEmployee) {
        items.push({
          name: "Aufgaben",
          href: "/tasks",
          icon: FileText,
          permission: PERMISSIONS.VIEW_TASKS,
          subItems: [
            {
              name: "Ungeklärte Buchungen",
              href: "/tasks/bookings",
              icon: BookOpen,
            },
            {
              name: "Allgemeine Aufgaben",
              href: "/tasks/general",
              icon: ClipboardList,
            },
            {
              name: "Import-Verlauf",
              href: "/tasks/imports",
              icon: Import,
            },
          ],
        });
      } else {
        items.push({
          name: "Meine Aufgaben",
          href: "/tasks",
          icon: FileText,
          permission: PERMISSIONS.VIEW_TASKS,
          subItems: [
            {
              name: "Ungeklärte Buchungen",
              href: "/tasks/bookings",
              icon: BookOpen,
            },
            {
              name: "Allgemeine Aufgaben",
              href: "/tasks/general",
              icon: ClipboardList,
            },
          ],
        });
      }
    }

    if (isEmployee) {
      items.push(
        { name: "Chats", href: "/chats", icon: MessageSquare, permission: PERMISSIONS.VIEW_CHATS },
        { name: "Dateien", href: "/files", icon: FolderOpen, permission: PERMISSIONS.VIEW_FILES },
        { name: "Mandanten", href: "/companies", icon: Building2, permission: PERMISSIONS.VIEW_CLIENTS },
      );
    }

    return items.filter((item) => {
      if (!item.permission) return true;
      return hasPermission(item.permission);
    });
  }, [isEmployee, hasPermission, permissionsLoading]);

  const administration = React.useMemo((): NavItem[] => {
    if (permissionsLoading || !isEmployee) return [];

    const items: NavItem[] = [
      { name: "Team", href: "/team", icon: Users, permission: PERMISSIONS.VIEW_TEAM },
      { name: "Benutzer", href: "/users", icon: UserCog, permission: PERMISSIONS.VIEW_USERS },
      { name: "Rollen", href: "/roles", icon: Shield, permission: PERMISSIONS.VIEW_ROLES },
      { name: "Berechtigungen", href: "/permissions", icon: ShieldCheck, permission: PERMISSIONS.VIEW_PERMISSIONS },
    ];

    if (hasPermission(PERMISSIONS.VIEW_AUDIT_LOGS)) {
      items.push({
        name: "Audit Logs",
        href: "/audit-logs",
        icon: History,
        permission: PERMISSIONS.VIEW_AUDIT_LOGS,
      });
    }

    return items.filter((item) => {
      if (!item.permission) return true;
      return hasPermission(item.permission);
    });
  }, [isEmployee, hasPermission, permissionsLoading]);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard" className="flex items-center gap-3 px-2 py-3">
                <div className="flex items-center justify-center h-8 w-20 group-data-[collapsible=icon]:w-8">
                  <Image
                    src="/logos/countable-logo-0.png"
                    alt="Countable"
                    width={80}
                    height={32}
                    className="object-contain group-data-[collapsible=icon]:w-8"
                    priority
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-semibold">Countable</span>
                  <span className="truncate text-xs text-muted-foreground">ALB Klientenportal</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {/* Company Selector */}
        <div className="group-data-[collapsible=icon]:hidden">
          <CompanySelector />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) =>
                item.subItems ? (
                  <Collapsible
                    key={item.name}
                    defaultOpen={isTasksActive}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          isActive={isTasksActive}
                          tooltip={item.name}
                        >
                          <item.icon />
                          <span>{item.name}</span>
                          <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.subItems.map((sub) => (
                            <SidebarMenuSubItem key={sub.name}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={pathname === sub.href || pathname.startsWith(sub.href + "/")}
                              >
                                <Link href={sub.href}>
                                  <sub.icon className="h-4 w-4" />
                                  <span>{sub.name}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                ) : (
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
                )
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Spacer to push Verwaltung to bottom */}
        <div className="flex-1" />

        {/* Administration Section - at the bottom */}
        {administration.length > 0 && (
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
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === "/settings"}
              tooltip="Einstellungen"
            >
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
