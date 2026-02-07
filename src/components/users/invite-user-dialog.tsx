"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";

interface InviteUserDialogProps {
  buttonText?: string;
  buttonVariant?: "default" | "outline" | "ghost";
  buttonClassName?: string;
  showIcon?: boolean;
  iconOnly?: boolean;
  onInviteSuccess?: () => void;
}

export function InviteUserDialog({
  buttonText = "Benutzer einladen",
  buttonVariant = "default",
  buttonClassName = "",
  showIcon = true,
  iconOnly = false,
  onInviteSuccess,
}: InviteUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"employee" | "customer">("employee");

  const handleInvite = async () => {
    if (!email.trim()) {
      toast.error("Bitte geben Sie eine E-Mail-Adresse ein");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Bitte geben Sie eine gültige E-Mail-Adresse ein");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/users/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || undefined,
          role,
        }),
      });

      if (response.ok) {
        await response.json();
        toast.success(
          `Einladung an ${email} gesendet. Ein Bestätigungslink wurde per E-Mail verschickt.`
        );
        setEmail("");
        setName("");
        setRole("employee");
        setOpen(false);
        onInviteSuccess?.();
      } else {
        const error = await response.json();
        toast.error(error.error || "Fehler beim Senden der Einladung");
      }
    } catch (error) {
      console.error("Error inviting user:", error);
      toast.error("Fehler beim Senden der Einladung");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={buttonVariant}
          className={buttonClassName}
          size={iconOnly ? "icon" : "default"}
        >
          {showIcon && <UserPlus className="w-4 h-4" />}
          {!iconOnly && (
            <span className={showIcon ? "ml-2" : ""}>{buttonText}</span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Benutzer einladen</DialogTitle>
          <DialogDescription>
            Laden Sie einen neuen Benutzer zum System ein. Eine Einladungs-E-Mail
            mit einem Bestätigungslink wird an die angegebene Adresse gesendet.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">
              E-Mail-Adresse <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="benutzer@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loading) {
                  handleInvite();
                }
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name (optional)</Label>
            <Input
              id="name"
              type="text"
              placeholder="Max Mustermann"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loading) {
                  handleInvite();
                }
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">
              Benutzertyp <span className="text-red-500">*</span>
            </Label>
            <Select value={role} onValueChange={(value: "employee" | "customer") => setRole(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">
                  <div>
                    <div className="font-medium">Mitarbeiter</div>
                    <div className="text-xs text-muted-foreground">
                      Vollzugriff auf alle Funktionen
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="customer">
                  <div>
                    <div className="font-medium">Kunde</div>
                    <div className="text-xs text-muted-foreground">
                      Eingeschränkter Zugriff auf eigene Daten
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Abbrechen
          </Button>
          <Button onClick={handleInvite} disabled={loading}>
            {loading ? "Wird gesendet..." : "Einladung senden"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
