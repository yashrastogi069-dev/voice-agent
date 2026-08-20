import {
  boolean,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const studentContacts = mysqlTable("studentContacts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  fullName: varchar("fullName", { length: 160 }).notNull(),
  phoneNumber: varchar("phoneNumber", { length: 32 }).notNull(),
  language: mysqlEnum("language", ["English", "Hindi"]).notNull(),
  timezone: varchar("timezone", { length: 64 }).default("Asia/Kolkata").notNull(),
  consentStatus: mysqlEnum("consentStatus", ["opt_in", "unknown", "opted_out"])
    .default("unknown")
    .notNull(),
  consentSource: varchar("consentSource", { length: 180 }),
  consentScope: varchar("consentScope", { length: 180 }),
  consentAt: timestamp("consentAt"),
  dnc: boolean("dnc").default(false).notNull(),
  isSynthetic: boolean("isSynthetic").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const campaigns = mysqlTable("campaigns", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 180 }).notNull(),
  status: mysqlEnum("status", ["draft", "approved", "paused"])
    .default("draft")
    .notNull(),
  approvedScript: text("approvedScript").notNull(),
  knowledgeBase: text("knowledgeBase").notNull(),
  callingStartHour: int("callingStartHour").default(9).notNull(),
  callingEndHour: int("callingEndHour").default(21).notNull(),
  frequencyCap: int("frequencyCap").default(2).notNull(),
  approvedAt: timestamp("approvedAt"),
  isSynthetic: boolean("isSynthetic").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const workflowPolicies = mysqlTable("workflowPolicies", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  workflow: mysqlEnum("workflow", ["outbound", "inbound", "delegated"]).notNull(),
  policyJson: text("policyJson").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const callRecords = mysqlTable("callRecords", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  campaignId: int("campaignId").notNull(),
  contactId: int("contactId").notNull(),
  outcome: mysqlEnum("outcome", ["interested", "callback", "not_interested", "dnc"])
    .notNull(),
  transcript: text("transcript").notNull(),
  summary: text("summary").notNull(),
  priority: boolean("priority").default(false).notNull(),
  isSynthetic: boolean("isSynthetic").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const callbackRequests = mysqlTable("callbackRequests", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  campaignId: int("campaignId").notNull(),
  contactId: int("contactId").notNull(),
  note: text("note").notNull(),
  status: mysqlEnum("status", ["queued", "completed"]).default("queued").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const policyAudits = mysqlTable("policyAudits", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  workflow: mysqlEnum("workflow", ["outbound", "inbound", "delegated"]).notNull(),
  eventType: varchar("eventType", { length: 80 }).notNull(),
  allowed: boolean("allowed").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type StudentContact = typeof studentContacts.$inferSelect;
export type Campaign = typeof campaigns.$inferSelect;
export type CallRecord = typeof callRecords.$inferSelect;
