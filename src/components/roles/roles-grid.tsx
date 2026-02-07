"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Shield, ShieldAlert, Lock } from "lucide-react";

interface Permission {
  id: string;
  name: string;
  description: string | null;
  category: string;
}

interface Role {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
  permissions: Permission[];
}

export function RolesGrid({
  roles,
  onEdit,
  onDelete,
}: {
  roles: Role[];
  onEdit?: (role: Role) => void;
  onDelete?: (role: Role) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {roles.map((role) => (
        <Card key={role.id} className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  role.isSystem ? "bg-primary/10" : "bg-muted"
                }`}>
                  {role.isSystem ? (
                    <ShieldAlert className="w-6 h-6 text-primary" />
                  ) : (
                    <Shield className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{role.name}</h3>
                  <Badge variant={role.isSystem ? "default" : "secondary"} className="mt-1 text-xs">
                    {role.isSystem ? "System" : "Custom"}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(role)}
                    className="h-8 w-8"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                )}
                {!role.isSystem && onDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(role)}
                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {role.description && (
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {role.description}
              </p>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Lock className="w-4 h-4" />
                  <span>Berechtigungen:</span>
                </div>
                <span className="font-medium text-foreground">
                  {role.permissions.length}
                </span>
              </div>

              {role.permissions.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {role.permissions.slice(0, 4).map((perm) => (
                    <Badge key={perm.id} variant="outline" className="text-xs">
                      {perm.name}
                    </Badge>
                  ))}
                  {role.permissions.length > 4 && (
                    <Badge variant="secondary" className="text-xs">
                      +{role.permissions.length - 4} mehr
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
