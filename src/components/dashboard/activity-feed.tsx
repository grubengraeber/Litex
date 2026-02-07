"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  FileText,
  MessageSquare,
  Upload,
  CheckCircle,
  LogIn,
  UserPlus,
  AlertCircle,
} from "lucide-react";

interface ActivityItem {
  id: string;
  type: "audit" | "notification";
  action: string;
  title: string;
  message: string | null;
  entityType?: string;
  entityId?: string;
  userEmail?: string;
  createdAt: string;
}

const actionIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  CREATE: FileText,
  UPDATE: FileText,
  SUBMIT: CheckCircle,
  APPROVE: CheckCircle,
  REJECT: AlertCircle,
  UPLOAD: Upload,
  LOGIN: LogIn,
  ASSIGN_ROLE: UserPlus,
  new_message: MessageSquare,
  task_submitted: CheckCircle,
  task_completed: CheckCircle,
  file_uploaded: Upload,
};

function formatMonthLabel(key: string): string {
  const [year, month] = key.split("-");
  const months = [
    "Januar", "Februar", "März", "April", "Mai", "Juni",
    "Juli", "August", "September", "Oktober", "November", "Dezember",
  ];
  return `${months[parseInt(month, 10) - 1]} ${year}`;
}

export function ActivityFeed() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/activity-feed?limit=50")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setItems(data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Group by month
  const grouped: Record<string, ActivityItem[]> = {};
  for (const item of items) {
    const date = new Date(item.createdAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(item);
  }

  const sortedMonths = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Aktivitäten
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground text-sm">Lade Aktivitäten...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Aktivitäten
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sortedMonths.length === 0 ? (
          <p className="text-sm text-muted-foreground">Keine Aktivitäten vorhanden.</p>
        ) : (
          <div className="space-y-6">
            {sortedMonths.map((month) => (
              <div key={month}>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  {formatMonthLabel(month)}
                </h4>
                <div className="space-y-3">
                  {grouped[month].map((item) => {
                    const Icon = actionIcons[item.action] || FileText;
                    return (
                      <div
                        key={item.id}
                        className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium">{item.title}</span>
                            {item.type === "audit" && (
                              <Badge variant="outline" className="text-xs">
                                {item.action}
                              </Badge>
                            )}
                          </div>
                          {item.message && (
                            <p className="text-xs text-muted-foreground mt-0.5">{item.message}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            {item.userEmail && (
                              <span className="text-xs text-muted-foreground">{item.userEmail}</span>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(item.createdAt), {
                                addSuffix: true,
                                locale: de,
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
