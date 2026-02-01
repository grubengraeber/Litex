import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, MessageCircle, Paperclip } from "lucide-react";
import { 
  TRAFFIC_LIGHT_CONFIG, 
  TASK_STATUS,
  calculateTrafficLight,
  type TaskStatus 
} from "@/lib/constants";

interface TaskCardProps {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  createdAt: Date;
  status: TaskStatus;
  assignee: {
    name: string;
    avatar?: string;
    initials: string;
  };
  commentCount?: number;
  fileCount?: number;
  href?: string;
  companyName?: string;
  amount?: string;
}

export function TaskCard({ 
  id,
  title, 
  description, 
  dueDate, 
  createdAt,
  status,
  assignee,
  commentCount = 0,
  fileCount = 0,
  href,
  companyName,
  amount,
}: TaskCardProps) {
  // Calculate traffic light based on age
  const daysSinceCreation = Math.floor(
    (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );
  const trafficLight = calculateTrafficLight(daysSinceCreation);
  const trafficConfig = TRAFFIC_LIGHT_CONFIG[trafficLight];
  const statusConfig = TASK_STATUS[status];
  
  const linkHref = href || `/tasks/${id}`;

  return (
    <Link href={linkHref}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Traffic Light (Ampel) */}
              <span 
                className={`w-3 h-3 rounded-full ${trafficConfig.color}`} 
                title={`${trafficConfig.label}: ${trafficConfig.description}`} 
              />
              {/* Task Status Badge */}
              <Badge className={`text-xs ${statusConfig.color} border-0`}>
                {statusConfig.label}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              {fileCount > 0 && (
                <div className="flex items-center gap-1 text-sm" title={`${fileCount} Anhänge`}>
                  <Paperclip className="w-4 h-4" />
                  <span>{fileCount}</span>
                </div>
              )}
              {commentCount > 0 && (
                <div className="flex items-center gap-1 text-sm" title={`${commentCount} Kommentare`}>
                  <MessageCircle className="w-4 h-4" />
                  <span>{commentCount}</span>
                </div>
              )}
            </div>
          </div>
          <h3 className="font-semibold text-lg mt-2">{title}</h3>
          {companyName && (
            <span className="text-sm text-blue-600">{companyName}</span>
          )}
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500 mb-4 line-clamp-2">{description}</p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Calendar className="w-4 h-4" />
              <span>Fällig: {dueDate}</span>
            </div>
            
            {amount && (
              <span className="text-sm font-medium text-slate-700">
                € {amount}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between mt-4 pt-3 border-t">
            {/* Days indicator */}
            <span className={`text-xs ${trafficConfig.text}`}>
              {daysSinceCreation === 0 ? "Heute" : `${daysSinceCreation} Tage alt`}
            </span>
            
            <Avatar className="w-8 h-8">
              <AvatarImage src={assignee.avatar} alt={assignee.name} />
              <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                {assignee.initials}
              </AvatarFallback>
            </Avatar>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// Sort tasks by traffic light priority (red first)
export function sortTasksByPriority<T extends { createdAt: Date }>(tasks: T[]): T[] {
  return [...tasks].sort((a, b) => {
    const daysA = Math.floor((Date.now() - a.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    const daysB = Math.floor((Date.now() - b.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    // Sort descending by days (older = more urgent = first)
    return daysB - daysA;
  });
}
