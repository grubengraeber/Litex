import { pgTable, text, timestamp, uuid, pgEnum, boolean, decimal, date, integer, type AnyPgColumn } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const roleEnum = pgEnum("role", ["customer", "employee"]);
export const userStatusEnum = pgEnum("user_status", ["pending", "active", "disabled"]);
export const taskStatusEnum = pgEnum("task_status", ["open", "submitted", "completed"]);
export const trafficLightEnum = pgEnum("traffic_light", ["green", "yellow", "red"]);
export const notificationTypeEnum = pgEnum("notification_type", ["new_comment", "task_assigned", "deadline_warning", "file_uploaded"]);

// Auth.js required tables
export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique().notNull(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  role: roleEnum("role").default("customer"),
  companyId: uuid("company_id").references(() => companies.id),
  status: userStatusEnum("status").default("pending"),
  invitedBy: text("invited_by").references((): AnyPgColumn => users.id),
  invitedAt: timestamp("invited_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
});

export const accounts = pgTable("accounts", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
});

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull().unique(),
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
  bmdBookingId: text("bmd_booking_id").unique(),
  bookingText: text("booking_text"),
  amount: decimal("amount", { precision: 12, scale: 2 }),
  documentDate: date("document_date"),
  bookingDate: date("booking_date"),
  period: text("period"), // YYYY-MM
  status: taskStatusEnum("status").default("open"),
  trafficLight: trafficLightEnum("traffic_light").default("green"),
  dueDate: date("due_date"),
  completedAt: timestamp("completed_at", { mode: "date" }),
  completedBy: text("completed_by").references(() => users.id),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
});

export const files = pgTable("files", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  taskId: uuid("task_id").notNull().references(() => tasks.id),
  uploadedBy: text("uploaded_by").notNull().references(() => users.id),
  fileName: text("file_name").notNull(),
  mimeType: text("mime_type"),
  fileSize: integer("file_size"),
  bucket: text("bucket").default("kommunikation-uploads"),
  storageKey: text("storage_key").notNull(),
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

// Comment Read Status - tracks who has read which comment
export const commentReadStatus = pgTable("comment_read_status", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  commentId: uuid("comment_id").notNull().references(() => comments.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  readAt: timestamp("read_at", { mode: "date" }).defaultNow(),
});

// Notifications
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: notificationTypeEnum("type").notNull(),
  title: text("title").notNull(),
  body: text("body"),
  taskId: uuid("task_id").references(() => tasks.id, { onDelete: "cascade" }),
  commentId: uuid("comment_id").references(() => comments.id, { onDelete: "cascade" }),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  company: one(companies, { fields: [users.companyId], references: [companies.id] }),
  comments: many(comments),
  files: many(files),
  notifications: many(notifications),
  commentReadStatuses: many(commentReadStatus),
}));

export const companiesRelations = relations(companies, ({ many }) => ({
  users: many(users),
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  company: one(companies, { fields: [tasks.companyId], references: [companies.id] }),
  files: many(files),
  comments: many(comments),
  notifications: many(notifications),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  task: one(tasks, { fields: [comments.taskId], references: [tasks.id] }),
  user: one(users, { fields: [comments.userId], references: [users.id] }),
  readStatuses: many(commentReadStatus),
  notifications: many(notifications),
}));

export const filesRelations = relations(files, ({ one }) => ({
  task: one(tasks, { fields: [files.taskId], references: [tasks.id] }),
  user: one(users, { fields: [files.uploadedBy], references: [users.id] }),
}));

export const commentReadStatusRelations = relations(commentReadStatus, ({ one }) => ({
  comment: one(comments, { fields: [commentReadStatus.commentId], references: [comments.id] }),
  user: one(users, { fields: [commentReadStatus.userId], references: [users.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
  task: one(tasks, { fields: [notifications.taskId], references: [tasks.id] }),
  comment: one(comments, { fields: [notifications.commentId], references: [comments.id] }),
}));
