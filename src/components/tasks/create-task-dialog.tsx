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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Company {
  id: string;
  name: string;
}

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companies: Company[];
  onTaskCreated?: () => void;
}

export function CreateTaskDialog({
  open,
  onOpenChange,
  companies,
  onTaskCreated,
}: CreateTaskDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyId: "",
    bookingText: "",
    amount: "",
    documentDate: "",
    bookingDate: "",
    period: "",
    dueDate: "",
    bmdBookingId: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.companyId) {
      toast.error("Bitte wählen Sie einen Mandanten aus");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: formData.companyId,
          bookingText: formData.bookingText || null,
          amount: formData.amount || null,
          documentDate: formData.documentDate || null,
          bookingDate: formData.bookingDate || null,
          period: formData.period || null,
          dueDate: formData.dueDate || null,
          bmdBookingId: formData.bmdBookingId || null,
        }),
      });

      if (response.ok) {
        toast.success("Aufgabe erfolgreich erstellt");
        onOpenChange(false);
        setFormData({
          companyId: "",
          bookingText: "",
          amount: "",
          documentDate: "",
          bookingDate: "",
          period: "",
          dueDate: "",
          bmdBookingId: "",
        });
        onTaskCreated?.();
      } else {
        const error = await response.json();
        toast.error(error.error || "Fehler beim Erstellen der Aufgabe");
      }
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error("Fehler beim Erstellen der Aufgabe");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Neue Aufgabe erstellen</DialogTitle>
          <DialogDescription>
            Erstellen Sie eine neue Aufgabe für einen Mandanten.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Company Selection */}
          <div className="space-y-2">
            <Label htmlFor="company">
              Mandant <span className="text-red-500">*</span>
            </Label>
            <Combobox
              options={companies.map((company) => ({
                value: company.id,
                label: company.name,
              }))}
              value={formData.companyId}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, companyId: value }))
              }
              placeholder="Mandant auswählen..."
              searchPlaceholder="Mandant suchen..."
              emptyText="Kein Mandant gefunden."
            />
          </div>

          {/* Booking Text */}
          <div className="space-y-2">
            <Label htmlFor="bookingText">Buchungstext</Label>
            <Textarea
              id="bookingText"
              placeholder="Beschreibung der Aufgabe..."
              value={formData.bookingText}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, bookingText: e.target.value }))
              }
              rows={3}
            />
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Betrag</Label>
              <Input
                id="amount"
                type="text"
                placeholder="0,00"
                value={formData.amount}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, amount: e.target.value }))
                }
              />
            </div>

            {/* Period */}
            <div className="space-y-2">
              <Label htmlFor="period">Periode</Label>
              <Input
                id="period"
                type="month"
                value={formData.period}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, period: e.target.value }))
                }
              />
            </div>

            {/* Document Date */}
            <div className="space-y-2">
              <Label htmlFor="documentDate">Belegdatum</Label>
              <Input
                id="documentDate"
                type="date"
                value={formData.documentDate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    documentDate: e.target.value,
                  }))
                }
              />
            </div>

            {/* Booking Date */}
            <div className="space-y-2">
              <Label htmlFor="bookingDate">Buchungsdatum</Label>
              <Input
                id="bookingDate"
                type="date"
                value={formData.bookingDate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    bookingDate: e.target.value,
                  }))
                }
              />
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <Label htmlFor="dueDate">Fälligkeitsdatum</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, dueDate: e.target.value }))
                }
              />
            </div>

            {/* BMD Booking ID */}
            <div className="space-y-2">
              <Label htmlFor="bmdBookingId">BMD Buchungs-ID</Label>
              <Input
                id="bmdBookingId"
                type="text"
                placeholder="Optional"
                value={formData.bmdBookingId}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    bmdBookingId: e.target.value,
                  }))
                }
              />
            </div>
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
              {loading ? "Wird erstellt..." : "Aufgabe erstellen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
