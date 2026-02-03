import { db } from "@/db";
import { tasks, comments, files, companies, users } from "@/db/schema";
import { eq, and, desc, asc, or, sql } from "drizzle-orm";

// ==================== TASKS ====================

export interface TaskFilters {
  companyId?: string;
  status?: "open" | "submitted" | "completed";
  trafficLight?: "green" | "yellow" | "red";
  period?: string;
  search?: string;
  limit?: number;
  offset?: number;
  includeComments?: boolean;
}

export async function getTasksForUser(
  userId: string,
  userRole: "customer" | "employee",
  userCompanyId: string | null,
  filters: TaskFilters = {}
) {
  if (!db) throw new Error("Database not configured");

  const conditions = [];

  // Role-based filtering
  if (userRole === "customer" && userCompanyId) {
    // Customers can only see their company's tasks
    conditions.push(eq(tasks.companyId, userCompanyId));
  } else if (filters.companyId) {
    // Employees can filter by company
    conditions.push(eq(tasks.companyId, filters.companyId));
  }

  // Additional filters
  if (filters.status) {
    conditions.push(eq(tasks.status, filters.status));
  }
  if (filters.trafficLight) {
    conditions.push(eq(tasks.trafficLight, filters.trafficLight));
  }
  if (filters.period) {
    conditions.push(eq(tasks.period, filters.period));
  }
  if (filters.search) {
    conditions.push(
      or(
        sql`${tasks.bookingText} ILIKE ${`%${filters.search}%`}`,
        sql`${tasks.bmdBookingId} ILIKE ${`%${filters.search}%`}`
      )
    );
  }

  const result = await db.query.tasks.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    with: {
      company: true,
      files: true,
      comments: filters.includeComments ? {
        with: { user: true },
        orderBy: [desc(comments.createdAt)],
      } : undefined,
    },
    orderBy: [asc(tasks.trafficLight), desc(tasks.createdAt)],
    limit: filters.limit || 50,
    offset: filters.offset || 0,
  });

  // Add comment count and last comment if requested
  if (filters.includeComments) {
    return result.map(task => ({
      ...task,
      commentCount: task.comments?.length || 0,
      lastComment: task.comments && task.comments.length > 0 ? task.comments[0] : null,
    }));
  }

  return result;
}

export async function getTaskById(taskId: string) {
  if (!db) throw new Error("Database not configured");

  return db.query.tasks.findFirst({
    where: eq(tasks.id, taskId),
    with: {
      company: true,
      files: { with: { user: true } },
      comments: {
        with: { user: true },
        orderBy: [asc(comments.createdAt)],
      },
    },
  });
}

export async function createTask(data: {
  companyId: string;
  bmdBookingId?: string;
  bookingText?: string;
  amount?: string;
  documentDate?: string;
  bookingDate?: string;
  period?: string;
  dueDate?: string;
}) {
  if (!db) throw new Error("Database not configured");

  const [task] = await db.insert(tasks).values(data).returning();
  return task;
}

export async function updateTask(
  taskId: string,
  data: {
    status?: "open" | "submitted" | "completed";
    trafficLight?: "green" | "yellow" | "red";
    completedAt?: Date | null;
    completedBy?: string | null;
  }
) {
  if (!db) throw new Error("Database not configured");

  const [updated] = await db.update(tasks)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(tasks.id, taskId))
    .returning();

  return updated;
}

export async function deleteTask(taskId: string) {
  if (!db) throw new Error("Database not configured");

  await db.delete(tasks).where(eq(tasks.id, taskId));
}

// ==================== COMMENTS ====================

export async function getCommentsForTask(taskId: string) {
  if (!db) throw new Error("Database not configured");

  return db.query.comments.findMany({
    where: eq(comments.taskId, taskId),
    with: { user: true },
    orderBy: [asc(comments.createdAt)],
  });
}

export async function createComment(data: {
  taskId: string;
  userId: string;
  content: string;
}) {
  if (!db) throw new Error("Database not configured");

  const [comment] = await db.insert(comments).values(data).returning();
  
  // Fetch with user relation
  return db.query.comments.findFirst({
    where: eq(comments.id, comment.id),
    with: { user: true },
  });
}

export async function deleteComment(commentId: string) {
  if (!db) throw new Error("Database not configured");

  await db.delete(comments).where(eq(comments.id, commentId));
}

// ==================== FILES ====================

export async function getFilesForTask(taskId: string) {
  if (!db) throw new Error("Database not configured");

  return db.query.files.findMany({
    where: eq(files.taskId, taskId),
    with: { user: true },
    orderBy: [desc(files.createdAt)],
  });
}

export async function createFile(data: {
  taskId: string;
  uploadedBy: string;
  fileName: string;
  mimeType?: string;
  fileSize?: number;
  bucket: string;
  storageKey: string;
}) {
  if (!db) throw new Error("Database not configured");

  const [file] = await db.insert(files).values(data).returning();
  return file;
}

export async function deleteFile(fileId: string) {
  if (!db) throw new Error("Database not configured");

  const file = await db.query.files.findFirst({
    where: eq(files.id, fileId),
  });
  
  await db.delete(files).where(eq(files.id, fileId));
  
  return file; // Return for S3 cleanup
}

// ==================== COMPANIES ====================

export async function getAllCompanies(includeInactive = false) {
  if (!db) throw new Error("Database not configured");

  const conditions = includeInactive ? undefined : eq(companies.isActive, true);

  return db.query.companies.findMany({
    where: conditions,
    orderBy: [asc(companies.name)],
  });
}

export async function getCompanyById(companyId: string) {
  if (!db) throw new Error("Database not configured");

  return db.query.companies.findFirst({
    where: eq(companies.id, companyId),
    with: { users: true },
  });
}

export async function createCompany(data: {
  name: string;
  bmdId?: string;
  finmaticsId?: string;
}) {
  if (!db) throw new Error("Database not configured");

  const [company] = await db.insert(companies).values(data).returning();
  return company;
}

export async function updateCompany(
  companyId: string,
  data: {
    name?: string;
    bmdId?: string;
    finmaticsId?: string;
    isActive?: boolean;
  }
) {
  if (!db) throw new Error("Database not configured");

  const [updated] = await db.update(companies)
    .set(data)
    .where(eq(companies.id, companyId))
    .returning();

  return updated;
}

// ==================== USERS ====================

export async function getUserById(userId: string) {
  if (!db) throw new Error("Database not configured");

  return db.query.users.findFirst({
    where: eq(users.id, userId),
    with: { company: true },
  });
}

export async function getUserByEmail(email: string) {
  if (!db) throw new Error("Database not configured");

  return db.query.users.findFirst({
    where: eq(users.email, email),
    with: { company: true },
  });
}

export async function getUsersByCompany(companyId: string) {
  if (!db) throw new Error("Database not configured");

  return db.query.users.findMany({
    where: eq(users.companyId, companyId),
    orderBy: [asc(users.name)],
  });
}

export async function getAllUsers() {
  if (!db) throw new Error("Database not configured");

  return db.query.users.findMany({
    with: { company: true },
    orderBy: [asc(users.name)],
  });
}

export async function createUser(data: {
  email: string;
  name?: string;
  role?: "customer" | "employee";
  companyId?: string;
  invitedBy?: string;
}) {
  if (!db) throw new Error("Database not configured");

  const [user] = await db.insert(users).values({
    ...data,
    status: "pending",
    invitedAt: new Date(),
  }).returning();

  return user;
}

export async function updateUser(
  userId: string,
  data: {
    name?: string;
    role?: "customer" | "employee";
    companyId?: string | null;
    status?: "pending" | "active" | "disabled";
  }
) {
  if (!db) throw new Error("Database not configured");

  const [updated] = await db.update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning();

  return updated;
}

// ==================== CRON HELPERS ====================

export async function getTasksNeedingTrafficLightUpdate() {
  if (!db) throw new Error("Database not configured");

  // Get all open tasks with due dates
  return db.query.tasks.findMany({
    where: and(
      eq(tasks.status, "open"),
      sql`${tasks.dueDate} IS NOT NULL`
    ),
  });
}

export async function updateTaskTrafficLight(
  taskId: string,
  trafficLight: "green" | "yellow" | "red"
) {
  if (!db) throw new Error("Database not configured");

  await db.update(tasks)
    .set({ trafficLight, updatedAt: new Date() })
    .where(eq(tasks.id, taskId));
}

export async function upsertTaskFromImport(data: {
  bmdBookingId: string;
  companyId: string;
  bookingText?: string;
  amount?: string;
  documentDate?: string;
  bookingDate?: string;
  period?: string;
  dueDate?: string;
}) {
  if (!db) throw new Error("Database not configured");

  // Try to find existing task by BMD booking ID
  const existing = await db.query.tasks.findFirst({
    where: eq(tasks.bmdBookingId, data.bmdBookingId),
  });

  if (existing) {
    // Update existing task
    const [updated] = await db.update(tasks)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tasks.id, existing.id))
      .returning();
    return { task: updated, created: false };
  } else {
    // Create new task
    const [created] = await db.insert(tasks).values(data).returning();
    return { task: created, created: true };
  }
}

export async function getCompanyByBmdId(bmdId: string) {
  if (!db) throw new Error("Database not configured");

  return db.query.companies.findFirst({
    where: eq(companies.bmdId, bmdId),
  });
}

// ==================== STATS ====================

export interface TaskStats {
  total: number;
  green: number;
  yellow: number;
  red: number;
  open: number;
  submitted: number;
  completed: number;
}

export async function getTaskStats(
  userId: string,
  userRole: "customer" | "employee",
  userCompanyId: string | null,
  filters: TaskFilters = {}
): Promise<TaskStats> {
  if (!db) throw new Error("Database not configured");

  const conditions = [];

  // Role-based filtering
  if (userRole === "customer" && userCompanyId) {
    conditions.push(eq(tasks.companyId, userCompanyId));
  } else if (filters.companyId) {
    conditions.push(eq(tasks.companyId, filters.companyId));
  }

  // Period filter
  if (filters.period) {
    conditions.push(eq(tasks.period, filters.period));
  }

  const allTasks = await db.query.tasks.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
  });

  const stats: TaskStats = {
    total: allTasks.length,
    green: 0,
    yellow: 0,
    red: 0,
    open: 0,
    submitted: 0,
    completed: 0,
  };

  for (const task of allTasks) {
    // Count by status
    if (task.status === "open") stats.open++;
    else if (task.status === "submitted") stats.submitted++;
    else if (task.status === "completed") stats.completed++;

    // Count by traffic light (excluding completed)
    if (task.status !== "completed") {
      if (task.trafficLight === "green") stats.green++;
      else if (task.trafficLight === "yellow") stats.yellow++;
      else if (task.trafficLight === "red") stats.red++;
    }
  }

  return stats;
}
