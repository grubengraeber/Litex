import { Suspense } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Header } from "@/components/layout/header";
import { Separator } from "@/components/ui/separator";
import { RoleProvider } from "@/components/providers/role-provider";
import { UnsavedChangesProvider } from "@/components/providers/unsaved-changes-provider";

function SidebarSkeleton() {
  return <div className="w-64 bg-background border-r animate-pulse" />;
}

function HeaderSkeleton() {
  return <div className="flex-1 h-8 bg-slate-100 rounded animate-pulse" />;
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
      <UnsavedChangesProvider>
        <SidebarProvider>
          <Suspense fallback={<SidebarSkeleton />}>
            <AppSidebar />
          </Suspense>
          <SidebarInset className="flex flex-col h-screen overflow-hidden w-full max-w-full">
            {/* Sticky Header */}
            <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4 overflow-x-hidden">
              <SidebarTrigger className="-ml-1 shrink-0" />
              <Separator orientation="vertical" className="mr-2 h-4 shrink-0" />
              <Suspense fallback={<HeaderSkeleton />}>
                <Header />
              </Suspense>
            </header>
            {/* Scrollable Main Content */}
            <main className="flex-1 overflow-auto overflow-x-hidden p-4 md:p-6 w-full max-w-full">
              <div className="w-full max-w-full break-words">
                {children}
              </div>
            </main>
          </SidebarInset>
        </SidebarProvider>
      </UnsavedChangesProvider>
    </RoleProvider>
  );
}
