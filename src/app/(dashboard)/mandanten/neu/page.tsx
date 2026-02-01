"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRole } from "@/hooks/use-role";
import { 
  ArrowLeft, 
  Save,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  Loader2
} from "lucide-react";

interface FormData {
  name: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  taxId: string;
  vatId: string;
  notes: string;
}

export default function NewMandantPage() {
  const router = useRouter();
  const { isEmployee } = useRole();
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    postalCode: "",
    country: "Österreich",
    taxId: "",
    vatId: "",
    notes: "",
  });

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError("Name ist erforderlich");
      return;
    }

    setSaving(true);
    setError(null);
    
    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/mandanten/${data.client.id}`);
      } else {
        const data = await response.json();
        setError(data.error || "Fehler beim Erstellen");
      }
    } catch (err) {
      console.error("Error creating client:", err);
      setError("Fehler beim Erstellen des Mandanten");
    } finally {
      setSaving(false);
    }
  };

  // Access check
  if (!isEmployee) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">🔒</span>
        </div>
        <h3 className="text-lg font-medium text-slate-700">Kein Zugriff</h3>
        <p className="text-slate-500 mt-1">Diese Seite ist nur für Mitarbeiter verfügbar.</p>
        <Link href="/dashboard">
          <Button className="mt-4">Zum Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back & Actions */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <Link href="/mandanten">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zur Übersicht
          </Button>
        </Link>
        <Button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Mandant anlegen
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center">
          <Building2 className="w-8 h-8 text-slate-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Neuer Mandant</h1>
          <p className="text-slate-500">Mandantendaten erfassen</p>
        </div>
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Info */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Stammdaten</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600">Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Name des Mandanten"
                className="max-w-md"
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kontaktdaten</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Mail className="w-4 h-4" /> E-Mail
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@beispiel.at"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Phone className="w-4 h-4" /> Telefon
              </label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+43 1 234 5678"
              />
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Adresse
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={formData.street}
              onChange={(e) => setFormData({ ...formData, street: e.target.value })}
              placeholder="Straße und Hausnummer"
            />
            <div className="grid grid-cols-3 gap-2">
              <Input
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                placeholder="PLZ"
              />
              <Input
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Ort"
                className="col-span-2"
              />
            </div>
            <Input
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              placeholder="Land"
            />
          </CardContent>
        </Card>

        {/* Tax Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4" /> Steuerdaten
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600">Steuernummer</label>
              <Input
                value={formData.taxId}
                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                placeholder="12 345/6789"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600">UID-Nummer</label>
              <Input
                value={formData.vatId}
                onChange={(e) => setFormData({ ...formData, vatId: e.target.value })}
                placeholder="ATU12345678"
              />
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notizen</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full p-3 border rounded-lg text-sm min-h-[120px]"
              placeholder="Interne Notizen zum Mandanten..."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
