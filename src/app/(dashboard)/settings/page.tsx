"use client";

import { Suspense, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useRole } from "@/hooks/use-role";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  Bell,
  Shield,
  Palette,
  Save,
  Loader2,
  Sun,
  Moon,
  Monitor
} from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";

function getInitials(name: string | null | undefined, email: string | null | undefined): string {
  if (name) {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return "??";
}

function SettingsContent() {
  const { data: session } = useSession();
  const { isEmployee } = useRole();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });

  // Initialize form data from session
  useEffect(() => {
    if (session?.user) {
      setFormData({
        name: session.user.name || "",
        email: session.user.email || "",
      });
    }
  }, [session]);
  const [notifications, setNotifications] = useState({
    emailTasks: true,
    emailComments: true,
    emailReminders: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    if (!session?.user?.id) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/users/${session.user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formData.name }),
      });

      if (!response.ok) {
        throw new Error("Fehler beim Speichern");
      }

      toast({
        title: "Erfolgreich gespeichert",
        description: "Ihre Einstellungen wurden aktualisiert.",
      });

      // Update session
      window.location.reload();
    } catch {
      toast({
        title: "Fehler",
        description: "Einstellungen konnten nicht gespeichert werden.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const initials = getInitials(session.user.name, session.user.email);
  const companyName = session.user.companyId
    ? (session.user as { company?: { name?: string } }).company?.name
    : undefined;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Einstellungen</h1>
        <p className="text-muted-foreground mt-1">
          Verwalten Sie Ihre Kontoeinstellungen und Präferenzen
        </p>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-muted-foreground" />
            <CardTitle className="text-base">Profil</CardTitle>
          </div>
          <CardDescription>
            Ihre persönlichen Informationen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="w-20 h-20">
                <AvatarImage src={session.user.image || undefined} />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>
            <div>
              <div className="font-medium">{session.user.name || "Benutzer"}</div>
              {companyName && (
                <div className="text-sm text-muted-foreground">{companyName}</div>
              )}
              <Badge variant={isEmployee ? "default" : "outline"} className="mt-1">
                {isEmployee ? "Mitarbeiter" : "Kunde"}
              </Badge>
            </div>
          </div>

          {/* Form */}
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Name
              </label>
              <Input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ihr vollständiger Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                E-Mail
              </label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="ihre@email.at"
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">
                E-Mail kann nicht geändert werden
              </p>
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={isSaving}
           
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Wird gespeichert...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Änderungen speichern
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Notifications Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <CardTitle className="text-base">Benachrichtigungen</CardTitle>
          </div>
          <CardDescription>
            Steuern Sie, wie Sie benachrichtigt werden
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-sm">Neue Aufgaben</div>
              <div className="text-sm text-muted-foreground">
                E-Mail bei neuen zugewiesenen Aufgaben
              </div>
            </div>
            <button
              onClick={() => handleNotificationChange("emailTasks")}
              className={`w-11 h-6 rounded-full transition-colors ${
                notifications.emailTasks ? "bg-primary" : "bg-muted"
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  notifications.emailTasks ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-sm">Kommentare</div>
              <div className="text-sm text-muted-foreground">
                E-Mail bei neuen Kommentaren zu Ihren Aufgaben
              </div>
            </div>
            <button
              onClick={() => handleNotificationChange("emailComments")}
              className={`w-11 h-6 rounded-full transition-colors ${
                notifications.emailComments ? "bg-primary" : "bg-muted"
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  notifications.emailComments ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-sm">Erinnerungen</div>
              <div className="text-sm text-muted-foreground">
                E-Mail-Erinnerungen vor Fälligkeitsterminen
              </div>
            </div>
            <button
              onClick={() => handleNotificationChange("emailReminders")}
              className={`w-11 h-6 rounded-full transition-colors ${
                notifications.emailReminders ? "bg-primary" : "bg-muted"
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  notifications.emailReminders ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Security Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-muted-foreground" />
            <CardTitle className="text-base">Sicherheit</CardTitle>
          </div>
          <CardDescription>
            Sicherheitseinstellungen für Ihr Konto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-muted rounded-lg">
            <div className="font-medium text-sm">Magic Link Authentifizierung</div>
            <div className="text-sm text-muted-foreground mt-1">
              Sie melden sich mit einem sicheren 6-stelligen Code an, der an {session.user.email} gesendet wird.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appearance Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-muted-foreground" />
            <CardTitle className="text-base">Darstellung</CardTitle>
          </div>
          <CardDescription>
            Passen Sie das Erscheinungsbild an
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setTheme("light")}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                theme === "light"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground"
              }`}
            >
              <Sun className="w-5 h-5" />
              <span className="text-sm font-medium">Hell</span>
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                theme === "dark"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground"
              }`}
            >
              <Moon className="w-5 h-5" />
              <span className="text-sm font-medium">Dunkel</span>
            </button>
            <button
              onClick={() => setTheme("system")}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                theme === "system"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground"
              }`}
            >
              <Monitor className="w-5 h-5" />
              <span className="text-sm font-medium">System</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full">Laden...</div>}>
      <SettingsContent />
    </Suspense>
  );
}
