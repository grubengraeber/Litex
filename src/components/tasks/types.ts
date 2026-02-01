import type { TaskStatus } from "@/lib/constants";

export interface Task {
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
  commentCount: number;
  fileCount: number;
  period: string;
  companyId: string;
  companyName: string;
  amount: string;
}
