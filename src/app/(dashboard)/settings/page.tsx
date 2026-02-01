"use client";

import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useRole } from "@/hooks/use-role";
import { usePermissions } from "@/hooks/use-permissions";
import { RolesManagement } from "@/components/settings/roles-management";
import { 
  User, 
  Bell, 
  Shield, 
  Palette,
  Save,
  Camera
} from "lucide-react";

// Mock user data
const currentUser = {
  id: "u1",
  name: "Fabio Trentini",
  email: "fabio@alb.at",
  phone: "+43 1 234 5678",
  role: "employee" as const,
  initials: "FT",
  avatar: undefined,
  company: "ALB Steuerberatung",
};

function SettingsContent() {
  const { isEmployee } = useRole();
  const { hasPermission } = usePermissions();
  const [formData, setFormData] = useState({
    name: currentUser.name,
    email: currentUser.email,
    phone: currentUser.phone,
  });
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

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Einstellungen</h1>
        <p className="text-slate-500 mt-1">
          Verwalten Sie Ihre Kontoeinstellungen und Präferenzen
        </p>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-slate-400" />
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
                <AvatarImage src={currentUser.avatar} />
                <AvatarFallback className="text-2xl bg-blue-100 text-blue-600">
                  {currentUser.initials}
                </AvatarFallback>
              </Avatar>
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div>
              <div className="font-medium">{currentUser.name}</div>
              <div className="text-sm text-slate-500">{currentUser.company}</div>
              <Badge variant={isEmployee ? "default" : "outline"} className="mt-1">
                {isEmployee ? "Mitarbeiter" : "Kunde"}
              </Badge>
            </div>
          </div>

          {/* Form */}
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
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
              <label className="block text-sm font-medium text-slate-700 mb-1">
                E-Mail
              </label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="ihre@email.at"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Telefon
              </label>
              <Input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+43 1 234 5678"
              />
            </div>
          </div>

          <Button className="bg-blue-600 hover:bg-blue-700">
            <Save className="w-4 h-4 mr-2" />
            Änderungen speichern
          </Button>
        </CardContent>
      </Card>

      {/* Notifications Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-slate-400" />
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
              <div className="text-sm text-slate-500">
                E-Mail bei neuen zugewiesenen Aufgaben
              </div>
            </div>
            <button
              onClick={() => handleNotificationChange("emailTasks")}
              className={`w-11 h-6 rounded-full transition-colors ${
                notifications.emailTasks ? "bg-blue-600" : "bg-slate-200"
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
              <div className="text-sm text-slate-500">
                E-Mail bei neuen Kommentaren zu Ihren Aufgaben
              </div>
            </div>
            <button
              onClick={() => handleNotificationChange("emailComments")}
              className={`w-11 h-6 rounded-full transition-colors ${
                notifications.emailComments ? "bg-blue-600" : "bg-slate-200"
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
              <div className="text-sm text-slate-500">
                E-Mail-Erinnerungen vor Fälligkeitsterminen
              </div>
            </div>
            <button
              onClick={() => handleNotificationChange("emailReminders")}
              className={`w-11 h-6 rounded-full transition-colors ${
                notifications.emailReminders ? "bg-blue-600" : "bg-slate-200"
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
            <Shield className="w-5 h-5 text-slate-400" />
            <CardTitle className="text-base">Sicherheit</CardTitle>
          </div>
          <CardDescription>
            Sicherheitseinstellungen für Ihr Konto
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <div className="font-medium text-sm">Passwort ändern</div>
              <div className="text-sm text-slate-500">
                Aktualisieren Sie Ihr Kontopasswort
              </div>
            </div>
            <Button variant="outline" size="sm">
              Ändern
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <div className="font-medium text-sm">Zwei-Faktor-Authentifizierung</div>
              <div className="text-sm text-slate-500">
                Zusätzliche Sicherheit für Ihr Konto
              </div>
            </div>
            <Button variant="outline" size="sm">
              Einrichten
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Roles Management - Only for users with permission */}
      {(isEmployee || hasPermission("canViewRoles")) && (
        <RolesManagement />
      )}

      {/* Appearance Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-slate-400" />
            <CardTitle className="text-base">Darstellung</CardTitle>
          </div>
          <CardDescription>
            Passen Sie das Erscheinungsbild an
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-sm">Dunkelmodus</div>
              <div className="text-sm text-slate-500">
                Dunkles Farbschema verwenden
              </div>
            </div>
            <Button variant="outline" size="sm">
              Bald verfügbar
            </Button>
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
