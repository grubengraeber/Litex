"use client";

import { useEffect, useState } from "react";
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
  MoreHorizontal,
  UserCheck,
  UserX,
  Clock,
  ShieldCheck
} from "lucide-react";

interface Role {
  id: string;
  name: string;
  description: string | null;
}

interface TeamMember {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  status: "pending" | "active" | "disabled";
  companyId: string | null;
  companyName: string | null;
  createdAt: string;
  roles: Role[];
}

const statusConfig = {
  active: { label: "Aktiv", variant: "default" as const, icon: UserCheck },
  pending: { label: "Ausstehend", variant: "secondary" as const, icon: Clock },
  disabled: { label: "Deaktiviert", variant: "destructive" as const, icon: UserX },
};

function TeamContent() {
  const { isEmployee } = useRole();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchTeam() {
      try {
        const response = await fetch("/api/team");
        if (response.ok) {
          const data = await response.json();
          setTeamMembers(data);
        }
      } catch (error) {
        console.error("Error fetching team:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchTeam();
  }, []);

  const filteredMembers = teamMembers.filter((member) => {
    const query = searchQuery.toLowerCase();
    return (
      member.name?.toLowerCase().includes(query) ||
      member.email.toLowerCase().includes(query) ||
      member.roles.some((role) => role.name.toLowerCase().includes(query))
    );
  });

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-500">Laden...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Team</h1>
          <p className="text-slate-500 mt-1">
            {filteredMembers.length} Teammitglieder
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
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Team Grid */}
      {filteredMembers.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          {searchQuery
            ? "Keine Teammitglieder gefunden"
            : "Keine Teammitglieder vorhanden"}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((member) => {
            const status = statusConfig[member.status];
            const StatusIcon = status.icon;
            const initials = getInitials(member.name, member.email);

            return (
              <Card key={member.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={member.image || undefined} />
                        <AvatarFallback className="bg-blue-100 text-blue-600 text-lg">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">
                          {member.name || member.email.split("@")[0]}
                        </h3>
                        <span className="text-sm text-slate-500">
                          {member.companyName || "Kanzlei"}
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
                    {member.roles.length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <ShieldCheck className="w-4 h-4 text-slate-400" />
                        <div className="flex flex-wrap gap-1">
                          {member.roles.map((role) => (
                            <Badge
                              key={role.id}
                              variant="outline"
                              className="text-xs"
                            >
                              {role.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-1.5">
                      <StatusIcon className="w-4 h-4 text-slate-400" />
                      <Badge variant={status.variant} className="text-xs">
                        {status.label}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-500">
                      Seit{" "}
                      {new Date(member.createdAt).toLocaleDateString("de-DE")}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function TeamPage() {
  return <TeamContent />;
}
