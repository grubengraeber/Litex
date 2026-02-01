import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Calendar, MessageCircle, Paperclip } from "lucide-react";
import { TRAFFIC_LIGHT_CONFIG, type TrafficLight } from "@/lib/constants";

interface TaskCardProps {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  trafficLight: TrafficLight;
  progress: number;
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
  trafficLight, 
  progress, 
  assignee,
  commentCount = 0,
  fileCount = 0,
  href,
  companyName,
  amount,
}: TaskCardProps) {
  const config = TRAFFIC_LIGHT_CONFIG[trafficLight];
  const linkHref = href || `/tasks/${id}`;

  return (
    <Link href={linkHref}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${config.color}`} title={config.description} />
              <Badge className={`text-xs ${config.bgLight} ${config.text} border-0`}>
                {config.label}
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

          <div className="flex items-center justify-between mt-4">
            <div className="flex-1 mr-4">
              <Progress value={progress} className="h-1.5" />
            </div>
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

// Helper function to determine traffic light based on task data
export function calculateTrafficLight(task: {
  hasComments: boolean;
  hasFiles: boolean;
  createdAt: Date;
  completedAt?: Date | null;
}): TrafficLight {
  // If completed, it's green
  if (task.completedAt) {
    return "green";
  }
  
  // If has comments or files, it's green (bearbeitet)
  if (task.hasComments || task.hasFiles) {
    return "green";
  }
  
  // Check 75-day deadline
  const daysSinceCreation = Math.floor(
    (Date.now() - task.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  if (daysSinceCreation > 75) {
    return "red";
  }
  
  // Default: not processed yet
  return "yellow";
}
