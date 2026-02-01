"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useRole } from "@/hooks/use-role";
import { 
  ArrowLeft, 
  Edit, 
  Save,
  X,
  Plus, 
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle
} from "lucide-react";

interface Company {
  id: string;
  name: string;
  bmdId: string | null;
  finmaticsId: string | null;
  isActive: boolean;
}

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  street: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
  taxId: string | null;
  vatId: string | null;
  notes: string | null;
  isActive: boolean;
  companies: Company[];
  createdAt: string;
  updatedAt: string;
}

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

interface CompanyFormData {
  name: string;
  bmdId: string;
  finmaticsId: string;
}

export default function MandantDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const { isEmployee } = useRole();
  
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    postalCode: "",
    country: "",
    taxId: "",
    vatId: "",
    notes: "",
  });

  // Company management
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [companyForm, setCompanyForm] = useState<CompanyFormData>({
    name: "",
    bmdId: "",
    finmaticsId: "",
  });
  const [savingCompany, setSavingCompany] = useState(false);

  const fetchClient = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/clients?id=${id}`);
      if (response.ok) {
        const data = await response.json();
        setClient(data.client);
        setFormData({
          name: data.client.name || "",
          email: data.client.email || "",
          phone: data.client.phone || "",
          street: data.client.street || "",
          city: data.client.city || "",
          postalCode: data.client.postalCode || "",
          country: data.client.country || "Österreich",
          taxId: data.client.taxId || "",
          vatId: data.client.vatId || "",
          notes: data.client.notes || "",
        });
      } else {
        setError("Mandant nicht gefunden");
      }
    } catch (err) {
      console.error("Error fetching client:", err);
      setError("Fehler beim Laden des Mandanten");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchClient();
  }, [fetchClient]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/clients?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setClient({ ...client!, ...data.client });
        setIsEditing(false);
      } else {
        const data = await response.json();
        setError(data.error || "Fehler beim Speichern");
      }
    } catch (err) {
      console.error("Error saving client:", err);
      setError("Fehler beim Speichern");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (client) {
      setFormData({
        name: client.name || "",
        email: client.email || "",
        phone: client.phone || "",
        street: client.street || "",
        city: client.city || "",
        postalCode: client.postalCode || "",
        country: client.country || "Österreich",
        taxId: client.taxId || "",
        vatId: client.vatId || "",
        notes: client.notes || "",
      });
    }
    setIsEditing(false);
    setError(null);
  };

  const handleToggleActive = async () => {
    if (!client) return;
    
    setSaving(true);
    try {
      const response = await fetch(`/api/clients?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !client.isActive }),
      });

      if (response.ok) {
        setClient({ ...client, isActive: !client.isActive });
      }
    } catch (err) {
      console.error("Error toggling active:", err);
    } finally {
      setSaving(false);
    }
  };

  // Company handlers
  const handleAddCompany = async () => {
    if (!companyForm.name.trim()) return;
    
    setSavingCompany(true);
    try {
      const response = await fetch(`/api/clients/${id}/companies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(companyForm),
      });

      if (response.ok) {
        const data = await response.json();
        setClient({
          ...client!,
          companies: [...client!.companies, data.company],
        });
        setCompanyForm({ name: "", bmdId: "", finmaticsId: "" });
        setShowCompanyForm(false);
      }
    } catch (err) {
      console.error("Error adding company:", err);
    } finally {
      setSavingCompany(false);
    }
  };

  const handleUpdateCompany = async () => {
    if (!editingCompany || !companyForm.name.trim()) return;
    
    setSavingCompany(true);
    try {
      const response = await fetch(`/api/clients/${id}/companies?companyId=${editingCompany.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(companyForm),
      });

      if (response.ok) {
        const data = await response.json();
        setClient({
          ...client!,
          companies: client!.companies.map(c => 
            c.id === editingCompany.id ? data.company : c
          ),
        });
        setCompanyForm({ name: "", bmdId: "", finmaticsId: "" });
        setEditingCompany(null);
      }
    } catch (err) {
      console.error("Error updating company:", err);
    } finally {
      setSavingCompany(false);
    }
  };

  const handleRemoveCompany = async (companyId: string) => {
    if (!confirm("Firma wirklich vom Mandanten entfernen?")) return;
    
    try {
      const response = await fetch(`/api/clients/${id}/companies?companyId=${companyId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setClient({
          ...client!,
          companies: client!.companies.filter(c => c.id !== companyId),
        });
      }
    } catch (err) {
      console.error("Error removing company:", err);
    }
  };

  const startEditCompany = (company: Company) => {
    setEditingCompany(company);
    setCompanyForm({
      name: company.name,
      bmdId: company.bmdId || "",
      finmaticsId: company.finmaticsId || "",
    });
    setShowCompanyForm(false);
  };

  const cancelCompanyEdit = () => {
    setEditingCompany(null);
    setShowCompanyForm(false);
    setCompanyForm({ name: "", bmdId: "", finmaticsId: "" });
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
      </div>
    );
  }

  if (error && !client) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
        <h3 className="text-lg font-medium text-slate-700">{error}</h3>
        <Link href="/mandanten">
          <Button className="mt-4" variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zur Übersicht
          </Button>
        </Link>
      </div>
    );
  }

  if (!client) return null;

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
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel} disabled={saving}>
                <X className="w-4 h-4 mr-2" />
                Abbrechen
              </Button>
              <Button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Speichern
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleToggleActive} disabled={saving}>
                {client.isActive ? (
                  <>
                    <XCircle className="w-4 h-4 mr-2" />
                    Deaktivieren
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Aktivieren
                  </>
                )}
              </Button>
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="w-4 h-4 mr-2" />
                Bearbeiten
              </Button>
            </>
          )}
        </div>
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
          <div className="flex items-center gap-2">
            {isEditing ? (
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="text-2xl font-bold h-auto py-1"
                placeholder="Name des Mandanten"
              />
            ) : (
              <h1 className="text-2xl font-bold text-slate-900">{client.name}</h1>
            )}
            <Badge
              variant="outline"
              className={client.isActive 
                ? "bg-green-50 text-green-700 border-green-200" 
                : "bg-slate-100 text-slate-500"}
            >
              {client.isActive ? "Aktiv" : "Inaktiv"}
            </Badge>
          </div>
          <p className="text-slate-500">{client.companies.length} Firma{client.companies.length !== 1 ? "en" : ""}</p>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              {isEditing ? (
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@beispiel.at"
                />
              ) : (
                <p className="text-slate-900">{client.email || "—"}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Phone className="w-4 h-4" /> Telefon
              </label>
              {isEditing ? (
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+43 1 234 5678"
                />
              ) : (
                <p className="text-slate-900">{client.phone || "—"}</p>
              )}
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
            {isEditing ? (
              <>
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
              </>
            ) : (
              <div className="text-slate-900">
                {client.street || client.city ? (
                  <>
                    {client.street && <p>{client.street}</p>}
                    {(client.postalCode || client.city) && (
                      <p>{[client.postalCode, client.city].filter(Boolean).join(" ")}</p>
                    )}
                    {client.country && <p>{client.country}</p>}
                  </>
                ) : (
                  <p className="text-slate-400">Keine Adresse hinterlegt</p>
                )}
              </div>
            )}
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
              {isEditing ? (
                <Input
                  value={formData.taxId}
                  onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                  placeholder="12 345/6789"
                />
              ) : (
                <p className="text-slate-900">{client.taxId || "—"}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600">UID-Nummer</label>
              {isEditing ? (
                <Input
                  value={formData.vatId}
                  onChange={(e) => setFormData({ ...formData, vatId: e.target.value })}
                  placeholder="ATU12345678"
                />
              ) : (
                <p className="text-slate-900">{client.vatId || "—"}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notizen</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full p-3 border rounded-lg text-sm min-h-[120px]"
                placeholder="Interne Notizen zum Mandanten..."
              />
            ) : (
              <p className="text-slate-900 whitespace-pre-wrap">
                {client.notes || <span className="text-slate-400">Keine Notizen</span>}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Companies Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Firmen ({client.companies.length})
          </CardTitle>
          {!showCompanyForm && !editingCompany && (
            <Button size="sm" onClick={() => setShowCompanyForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Firma hinzufügen
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {/* Add/Edit Company Form */}
          {(showCompanyForm || editingCompany) && (
            <div className="mb-4 p-4 border rounded-lg bg-slate-50">
              <h4 className="font-medium mb-3">
                {editingCompany ? "Firma bearbeiten" : "Neue Firma hinzufügen"}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <Input
                  value={companyForm.name}
                  onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                  placeholder="Firmenname *"
                />
                <Input
                  value={companyForm.bmdId}
                  onChange={(e) => setCompanyForm({ ...companyForm, bmdId: e.target.value })}
                  placeholder="BMD-ID"
                />
                <Input
                  value={companyForm.finmaticsId}
                  onChange={(e) => setCompanyForm({ ...companyForm, finmaticsId: e.target.value })}
                  placeholder="Finmatics-ID"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={cancelCompanyEdit}
                >
                  Abbrechen
                </Button>
                <Button 
                  size="sm"
                  onClick={editingCompany ? handleUpdateCompany : handleAddCompany}
                  disabled={!companyForm.name.trim() || savingCompany}
                >
                  {savingCompany && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingCompany ? "Aktualisieren" : "Hinzufügen"}
                </Button>
              </div>
            </div>
          )}

          {/* Companies List */}
          {client.companies.length === 0 ? (
            <p className="text-slate-500 text-center py-8">
              Noch keine Firmen zugeordnet
            </p>
          ) : (
            <div className="space-y-2">
              {client.companies.map((company) => (
                <div 
                  key={company.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="font-medium">{company.name}</p>
                      <div className="flex gap-3 text-xs text-slate-500">
                        {company.bmdId && <span>BMD: {company.bmdId}</span>}
                        {company.finmaticsId && <span>Finmatics: {company.finmaticsId}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={company.isActive ? "bg-green-50 text-green-700" : ""}
                    >
                      {company.isActive ? "Aktiv" : "Inaktiv"}
                    </Badge>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => startEditCompany(company)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleRemoveCompany(company.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metadata */}
      <div className="text-xs text-slate-400 flex gap-4">
        <span>Erstellt: {new Date(client.createdAt).toLocaleDateString("de-DE")}</span>
        <span>Aktualisiert: {new Date(client.updatedAt).toLocaleDateString("de-DE")}</span>
      </div>
    </div>
  );
}
