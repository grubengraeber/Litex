import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";
import { companies, users, tasks, comments, files, permissions, roles, rolePermissions, userRoles } from "@/db/schema";

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
    await db.delete(userRoles);
    await db.delete(users);
    await db.delete(companies);
    await db.delete(rolePermissions);
    await db.delete(permissions);
    await db.delete(roles);

    // Create Permissions
    console.log("🔑 Creating permissions...");
    const permissionData = [
      // Navigation permissions
      { name: "view_dashboard", description: "View dashboard", category: "navigation" },
      { name: "view_tasks", description: "View tasks page", category: "navigation" },
      { name: "view_chats", description: "View chats page", category: "navigation" },
      { name: "view_files", description: "View files page", category: "navigation" },
      { name: "view_companies", description: "View companies page", category: "navigation" },
      { name: "view_users", description: "View users page", category: "navigation" },
      { name: "view_teams", description: "View teams page", category: "navigation" },
      { name: "view_audit_logs", description: "View audit logs page", category: "navigation" },
      { name: "view_settings", description: "View settings page", category: "navigation" },

      // Task permissions
      { name: "create_task", description: "Create new tasks", category: "tasks" },
      { name: "create_tasks", description: "Create new tasks (alias)", category: "tasks" },
      { name: "read_task", description: "Read task details", category: "tasks" },
      { name: "update_task", description: "Update task information", category: "tasks" },
      { name: "edit_tasks", description: "Edit tasks (alias)", category: "tasks" },
      { name: "delete_task", description: "Delete tasks", category: "tasks" },
      { name: "delete_tasks", description: "Delete tasks (alias)", category: "tasks" },
      { name: "submit_task", description: "Submit task for review", category: "tasks" },
      { name: "submit_tasks", description: "Submit tasks (alias)", category: "tasks" },
      { name: "complete_task", description: "Mark task as completed", category: "tasks" },
      { name: "complete_tasks", description: "Complete tasks (alias)", category: "tasks" },
      { name: "assign_task", description: "Assign tasks to users", category: "tasks" },
      { name: "return_tasks", description: "Return tasks for revision", category: "tasks" },
      { name: "view_all_tasks", description: "View all tasks across all companies", category: "tasks" },

      // File permissions
      { name: "upload_file", description: "Upload files", category: "files" },
      { name: "download_file", description: "Download files", category: "files" },
      { name: "delete_file", description: "Delete files", category: "files" },
      { name: "approve_file", description: "Approve uploaded files", category: "files" },
      { name: "reject_file", description: "Reject uploaded files", category: "files" },

      // User permissions
      { name: "create_user", description: "Create new users", category: "users" },
      { name: "read_user", description: "View user information", category: "users" },
      { name: "update_user", description: "Update user information", category: "users" },
      { name: "delete_user", description: "Delete users", category: "users" },
      { name: "invite_user", description: "Invite new users", category: "users" },
      { name: "activate_user", description: "Activate user accounts", category: "users" },
      { name: "deactivate_user", description: "Deactivate user accounts", category: "users" },

      // Company permissions
      { name: "create_company", description: "Create new companies", category: "companies" },
      { name: "read_company", description: "View company information", category: "companies" },
      { name: "update_company", description: "Update company information", category: "companies" },
      { name: "delete_company", description: "Delete companies", category: "companies" },
      { name: "activate_company", description: "Activate companies", category: "companies" },
      { name: "deactivate_company", description: "Deactivate companies", category: "companies" },

      // Team permissions
      { name: "create_team", description: "Create new teams", category: "teams" },
      { name: "read_team", description: "View team information", category: "teams" },
      { name: "update_team", description: "Update team information", category: "teams" },
      { name: "delete_team", description: "Delete teams", category: "teams" },
      { name: "assign_team_member", description: "Assign members to teams", category: "teams" },
      { name: "remove_team_member", description: "Remove members from teams", category: "teams" },

      // Role permissions
      { name: "create_role", description: "Create new roles", category: "roles" },
      { name: "read_role", description: "View role information", category: "roles" },
      { name: "update_role", description: "Update role information", category: "roles" },
      { name: "delete_role", description: "Delete roles", category: "roles" },
      { name: "assign_role", description: "Assign roles to users", category: "roles" },
      { name: "revoke_role", description: "Revoke roles from users", category: "roles" },

      // Audit permissions
      { name: "read_audit_logs", description: "View audit logs", category: "audit" },
      { name: "export_audit_logs", description: "Export audit logs", category: "audit" },
    ];

    const createdPermissions = await db.insert(permissions).values(permissionData).returning();

    // Create a map for easy permission lookup
    const permissionMap = new Map(createdPermissions.map(p => [p.name, p.id]));

    // Create Roles
    console.log("👤 Creating roles...");
    const roleData = [
      { name: "Admin", description: "Full system access with all permissions", isSystem: true },
      { name: "Employee", description: "Standard employee access with task management", isSystem: true },
      { name: "Customer", description: "Customer access with limited permissions", isSystem: true },
    ];

    const createdRoles = await db.insert(roles).values(roleData).returning();

    // Create a map for easy role lookup
    const roleMap = new Map(createdRoles.map(r => [r.name, r.id]));

    // Assign Permissions to Roles
    console.log("🔗 Assigning permissions to roles...");

    // Admin role - all permissions
    const adminPermissions = createdPermissions.map(p => ({
      roleId: roleMap.get("Admin")!,
      permissionId: p.id,
    }));

    // Employee role - specific permissions
    const employeePermissionNames = [
      // All view permissions
      "view_dashboard", "view_tasks", "view_chats", "view_files", "view_companies",
      "view_users", "view_teams", "view_audit_logs", "view_settings",
      // Task permissions (includes both singular and plural forms)
      "create_task", "create_tasks", "read_task", "update_task", "edit_tasks",
      "submit_task", "submit_tasks", "complete_task", "complete_tasks",
      "assign_task", "return_tasks", "view_all_tasks",
      // File permissions (all except delete)
      "upload_file", "download_file", "approve_file", "reject_file",
      // User permissions
      "read_user", "invite_user",
      // Company permissions
      "read_company", "create_company",
      // Team permissions (all)
      "create_team", "read_team", "update_team", "delete_team", "assign_team_member", "remove_team_member",
      // Audit permissions
      "read_audit_logs",
    ];

    const employeePermissions = employeePermissionNames.map(name => ({
      roleId: roleMap.get("Employee")!,
      permissionId: permissionMap.get(name)!,
    }));

    // Customer role - limited permissions
    const customerPermissionNames = [
      // View permissions (limited)
      "view_dashboard", "view_tasks", "view_chats", "view_files",
      // Task permissions (limited)
      "create_task", "read_task", "submit_task",
      // File permissions (own files only)
      "upload_file", "download_file",
      // Company permissions
      "create_company",
    ];

    const customerPermissions = customerPermissionNames.map(name => ({
      roleId: roleMap.get("Customer")!,
      permissionId: permissionMap.get(name)!,
    }));

    // Insert all role permissions
    await db.insert(rolePermissions).values([
      ...adminPermissions,
      ...employeePermissions,
      ...customerPermissions,
    ]);

    console.log(`✅ Created ${createdPermissions.length} permissions`);
    console.log(`✅ Created ${createdRoles.length} roles`);
    console.log(`✅ Assigned permissions to roles`);

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
    const [admin, employee1, employee2, customer1, customer2, customer3] = await db
      .insert(users)
      .values([
        {
          name: "Admin User",
          email: "admin@litex.com",
          role: "employee",
          status: "active",
          emailVerified: new Date(),
        },
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

    // Assign Roles to Users
    console.log("🎭 Assigning roles to users...");
    const userRoleData = [
      // Admin gets Admin role
      { userId: admin.id, roleId: roleMap.get("Admin")!, assignedBy: null },
      // Employees get Employee role
      { userId: employee1.id, roleId: roleMap.get("Employee")!, assignedBy: admin.id },
      { userId: employee2.id, roleId: roleMap.get("Employee")!, assignedBy: admin.id },
      // Customers get Customer role
      { userId: customer1.id, roleId: roleMap.get("Customer")!, assignedBy: employee1.id },
      { userId: customer2.id, roleId: roleMap.get("Customer")!, assignedBy: employee1.id },
      { userId: customer3.id, roleId: roleMap.get("Customer")!, assignedBy: employee2.id },
    ];

    await db.insert(userRoles).values(userRoleData);
    console.log(`✅ Assigned roles to ${userRoleData.length} users`);

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
    console.log(`Created ${createdPermissions.length} permissions`);
    console.log(`Created ${createdRoles.length} roles`);
    console.log(`Created ${createdTasks.length} tasks`);
    console.log(`Created ${commentData.length} comments`);
    console.log(`Created ${fileData.length} file records`);

    // Display summary
    console.log("\n📊 Summary:");
    const categories = new Set(createdPermissions.map(p => p.category));
    console.log("Permissions:", createdPermissions.length, "across", Array.from(categories).length, "categories");
    console.log("Roles:", createdRoles.map(r => r.name).join(", "));
    console.log("Companies:", [company1.name, company2.name, company3.name].join(", "));
    console.log("Users:", [admin.name, employee1.name, employee2.name, customer1.name, customer2.name, customer3.name].join(", "));
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
