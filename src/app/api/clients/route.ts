import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAllClients, getClientById, createClient, updateClient, deleteClient } from "@/db/queries";
import { z } from "zod";

const createClientSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  taxId: z.string().optional(),
  vatId: z.string().optional(),
  notes: z.string().optional(),
});

const updateClientSchema = createClientSchema.partial().extend({
  isActive: z.boolean().optional(),
});

// GET /api/clients - List clients or get specific client
export async function GET(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only employees can access client list
  if (session.user.role !== "employee") {
    return NextResponse.json(
      { error: "Nur Mitarbeiter können Mandanten einsehen" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("id");
  const search = searchParams.get("search") || undefined;
  const includeInactive = searchParams.get("includeInactive") === "true";
  const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined;
  const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!) : undefined;

  try {
    if (clientId) {
      const client = await getClientById(clientId);
      
      if (!client) {
        return NextResponse.json(
          { error: "Mandant nicht gefunden" },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ client });
    }

    const clients = await getAllClients({ search, includeInactive, limit, offset });
    return NextResponse.json({ clients });
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json(
      { error: "Fehler beim Laden der Mandanten" },
      { status: 500 }
    );
  }
}

// POST /api/clients - Create client
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
    const data = createClientSchema.parse(body);

    // Clean up empty strings
    const cleanData = Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, v === "" ? undefined : v])
    );

    const client = await createClient(cleanData as Parameters<typeof createClient>[0]);

    return NextResponse.json({ client }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Ungültige Eingabe", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating client:", error);
    return NextResponse.json(
      { error: "Fehler beim Erstellen des Mandanten" },
      { status: 500 }
    );
  }
}

// PATCH /api/clients - Update client
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
  const clientId = searchParams.get("id");

  if (!clientId) {
    return NextResponse.json(
      { error: "id Parameter fehlt" },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const data = updateClientSchema.parse(body);

    const client = await updateClient(clientId, data);

    if (!client) {
      return NextResponse.json(
        { error: "Mandant nicht gefunden" },
        { status: 404 }
      );
    }

    return NextResponse.json({ client });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Ungültige Eingabe", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating client:", error);
    return NextResponse.json(
      { error: "Fehler beim Aktualisieren des Mandanten" },
      { status: 500 }
    );
  }
}

// DELETE /api/clients - Delete client
export async function DELETE(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "employee") {
    return NextResponse.json(
      { error: "Nur Mitarbeiter können Mandanten löschen" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("id");

  if (!clientId) {
    return NextResponse.json(
      { error: "id Parameter fehlt" },
      { status: 400 }
    );
  }

  try {
    await deleteClient(clientId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting client:", error);
    return NextResponse.json(
      { error: "Fehler beim Löschen des Mandanten" },
      { status: 500 }
    );
  }
}
