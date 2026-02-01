import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "lucide-react";

export type TaskStatus = "on-track" | "pending-review" | "overdue";

interface TaskCardProps {
  title: string;
  description: string;
  dueDate: string;
  status: TaskStatus;
  progress: number;
  assignee: {
    name: string;
    avatar?: string;
    initials: string;
  };
}

const statusConfig = {
  "on-track": {
    label: "On Track",
    variant: "success" as const,
    dot: "bg-green-500",
  },
  "pending-review": {
    label: "Pending Review",
    variant: "warning" as const,
    dot: "bg-yellow-500",
  },
  "overdue": {
    label: "Overdue",
    variant: "danger" as const,
    dot: "bg-red-500",
  },
};

export function TaskCard({ title, description, dueDate, status, progress, assignee }: TaskCardProps) {
  const config = statusConfig[status];

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${config.dot}`} />
          <Badge variant={config.variant} className="text-xs">
            {config.label}
          </Badge>
        </div>
        <h3 className="font-semibold text-lg mt-2">{title}</h3>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-500 mb-4 line-clamp-2">{description}</p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Calendar className="w-4 h-4" />
            <span>Due: {dueDate}</span>
          </div>
          
          <Avatar className="w-8 h-8">
            <AvatarImage src={assignee.avatar} alt={assignee.name} />
            <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
              {assignee.initials}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="mt-4">
          <Progress value={progress} className="h-1.5" />
        </div>
      </CardContent>
    </Card>
  );
}
