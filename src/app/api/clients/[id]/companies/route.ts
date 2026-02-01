import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCompaniesByClient, createCompany, updateCompany } from "@/db/queries";
import { db } from "@/db";
import { companies } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const createCompanySchema = z.object({
  name: z.string().min(1).max(255),
  bmdId: z.string().optional(),
  finmaticsId: z.string().optional(),
});

const updateCompanySchema = createCompanySchema.partial().extend({
  isActive: z.boolean().optional(),
});

// GET /api/clients/[id]/companies - List companies for a client
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "employee") {
    return NextResponse.json(
      { error: "Nur Mitarbeiter können auf diese Daten zugreifen" },
      { status: 403 }
    );
  }

  try {
    const clientCompanies = await getCompaniesByClient(params.id);
    return NextResponse.json({ companies: clientCompanies });
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json(
      { error: "Fehler beim Laden der Firmen" },
      { status: 500 }
    );
  }
}

// POST /api/clients/[id]/companies - Add company to client
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "employee") {
    return NextResponse.json(
      { error: "Nur Mitarbeiter können Firmen hinzufügen" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const data = createCompanySchema.parse(body);

    // Create company with client reference
    if (!db) throw new Error("Database not configured");
    
    const [company] = await db.insert(companies)
      .values({
        ...data,
        clientId: params.id,
      })
      .returning();

    return NextResponse.json({ company }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Ungültige Eingabe", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating company:", error);
    return NextResponse.json(
      { error: "Fehler beim Erstellen der Firma" },
      { status: 500 }
    );
  }
}

// PATCH /api/clients/[id]/companies - Update company
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "employee") {
    return NextResponse.json(
      { error: "Nur Mitarbeiter können Firmen bearbeiten" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("companyId");

  if (!companyId) {
    return NextResponse.json(
      { error: "companyId Parameter fehlt" },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const data = updateCompanySchema.parse(body);

    const company = await updateCompany(companyId, data);

    if (!company) {
      return NextResponse.json(
        { error: "Firma nicht gefunden" },
        { status: 404 }
      );
    }

    return NextResponse.json({ company });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Ungültige Eingabe", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating company:", error);
    return NextResponse.json(
      { error: "Fehler beim Aktualisieren der Firma" },
      { status: 500 }
    );
  }
}

// DELETE /api/clients/[id]/companies - Remove company from client
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "employee") {
    return NextResponse.json(
      { error: "Nur Mitarbeiter können Firmen löschen" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("companyId");

  if (!companyId) {
    return NextResponse.json(
      { error: "companyId Parameter fehlt" },
      { status: 400 }
    );
  }

  try {
    if (!db) throw new Error("Database not configured");
    
    // Remove client reference (soft delete - don't delete company as tasks may reference it)
    await db.update(companies)
      .set({ clientId: null })
      .where(eq(companies.id, companyId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing company:", error);
    return NextResponse.json(
      { error: "Fehler beim Entfernen der Firma" },
      { status: 500 }
    );
  }
}
