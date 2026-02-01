import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAllCompanies, getCompanyById, createCompany, updateCompany } from "@/db/queries";
import { z } from "zod";

const createCompanySchema = z.object({
  name: z.string().min(1).max(255),
  bmdId: z.string().optional(),
  finmaticsId: z.string().optional(),
});

const updateCompanySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  bmdId: z.string().optional(),
  finmaticsId: z.string().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/companies - List companies (employees) or get own company (customers)
export async function GET(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("id");
  const includeInactive = searchParams.get("includeInactive") === "true";

  try {
    // If customer, only return their company
    if (session.user.role === "customer") {
      if (!session.user.companyId) {
        return NextResponse.json({ companies: [] });
      }
      
      const company = await getCompanyById(session.user.companyId);
      return NextResponse.json({ 
        companies: company ? [company] : [] 
      });
    }

    // Employees can list all or get specific
    if (companyId) {
      const company = await getCompanyById(companyId);
      
      if (!company) {
        return NextResponse.json(
          { error: "Mandant nicht gefunden" },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ company });
    }

    const companies = await getAllCompanies(includeInactive);
    return NextResponse.json({ companies });
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json(
      { error: "Fehler beim Laden der Mandanten" },
      { status: 500 }
    );
  }
}

// POST /api/companies - Create company (employees only)
export async function POST(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "employee") {
    return NextResponse.json(
      { error: "Nur Mitarbeiter können Mandanten erstellen" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const data = createCompanySchema.parse(body);

    const company = await createCompany(data);

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
      { error: "Fehler beim Erstellen des Mandanten" },
      { status: 500 }
    );
  }
}

// PATCH /api/companies - Update company (employees only)
export async function PATCH(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "employee") {
    return NextResponse.json(
      { error: "Nur Mitarbeiter können Mandanten bearbeiten" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("id");

  if (!companyId) {
    return NextResponse.json(
      { error: "id Parameter fehlt" },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const data = updateCompanySchema.parse(body);

    const company = await updateCompany(companyId, data);

    if (!company) {
      return NextResponse.json(
        { error: "Mandant nicht gefunden" },
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
      { error: "Fehler beim Aktualisieren des Mandanten" },
      { status: 500 }
    );
  }
}
