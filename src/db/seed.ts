import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";
import { companies, users, tasks, comments, files } from "@/db/schema";

// Load environment variables
config({ path: ".env" });

async function seed() {
  console.log("🌱 Starting database seed...");

  // Initialize database connection
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  const db = drizzle(postgres(connectionString), { schema });

  try {
    // Clean existing data
    console.log("🧹 Cleaning existing data...");
    await db.delete(files);
    await db.delete(comments);
    await db.delete(tasks);
    await db.delete(users);
    await db.delete(companies);

    // Create Companies
    console.log("🏢 Creating companies...");
    const [company1, company2, company3] = await db
      .insert(companies)
      .values([
        {
          name: "Mustermann GmbH",
          bmdId: "BMD-001",
          finmaticsId: "FIN-001",
          isActive: true,
        },
        {
          name: "Beispiel AG",
          bmdId: "BMD-002",
          finmaticsId: "FIN-002",
          isActive: true,
        },
        {
          name: "Test & Partner KG",
          bmdId: "BMD-003",
          finmaticsId: "FIN-003",
          isActive: true,
        },
      ])
      .returning();

    // Create Users
    console.log("👥 Creating users...");
    const [employee1, employee2, customer1, customer2, customer3] = await db
      .insert(users)
      .values([
        {
          name: "Thomas Schmidt",
          email: "thomas@litex.com",
          role: "employee",
          status: "active",
          emailVerified: new Date(),
        },
        {
          name: "Anna Müller",
          email: "anna@litex.com",
          role: "employee",
          status: "active",
          emailVerified: new Date(),
        },
        {
          name: "Maria Weber",
          email: "maria@mustermann-gmbh.de",
          role: "customer",
          companyId: company1.id,
          status: "active",
          emailVerified: new Date(),
        },
        {
          name: "Peter Schneider",
          email: "peter@beispiel-ag.de",
          role: "customer",
          companyId: company2.id,
          status: "active",
          emailVerified: new Date(),
        },
        {
          name: "Lisa König",
          email: "lisa@test-partner.de",
          role: "customer",
          companyId: company3.id,
          status: "active",
          emailVerified: new Date(),
        },
      ])
      .returning();

    // Create Tasks with calculated traffic lights
    console.log("📋 Creating tasks...");
    const now = new Date();
    const calculateDaysAgo = (days: number) => {
      const date = new Date(now);
      date.setDate(date.getDate() - days);
      return date;
    };

    const calculateTrafficLight = (daysAgo: number): "green" | "yellow" | "red" => {
      if (daysAgo <= 30) return "green";
      if (daysAgo <= 60) return "yellow";
      return "red";
    };

    const taskData = [
      // Mustermann GmbH - February tasks
      {
        companyId: company1.id,
        bmdBookingId: "BMD-001-202502-001",
        bookingText: "Kunden-Rechnungen Q1",
        amount: "12450.00",
        documentDate: "2025-02-01",
        bookingDate: "2025-02-05",
        period: "02",
        status: "open" as const,
        daysAgo: 10,
      },
      {
        companyId: company1.id,
        bmdBookingId: "BMD-001-202502-002",
        bookingText: "Kontoauszüge abstimmen",
        amount: "0.00",
        documentDate: "2025-01-15",
        bookingDate: "2025-01-20",
        period: "02",
        status: "open" as const,
        daysAgo: 45,
      },
      {
        companyId: company1.id,
        bmdBookingId: "BMD-001-202502-003",
        bookingText: "Spesenberichte prüfen",
        amount: "1234.56",
        documentDate: "2024-12-01",
        bookingDate: "2024-12-05",
        period: "02",
        status: "open" as const,
        daysAgo: 70,
      },
      {
        companyId: company1.id,
        bmdBookingId: "BMD-001-202503-001",
        bookingText: "Lohnabrechnung März",
        amount: "8500.00",
        documentDate: "2025-02-25",
        bookingDate: "2025-02-28",
        period: "03",
        status: "completed" as const,
        daysAgo: 2,
      },

      // Beispiel AG - February tasks
      {
        companyId: company2.id,
        bmdBookingId: "BMD-002-202502-001",
        bookingText: "Steuerunterlagen vorbereiten",
        amount: "0.00",
        documentDate: "2025-02-10",
        bookingDate: "2025-02-12",
        period: "02",
        status: "submitted" as const,
        daysAgo: 5,
      },
      {
        companyId: company2.id,
        bmdBookingId: "BMD-002-202502-002",
        bookingText: "Jahresabschluss vorbereiten",
        amount: "0.00",
        documentDate: "2025-01-20",
        bookingDate: "2025-01-25",
        period: "02",
        status: "submitted" as const,
        daysAgo: 35,
      },
      {
        companyId: company2.id,
        bmdBookingId: "BMD-002-202501-001",
        bookingText: "Jahresabschluss 2024",
        amount: "0.00",
        documentDate: "2025-01-15",
        bookingDate: "2025-01-20",
        period: "01",
        status: "completed" as const,
        daysAgo: 90,
      },

      // Test & Partner KG - February tasks
      {
        companyId: company3.id,
        bmdBookingId: "BMD-003-202502-001",
        bookingText: "Reisekostenabrechnung Februar",
        amount: "2340.50",
        documentDate: "2025-02-08",
        bookingDate: "2025-02-10",
        period: "02",
        status: "open" as const,
        daysAgo: 15,
      },
      {
        companyId: company3.id,
        bmdBookingId: "BMD-003-202502-002",
        bookingText: "Lieferantenrechnungen Q1",
        amount: "15600.00",
        documentDate: "2025-01-25",
        bookingDate: "2025-01-28",
        period: "02",
        status: "open" as const,
        daysAgo: 38,
      },

      // Additional January tasks
      {
        companyId: company1.id,
        bmdBookingId: "BMD-001-202501-001",
        bookingText: "USt-Voranmeldung Januar",
        amount: "3450.00",
        documentDate: "2025-01-10",
        bookingDate: "2025-01-15",
        period: "01",
        status: "completed" as const,
        daysAgo: 25,
      },
      {
        companyId: company3.id,
        bmdBookingId: "BMD-003-202501-001",
        bookingText: "Monatsabschluss Januar",
        amount: "0.00",
        documentDate: "2025-01-28",
        bookingDate: "2025-01-31",
        period: "01",
        status: "completed" as const,
        daysAgo: 8,
      },

      // March tasks
      {
        companyId: company2.id,
        bmdBookingId: "BMD-002-202503-001",
        bookingText: "USt-Voranmeldung Februar",
        amount: "4200.00",
        documentDate: "2025-02-28",
        bookingDate: "2025-03-01",
        period: "03",
        status: "open" as const,
        daysAgo: 3,
      },
      {
        companyId: company3.id,
        bmdBookingId: "BMD-003-202503-001",
        bookingText: "Personalkostenabrechnung März",
        amount: "12300.00",
        documentDate: "2025-02-26",
        bookingDate: "2025-02-28",
        period: "03",
        status: "open" as const,
        daysAgo: 7,
      },
    ];

    const createdTasks = await db
      .insert(tasks)
      .values(
        taskData.map((task) => {
          const createdAt = calculateDaysAgo(task.daysAgo);
          const dueDate = new Date(createdAt);
          dueDate.setDate(dueDate.getDate() + 30);

          return {
            companyId: task.companyId,
            bmdBookingId: task.bmdBookingId,
            bookingText: task.bookingText,
            amount: task.amount,
            documentDate: task.documentDate,
            bookingDate: task.bookingDate,
            period: task.period,
            status: task.status,
            trafficLight: calculateTrafficLight(task.daysAgo),
            dueDate: dueDate.toISOString().split("T")[0],
            createdAt,
            completedAt: task.status === "completed" ? new Date() : null,
            completedBy: task.status === "completed" ? employee1.id : null,
          };
        })
      )
      .returning();

    // Create Comments
    console.log("💬 Creating comments...");
    const commentData = [
      {
        taskId: createdTasks[0].id,
        userId: customer1.id,
        content: "Ich habe die Unterlagen bereits vorbereitet. Wann kann ich diese hochladen?",
      },
      {
        taskId: createdTasks[0].id,
        userId: employee1.id,
        content: "Perfekt! Sie können die Dateien jederzeit über den Upload-Bereich hinzufügen.",
      },
      {
        taskId: createdTasks[0].id,
        userId: customer1.id,
        content: "Vielen Dank, wird gemacht!",
      },
      {
        taskId: createdTasks[4].id,
        userId: employee2.id,
        content: "Die Steuerunterlagen wurden geprüft und sind vollständig.",
      },
      {
        taskId: createdTasks[4].id,
        userId: customer2.id,
        content: "Super, vielen Dank für die schnelle Bearbeitung!",
      },
      {
        taskId: createdTasks[5].id,
        userId: customer2.id,
        content: "Benötigen Sie noch zusätzliche Informationen für den Jahresabschluss?",
      },
      {
        taskId: createdTasks[5].id,
        userId: employee2.id,
        content: "Ja, bitte die Inventurlisten nachreichen.",
      },
      {
        taskId: createdTasks[6].id,
        userId: employee1.id,
        content: "Jahresabschluss wurde erfolgreich erstellt und archiviert.",
      },
      {
        taskId: createdTasks[7].id,
        userId: customer3.id,
        content: "Ich habe alle Belege gesammelt und werde sie heute noch hochladen.",
      },
      {
        taskId: createdTasks[8].id,
        userId: employee1.id,
        content: "Bitte die fehlenden Rechnungen von Lieferant XY nachreichen.",
      },
      {
        taskId: createdTasks[8].id,
        userId: customer3.id,
        content: "Verstanden, ich kümmere mich darum.",
      },
      {
        taskId: createdTasks[9].id,
        userId: employee2.id,
        content: "USt-Voranmeldung wurde erfolgreich eingereicht.",
      },
    ];

    await db.insert(comments).values(commentData);

    // Create Files
    console.log("📎 Creating file records...");
    const fileData = [
      {
        taskId: createdTasks[0].id,
        uploadedBy: customer1.id,
        fileName: "Rechnungen_Q1_2025.pdf",
        mimeType: "application/pdf",
        fileSize: 2450000,
        storageKey: `tasks/${createdTasks[0].id}/Rechnungen_Q1_2025.pdf`,
      },
      {
        taskId: createdTasks[0].id,
        uploadedBy: customer1.id,
        fileName: "Nachweise_Ausgaben.xlsx",
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        fileSize: 856000,
        storageKey: `tasks/${createdTasks[0].id}/Nachweise_Ausgaben.xlsx`,
      },
      {
        taskId: createdTasks[4].id,
        uploadedBy: customer2.id,
        fileName: "Steuererklaerung_2024.pdf",
        mimeType: "application/pdf",
        fileSize: 1200000,
        storageKey: `tasks/${createdTasks[4].id}/Steuererklaerung_2024.pdf`,
      },
      {
        taskId: createdTasks[5].id,
        uploadedBy: customer2.id,
        fileName: "Inventurliste_2024.xlsx",
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        fileSize: 450000,
        storageKey: `tasks/${createdTasks[5].id}/Inventurliste_2024.xlsx`,
      },
      {
        taskId: createdTasks[6].id,
        uploadedBy: employee1.id,
        fileName: "Jahresabschluss_2024_Final.pdf",
        mimeType: "application/pdf",
        fileSize: 3500000,
        storageKey: `tasks/${createdTasks[6].id}/Jahresabschluss_2024_Final.pdf`,
      },
      {
        taskId: createdTasks[6].id,
        uploadedBy: employee1.id,
        fileName: "Bilanz_2024.pdf",
        mimeType: "application/pdf",
        fileSize: 1800000,
        storageKey: `tasks/${createdTasks[6].id}/Bilanz_2024.pdf`,
      },
      {
        taskId: createdTasks[6].id,
        uploadedBy: employee1.id,
        fileName: "GuV_2024.pdf",
        mimeType: "application/pdf",
        fileSize: 950000,
        storageKey: `tasks/${createdTasks[6].id}/GuV_2024.pdf`,
      },
      {
        taskId: createdTasks[7].id,
        uploadedBy: customer3.id,
        fileName: "Reisekosten_Februar_2025.pdf",
        mimeType: "application/pdf",
        fileSize: 680000,
        storageKey: `tasks/${createdTasks[7].id}/Reisekosten_Februar_2025.pdf`,
      },
      {
        taskId: createdTasks[9].id,
        uploadedBy: employee2.id,
        fileName: "USt_Voranmeldung_Januar_2025.pdf",
        mimeType: "application/pdf",
        fileSize: 320000,
        storageKey: `tasks/${createdTasks[9].id}/USt_Voranmeldung_Januar_2025.pdf`,
      },
    ];

    await db.insert(files).values(fileData);

    console.log("✅ Seed completed successfully!");
    console.log(`Created ${createdTasks.length} tasks`);
    console.log(`Created ${commentData.length} comments`);
    console.log(`Created ${fileData.length} file records`);

    // Display summary
    console.log("\n📊 Summary:");
    console.log("Companies:", [company1.name, company2.name, company3.name].join(", "));
    console.log("Users:", [employee1.name, employee2.name, customer1.name, customer2.name, customer3.name].join(", "));
  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  }
}

// Run seed
seed()
  .then(() => {
    console.log("\n🎉 Database seed complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Seed error:", error);
    process.exit(1);
  });
