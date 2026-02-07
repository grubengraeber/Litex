import { pgTable, text, timestamp, uuid, pgEnum, boolean, decimal, date, integer, type AnyPgColumn } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const roleEnum = pgEnum("role", ["admin", "employee", "customer"]);
export const userStatusEnum = pgEnum("user_status", ["pending", "active", "disabled"]);
export const taskStatusEnum = pgEnum("task_status", ["open", "submitted", "completed"]);
export const trafficLightEnum = pgEnum("traffic_light", ["green", "yellow", "red"]);
export const taskTypeEnum = pgEnum("task_type", ["general", "booking"]);
export const notificationTypeEnum = pgEnum("notification_type", [
  "new_message",
  "task_submitted",
  "task_completed",
  "task_returned",
  "file_uploaded",
  "file_approved",
  "file_rejected"
]);
export const fileStatusEnum = pgEnum("file_status", ["pending", "approved", "rejected"]);
export const auditActionEnum = pgEnum("audit_action", [
  // Auth
  "LOGIN", "LOGOUT", "LOGIN_FAILED",
  // CRUD
  "CREATE", "READ", "UPDATE", "DELETE",
  // Special actions
  "APPROVE", "REJECT", "SUBMIT", "ASSIGN", "UNASSIGN", "DOWNLOAD", "UPLOAD", "EXPORT",
  // Permissions
  "GRANT_PERMISSION", "REVOKE_PERMISSION", "ASSIGN_ROLE", "REMOVE_ROLE"
]);
export const auditStatusEnum = pgEnum("audit_status", ["success", "failed", "error"]);

// Auth.js required tables
export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique().notNull(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  role: roleEnum("role").default("customer"),
  companyId: uuid("company_id").references(() => companies.id),
  finmaticsUserId: text("finmatics_user_id"),
  bmdUserId: text("bmd_user_id"),
  status: userStatusEnum("status").default("pending"),
  invitedBy: text("invited_by").references((): AnyPgColumn => users.id),
  invitedAt: timestamp("invited_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
});

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

// Custom auth codes for 6-digit codes
export const authCodes = pgTable("auth_codes", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull(),
  code: text("code").notNull(),
  attempts: integer("attempts").default(0),
  expires: timestamp("expires", { mode: "date" }).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

// Permissions - Granular permission definitions
export const permissions = pgTable("permissions", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull().unique(),
  description: text("description"),
  category: text("category").notNull(), // e.g., "tasks", "users", "files", "navigation"
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

// Roles - Role definitions
export const roles = pgTable("roles", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull().unique(),
  description: text("description"),
  isSystem: boolean("is_system").default(false), // System roles can't be deleted/renamed
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
});

// Role Permissions - Junction table
export const rolePermissions = pgTable("role_permissions", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  roleId: uuid("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
  permissionId: uuid("permission_id").notNull().references(() => permissions.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

// User Roles - Assigns roles to users
export const userRoles = pgTable("user_roles", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  roleId: uuid("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
  assignedBy: text("assigned_by").references(() => users.id),
  assignedAt: timestamp("assigned_at", { mode: "date" }).defaultNow(),
});

// Teams - organizational units for employees
export const teams = pgTable("teams", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  leaderId: text("leader_id").references((): AnyPgColumn => users.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
});

// Team Members - junction table for users and teams
export const teamMembers = pgTable("team_members", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  teamId: uuid("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  joinedAt: timestamp("joined_at", { mode: "date" }).defaultNow(),
});

// Business tables
export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  bmdId: text("bmd_id").unique(),
  finmaticsId: text("finmatics_id"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  taskType: taskTypeEnum("task_type").default("general"),
  bmdBookingId: text("bmd_booking_id").unique(),
  bookingText: text("booking_text"),
  amount: decimal("amount", { precision: 12, scale: 2 }),
  documentDate: date("document_date"),
  bookingDate: date("booking_date"),
  period: text("period"), // YYYY-MM
  status: taskStatusEnum("status").default("open"),
  trafficLight: trafficLightEnum("traffic_light").default("yellow"),
  dueDate: date("due_date"),
  completedAt: timestamp("completed_at", { mode: "date" }),
  completedBy: text("completed_by").references(() => users.id),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
});

export const files = pgTable("files", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  commentId: uuid("comment_id").references(() => comments.id, { onDelete: "cascade" }),
  taskId: uuid("task_id").references(() => tasks.id), // Keep for backward compatibility and orphaned files
  uploadedBy: text("uploaded_by").notNull().references(() => users.id),
  fileName: text("file_name").notNull(),
  mimeType: text("mime_type"),
  fileSize: integer("file_size"),
  bucket: text("bucket").default("kommunikation-uploads"),
  storageKey: text("storage_key").notNull(),
  status: fileStatusEnum("status").default("pending"),
  approvedBy: text("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at", { mode: "date" }),
  rejectedBy: text("rejected_by").references(() => users.id),
  rejectedAt: timestamp("rejected_at", { mode: "date" }),
  rejectionReason: text("rejection_reason"),
  sentToFinmatics: boolean("sent_to_finmatics").default(false),
  finmaticsDocId: text("finmatics_doc_id"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

export const comments = pgTable("comments", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  taskId: uuid("task_id").notNull().references(() => tasks.id),
  userId: text("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

// Sync Jobs - Track import/sync operations
export const syncJobs = pgTable("sync_jobs", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  source: text("source").notNull(), // "csv_import", "finmatics", "bmd"
  status: text("status").notNull().default("running"), // "running", "completed", "failed"
  recordsProcessed: integer("records_processed").default(0),
  recordsCreated: integer("records_created").default(0),
  recordsUpdated: integer("records_updated").default(0),
  recordsFailed: integer("records_failed").default(0),
  errorLog: text("error_log"), // JSON array of error messages
  startedAt: timestamp("started_at", { mode: "date" }).defaultNow(),
  completedAt: timestamp("completed_at", { mode: "date" }),
  triggeredBy: text("triggered_by").references(() => users.id),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  company: one(companies, { fields: [users.companyId], references: [companies.id] }),
  comments: many(comments),
  files: many(files),
  userRoles: many(userRoles, { relationName: "userRoles" }),
  assignedRoles: many(userRoles, { relationName: "assignedRoles" }),
  teamMemberships: many(teamMembers),
  ledTeams: many(teams),
}));

export const companiesRelations = relations(companies, ({ many }) => ({
  users: many(users),
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  company: one(companies, { fields: [tasks.companyId], references: [companies.id] }),
  files: many(files),
  comments: many(comments),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  task: one(tasks, { fields: [comments.taskId], references: [tasks.id] }),
  user: one(users, { fields: [comments.userId], references: [users.id] }),
  reads: many(commentReads),
  files: many(files), // A comment can have multiple file attachments
}));

export const filesRelations = relations(files, ({ one }) => ({
  comment: one(comments, { fields: [files.commentId], references: [comments.id] }),
  task: one(tasks, { fields: [files.taskId], references: [tasks.id] }),
  user: one(users, { fields: [files.uploadedBy], references: [users.id] }),
}));

// Comment Read Receipts - like WhatsApp ✓✓
export const commentReads = pgTable("comment_reads", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  commentId: uuid("comment_id").notNull().references(() => comments.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id),
  readAt: timestamp("read_at", { mode: "date" }).defaultNow(),
});

// Notifications - Bell icon with unread count
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: notificationTypeEnum("type").notNull(),
  title: text("title").notNull(),
  message: text("message"),
  taskId: uuid("task_id").references(() => tasks.id, { onDelete: "cascade" }),
  commentId: uuid("comment_id").references(() => comments.id, { onDelete: "cascade" }),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

// Audit Logs - Track all significant actions across the system
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),

  // What happened
  action: auditActionEnum("action").notNull(),
  entityType: text("entity_type").notNull(), // user, task, file, company, role, etc.
  entityId: text("entity_id"), // ID of the affected entity

  // Who did it
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  userEmail: text("user_email").notNull(), // Store email for record keeping
  userIpAddress: text("user_ip_address"), // IPv4/IPv6
  userAgent: text("user_agent"), // Browser/client info

  // When
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),

  // Context
  changes: text("changes"), // JSON string of before/after values for updates
  metadata: text("metadata"), // JSON string for additional context

  // Status
  status: auditStatusEnum("status").default("success"),
  errorMessage: text("error_message"),
});

// Comment Read Relations
export const commentReadsRelations = relations(commentReads, ({ one }) => ({
  comment: one(comments, { fields: [commentReads.commentId], references: [comments.id] }),
  user: one(users, { fields: [commentReads.userId], references: [users.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
  task: one(tasks, { fields: [notifications.taskId], references: [tasks.id] }),
  sourceComment: one(comments, { fields: [notifications.commentId], references: [comments.id] }),
}));

// RBAC Relations
export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  rolePermissions: many(rolePermissions),
  userRoles: many(userRoles),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, { fields: [rolePermissions.roleId], references: [roles.id] }),
  permission: one(permissions, { fields: [rolePermissions.permissionId], references: [permissions.id] }),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
    relationName: "userRoles"
  }),
  role: one(roles, { fields: [userRoles.roleId], references: [roles.id] }),
  assignedByUser: one(users, {
    fields: [userRoles.assignedBy],
    references: [users.id],
    relationName: "assignedRoles"
  }),
}));

// Team Relations
export const teamsRelations = relations(teams, ({ one, many }) => ({
  leader: one(users, { fields: [teams.leaderId], references: [users.id] }),
  members: many(teamMembers),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  user: one(users, { fields: [teamMembers.userId], references: [users.id] }),
  team: one(teams, { fields: [teamMembers.teamId], references: [teams.id] }),
}));

// Audit Logs Relations
export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, { fields: [auditLogs.userId], references: [users.id] }),
}));

// Sync Jobs Relations
export const syncJobsRelations = relations(syncJobs, ({ one }) => ({
  triggeredByUser: one(users, { fields: [syncJobs.triggeredBy], references: [users.id] }),
}));
