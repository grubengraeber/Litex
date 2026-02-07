"use client";

import { Bell, MessageSquare, ListTodo, AlertTriangle, Info, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications, type NotificationType } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

const NOTIFICATION_ICONS: Record<NotificationType, React.ElementType> = {
  message: MessageSquare,
  task: ListTodo,
  warning: AlertTriangle,
  info: Info,
};

const NOTIFICATION_COLORS: Record<NotificationType, string> = {
  message: "text-primary",
  task: "text-green-500",
  warning: "text-amber-500",
  info: "text-muted-foreground",
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Gerade eben";
  if (diffMins < 60) return `vor ${diffMins} Min.`;
  if (diffHours < 24) return `vor ${diffHours} Std.`;
  if (diffDays < 7) return `vor ${diffDays} Tagen`;
  
  return date.toLocaleDateString("de-DE", { 
    day: "2-digit", 
    month: "2-digit" 
  });
}

export function NotificationsDropdown() {
  const router = useRouter();
  const { notifications, loading, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const handleNotificationClick = async (notification: typeof notifications[0]) => {
    await markAsRead(notification.id);
    
    if (notification.link) {
      router.push(notification.link);
    } else if (notification.taskId) {
      router.push(`/tasks/${notification.taskId}`);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
          <span className="sr-only">Benachrichtigungen</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <span className="font-semibold text-sm">Benachrichtigungen</span>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead()}
              className="text-xs text-primary hover:text-foreground flex items-center gap-1"
            >
              <Check className="h-3 w-3" />
              Alle gelesen
            </button>
          )}
        </div>

        <div className="max-h-[350px] overflow-y-auto">
          {loading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Laden...
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
              Keine Benachrichtigungen
            </div>
          ) : (
            notifications.slice(0, 10).map((notification) => {
              const Icon = NOTIFICATION_ICONS[notification.type];
              const iconColor = NOTIFICATION_COLORS[notification.type];

              return (
                <DropdownMenuItem
                  key={notification.id}
                  className={cn(
                    "flex items-start gap-3 p-3 cursor-pointer",
                    !notification.isRead && "bg-primary/5/50"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className={cn("mt-0.5 shrink-0", iconColor)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-sm truncate",
                        !notification.isRead && "font-semibold"
                      )}>
                        {notification.title}
                      </span>
                      {!notification.isRead && (
                        <span className="h-2 w-2 rounded-full bg-primary/50 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {notification.message}
                    </p>
                    <span className="text-[10px] text-muted-foreground mt-1 block">
                      {formatTimeAgo(notification.createdAt)}
                    </span>
                  </div>
                </DropdownMenuItem>
              );
            })
          )}
        </div>

        {notifications.length > 10 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="justify-center text-sm text-primary cursor-pointer"
              onClick={() => router.push("/notifications")}
            >
              Alle anzeigen
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
