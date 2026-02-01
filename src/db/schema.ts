import { pgTable, text, timestamp, uuid, pgEnum, boolean, decimal, date, integer, type AnyPgColumn } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const roleEnum = pgEnum("role", ["customer", "employee"]);
export const userStatusEnum = pgEnum("user_status", ["pending", "active", "disabled"]);
export const taskStatusEnum = pgEnum("task_status", ["open", "submitted", "completed"]);
export const trafficLightEnum = pgEnum("traffic_light", ["green", "yellow", "red"]);

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

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  company: one(companies, { fields: [users.companyId], references: [companies.id] }),
  comments: many(comments),
  files: many(files),
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

export const commentsRelations = relations(comments, ({ one }) => ({
  task: one(tasks, { fields: [comments.taskId], references: [tasks.id] }),
  user: one(users, { fields: [comments.userId], references: [users.id] }),
}));

export const filesRelations = relations(files, ({ one }) => ({
  task: one(tasks, { fields: [files.taskId], references: [tasks.id] }),
  user: one(users, { fields: [files.uploadedBy], references: [users.id] }),
}));

// Chat Messages - "Next Level" with read receipts
export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  taskId: uuid("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  senderId: text("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

// Message Read Receipts - like WhatsApp ✓✓
export const messageReads = pgTable("message_reads", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  messageId: uuid("message_id").notNull().references(() => messages.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id),
  readAt: timestamp("read_at", { mode: "date" }).defaultNow(),
});

// Notification Types
export const notificationTypeEnum = pgEnum("notification_type", [
  "new_message", 
  "task_submitted", 
  "task_completed", 
  "task_returned",
  "file_uploaded",
  "file_approved",
  "file_rejected"
]);

// Notifications - Bell icon with unread count
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: notificationTypeEnum("type").notNull(),
  title: text("title").notNull(),
  message: text("message"),
  taskId: uuid("task_id").references(() => tasks.id, { onDelete: "cascade" }),
  messageId: uuid("message_id").references(() => messages.id, { onDelete: "cascade" }),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

// Message Relations
export const messagesRelations = relations(messages, ({ one, many }) => ({
  task: one(tasks, { fields: [messages.taskId], references: [tasks.id] }),
  sender: one(users, { fields: [messages.senderId], references: [users.id] }),
  reads: many(messageReads),
}));

export const messageReadsRelations = relations(messageReads, ({ one }) => ({
  message: one(messages, { fields: [messageReads.messageId], references: [messages.id] }),
  user: one(users, { fields: [messageReads.userId], references: [users.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
  task: one(tasks, { fields: [notifications.taskId], references: [tasks.id] }),
  sourceMessage: one(messages, { fields: [notifications.messageId], references: [messages.id] }),
}));
