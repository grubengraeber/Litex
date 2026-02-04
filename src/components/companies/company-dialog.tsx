"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Company {
  id: string;
  name: string;
  bmdId: string | null;
  finmaticsId: string | null;
  isActive: boolean;
}

interface CompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company?: Company | null;
  onSuccess?: () => void;
}

export function CompanyDialog({
  open,
  onOpenChange,
  company,
  onSuccess,
}: CompanyDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    bmdId: "",
    finmaticsId: "",
  });

  const isEditMode = !!company;

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || "",
        bmdId: company.bmdId || "",
        finmaticsId: company.finmaticsId || "",
      });
    } else {
      setFormData({
        name: "",
        bmdId: "",
        finmaticsId: "",
      });
    }
  }, [company, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Bitte geben Sie einen Namen ein");
      return;
    }

    setLoading(true);

    try {
      const url = isEditMode
        ? `/api/companies?id=${company.id}`
        : "/api/companies";

      const response = await fetch(url, {
        method: isEditMode ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          bmdId: formData.bmdId.trim() || undefined,
          finmaticsId: formData.finmaticsId.trim() || undefined,
        }),
      });

      if (response.ok) {
        toast.success(
          isEditMode
            ? "Mandant erfolgreich aktualisiert"
            : "Mandant erfolgreich erstellt"
        );
        onOpenChange(false);
        setFormData({
          name: "",
          bmdId: "",
          finmaticsId: "",
        });
        onSuccess?.();
      } else {
        const error = await response.json();
        toast.error(error.error || "Fehler beim Speichern des Mandanten");
      }
    } catch (error) {
      console.error("Error saving company:", error);
      toast.error("Fehler beim Speichern des Mandanten");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Mandant bearbeiten" : "Neuen Mandant erstellen"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Bearbeiten Sie die Mandantendaten."
              : "Erstellen Sie einen neuen Mandanten mit BMD und Finmatics Integration."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Firmenname"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bmdId">BMD ID</Label>
            <Input
              id="bmdId"
              type="text"
              placeholder="Optional"
              value={formData.bmdId}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, bmdId: e.target.value }))
              }
            />
            <p className="text-xs text-slate-500">
              Eindeutige ID für die BMD-Integration
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="finmaticsId">Finmatics ID</Label>
            <Input
              id="finmaticsId"
              type="text"
              placeholder="Optional"
              value={formData.finmaticsId}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  finmaticsId: e.target.value,
                }))
              }
            />
            <p className="text-xs text-slate-500">
              Eindeutige ID für die Finmatics-Integration
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? "Wird gespeichert..."
                : isEditMode
                ? "Speichern"
                : "Erstellen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
