import { TaskCard, TaskStatus } from "@/components/tasks/task-card";
import { ChatPanel } from "@/components/layout/chat-panel";

// Mock data based on UI mockup
const tasks = [
  {
    id: "1",
    title: "Client Invoicing - Q1",
    description: "Client Invoicing - Q1 directions order your payments.",
    dueDate: "Feb 15",
    status: "on-track" as TaskStatus,
    progress: 65,
    assignee: { name: "Thomas", initials: "TS" },
  },
  {
    id: "2",
    title: "Reconcile Bank Statements",
    description: "Reconcile Bank statements to achievel your needs.",
    dueDate: "Feb 15",
    status: "pending-review" as TaskStatus,
    progress: 45,
    assignee: { name: "Anna", initials: "AM" },
  },
  {
    id: "3",
    title: "Prepare Tax Documents",
    description: "Prepare tax documents to tax succeps your companims.",
    dueDate: "Feb 15",
    status: "pending-review" as TaskStatus,
    progress: 30,
    assignee: { name: "Maria", initials: "MM" },
  },
  {
    id: "4",
    title: "Review Expense Reports",
    description: "Review expense reports and revalues all date and opinions.",
    dueDate: "Feb 15",
    status: "overdue" as TaskStatus,
    progress: 20,
    assignee: { name: "Thomas", initials: "TS" },
  },
  {
    id: "5",
    title: "Reconcile Bank Statements",
    description: "Receconcile bank statements from your've bank Invoicing.",
    dueDate: "Feb 15",
    status: "pending-review" as TaskStatus,
    progress: 55,
    assignee: { name: "Anna", initials: "AM" },
  },
  {
    id: "6",
    title: "Review Expense Reports",
    description: "Review completing programs and review expense reports.",
    dueDate: "Feb 15",
    status: "on-track" as TaskStatus,
    progress: 80,
    assignee: { name: "Maria", initials: "MM" },
  },
];

export default function DashboardPage() {
  const currentMonth = new Date().toLocaleString("en-US", { month: "long" }).toUpperCase();

  return (
    <div className="flex h-full gap-6">
      {/* Main Content */}
      <div className="flex-1">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">{currentMonth} TASKS</h1>
          <p className="text-slate-500 mt-1">Manage and track your monthly tasks</p>
        </div>

        {/* Task Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              title={task.title}
              description={task.description}
              dueDate={task.dueDate}
              status={task.status}
              progress={task.progress}
              assignee={task.assignee}
            />
          ))}
        </div>
      </div>

      {/* Chat Panel */}
      <ChatPanel />
    </div>
  );
}
