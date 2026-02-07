import { Suspense } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Header } from "@/components/layout/header";
import { Separator } from "@/components/ui/separator";
import { RoleProvider } from "@/components/providers/role-provider";
import { UnsavedChangesProvider } from "@/components/providers/unsaved-changes-provider";
import { CompanyProvider } from "@/components/providers/company-provider";

function SidebarSkeleton() {
  return <div className="w-64 bg-background border-r animate-pulse" />;
}

function HeaderSkeleton() {
  return <div className="flex-1 h-8 bg-muted rounded animate-pulse" />;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // TODO: Get role from session/auth
  const userRole = "employee" as const;

  return (
    <RoleProvider role={userRole}>
      <CompanyProvider>
        <UnsavedChangesProvider>
          <SidebarProvider>
          <Suspense fallback={<SidebarSkeleton />}>
            <AppSidebar />
          </Suspense>
          <SidebarInset className="flex flex-col h-screen overflow-hidden w-full">
            {/* Sticky Header */}
            <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4 min-w-0">
              <SidebarTrigger className="-ml-1 shrink-0" />
              <Separator orientation="vertical" className="mr-2 h-4 shrink-0" />
              <div className="flex-1 min-w-0">
                <Suspense fallback={<HeaderSkeleton />}>
                  <Header />
                </Suspense>
              </div>
            </header>
            {/* Scrollable Main Content */}
            <main className="flex-1 overflow-auto p-4 md:p-6 w-full">
              <div className="w-full break-words">
                {children}
              </div>
            </main>
          </SidebarInset>
        </SidebarProvider>
        </UnsavedChangesProvider>
      </CompanyProvider>
    </RoleProvider>
  );
}
