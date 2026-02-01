"use client";

import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useRole } from "@/hooks/use-role";
import { 
  Plus, 
  Search, 
  Mail, 
  Phone,
  MoreHorizontal,
  UserCheck,
  UserX,
  Clock
} from "lucide-react";

// Mock team data
const teamMembers = [
  {
    id: "1",
    name: "Thomas Schmidt",
    email: "thomas.schmidt@alb.at",
    phone: "+43 1 234 5678",
    role: "employee" as const,
    status: "active" as const,
    initials: "TS",
    avatar: undefined,
    tasksAssigned: 12,
    tasksCompleted: 8,
  },
  {
    id: "2",
    name: "Anna Müller",
    email: "anna.mueller@alb.at",
    phone: "+43 1 234 5679",
    role: "employee" as const,
    status: "active" as const,
    initials: "AM",
    avatar: undefined,
    tasksAssigned: 15,
    tasksCompleted: 12,
  },
  {
    id: "3",
    name: "Maria Huber",
    email: "maria.huber@alb.at",
    phone: "+43 1 234 5680",
    role: "employee" as const,
    status: "active" as const,
    initials: "MH",
    avatar: undefined,
    tasksAssigned: 8,
    tasksCompleted: 6,
  },
  {
    id: "4",
    name: "Stefan Bauer",
    email: "stefan.bauer@alb.at",
    phone: "+43 1 234 5681",
    role: "employee" as const,
    status: "pending" as const,
    initials: "SB",
    avatar: undefined,
    tasksAssigned: 0,
    tasksCompleted: 0,
  },
];

const statusConfig = {
  active: { label: "Aktiv", variant: "success" as const, icon: UserCheck },
  pending: { label: "Ausstehend", variant: "warning" as const, icon: Clock },
  disabled: { label: "Deaktiviert", variant: "danger" as const, icon: UserX },
};

const roleLabels = {
  employee: "Mitarbeiter",
  customer: "Kunde",
};

function TeamContent() {
  const { isEmployee } = useRole();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Team</h1>
          <p className="text-slate-500 mt-1">
            {teamMembers.length} Teammitglieder
          </p>
        </div>
        {isEmployee && (
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Mitarbeiter einladen
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          type="search"
          placeholder="Team durchsuchen..."
          className="pl-10"
        />
      </div>

      {/* Team Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teamMembers.map((member) => {
          const status = statusConfig[member.status];
          const StatusIcon = status.icon;

          return (
            <Card key={member.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback className="bg-blue-100 text-blue-600 text-lg">
                        {member.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{member.name}</h3>
                      <span className="text-sm text-slate-500">
                        {roleLabels[member.role]}
                      </span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="shrink-0">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="truncate">{member.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>{member.phone}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-1.5">
                    <StatusIcon className="w-4 h-4 text-slate-400" />
                    <Badge variant={status.variant} className="text-xs">
                      {status.label}
                    </Badge>
                  </div>
                  <div className="text-sm text-slate-500">
                    {member.tasksCompleted}/{member.tasksAssigned} Aufgaben
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default function TeamPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full">Laden...</div>}>
      <TeamContent />
    </Suspense>
  );
}
