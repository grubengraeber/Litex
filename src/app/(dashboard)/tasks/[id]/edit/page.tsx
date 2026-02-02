"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { useUnsavedChanges } from "@/components/providers/unsaved-changes-provider";

// Mock task data
const mockTask = {
  id: "1",
  title: "Kunden-Rechnungen Q1",
  description: "Erstellung und Versand der Kundenrechnungen für das erste Quartal. Bitte alle offenen Posten prüfen und die Rechnungen bis zum Fälligkeitsdatum versenden.",
  bookingText: "Ausgangsrechnung Q1/2025",
  amount: "12450.00",
  documentDate: "2025-02-01",
  bookingDate: "2025-02-15",
  dueDate: "2025-02-15",
  status: "open",
  companyId: "c1",
};

export default function TaskEditPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const { setDirty, markClean, navigateWithConfirm } = useUnsavedChanges();
  
  // Store initial values for comparison
  const initialFormData = useMemo(() => ({
    title: mockTask.title,
    description: mockTask.description,
    bookingText: mockTask.bookingText,
    amount: mockTask.amount,
    documentDate: mockTask.documentDate,
    dueDate: mockTask.dueDate,
    status: mockTask.status,
  }), []);

  const [formData, setFormData] = useState(initialFormData);

  // Check if form has changed from initial values
  const hasChanges = useCallback(() => {
    return JSON.stringify(formData) !== JSON.stringify(initialFormData);
  }, [formData, initialFormData]);

  // Update dirty state when form changes
  useEffect(() => {
    setDirty(hasChanges());
  }, [formData, hasChanges, setDirty]);

  // Clean up on unmount
  useEffect(() => {
    return () => markClean();
  }, [markClean]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Save to database
    console.log("Saving:", formData);
    markClean(); // Clear dirty state before navigation
    router.push(`/tasks/${id}`);
  };

  const handleCancel = () => {
    navigateWithConfirm(`/tasks/${id}`);
  };

  const handleBack = () => {
    navigateWithConfirm(`/tasks/${id}`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Zurück zur Aufgabe
        </Button>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Aufgabe bearbeiten</h1>
        <p className="text-slate-500 mt-1">Ändern Sie die Details dieser Aufgabe</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Grunddaten</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Titel *
              </label>
              <Input
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="Titel der Aufgabe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Beschreibung
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Beschreibung der Aufgabe..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="open">Offen</option>
                <option value="submitted">Eingereicht</option>
                <option value="completed">Erledigt</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Fälligkeitsdatum
              </label>
              <Input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Buchungsdaten</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Buchungstext
              </label>
              <Input
                name="bookingText"
                value={formData.bookingText}
                onChange={handleChange}
                placeholder="Buchungstext"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Betrag (€)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Belegdatum
                </label>
                <Input
                  type="date"
                  name="documentDate"
                  value={formData.documentDate}
                  onChange={handleChange}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between mt-6">
          <Button type="button" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50">
            <Trash2 className="w-4 h-4 mr-2" />
            Löschen
          </Button>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Abbrechen
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              <Save className="w-4 h-4 mr-2" />
              Speichern
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
