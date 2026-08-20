import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  callbackRequests,
  callRecords,
  campaigns,
  InsertUser,
  policyAudits,
  studentContacts,
  users,
  workflowPolicies,
} from "../drizzle/schema";
import { DEMO_APPROVED_SCRIPT, DEMO_COLLEGE_KNOWLEDGE, DEMO_WORKFLOW_POLICIES } from "./demoContent";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Database is not available.");
  return db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await requireDb();
  const values: InsertUser = { openId: user.openId, lastSignedIn: user.lastSignedIn ?? new Date() };
  const updateSet: Record<string, unknown> = { lastSignedIn: values.lastSignedIn };
  for (const field of ["name", "email", "loginMethod"] as const) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  values.role = user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user");
  updateSet.role = values.role;
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getWorkspace(userId: number) {
  const db = await requireDb();
  const [contacts, userCampaigns, records, policies, callbacks] = await Promise.all([
    db.select().from(studentContacts).where(eq(studentContacts.userId, userId)).orderBy(desc(studentContacts.createdAt)),
    db.select().from(campaigns).where(eq(campaigns.userId, userId)).orderBy(desc(campaigns.createdAt)),
    db.select().from(callRecords).where(eq(callRecords.userId, userId)).orderBy(desc(callRecords.createdAt)),
    db.select().from(workflowPolicies).where(eq(workflowPolicies.userId, userId)),
    db.select().from(callbackRequests).where(eq(callbackRequests.userId, userId)).orderBy(desc(callbackRequests.createdAt)),
  ]);
  return { contacts, campaigns: userCampaigns, records, policies, callbacks };
}

export async function seedSyntheticDemoWorkspace(userId: number) {
  const db = await requireDb();
  const existing = await db.select().from(campaigns).where(and(eq(campaigns.userId, userId), eq(campaigns.isSynthetic, true))).limit(1);
  if (existing.length > 0) return getWorkspace(userId);

  await db.insert(campaigns).values({
    userId,
    name: "Autumn admissions information — DEMO",
    status: "draft",
    approvedScript: DEMO_APPROVED_SCRIPT,
    knowledgeBase: JSON.stringify(DEMO_COLLEGE_KNOWLEDGE),
    callingStartHour: 9,
    callingEndHour: 21,
    frequencyCap: 2,
    isSynthetic: true,
  });

  await db.insert(studentContacts).values([
    { userId, fullName: "Aarav Test", phoneNumber: "+91 00000 00001", language: "English", timezone: "Asia/Kolkata", consentStatus: "opt_in", consentSource: "Synthetic demo opt-in", consentScope: "College information demo", consentAt: new Date(), dnc: false, isSynthetic: true },
    { userId, fullName: "Meera Sample", phoneNumber: "+91 00000 00002", language: "Hindi", timezone: "Asia/Kolkata", consentStatus: "opt_in", consentSource: "Synthetic demo opt-in", consentScope: "College information demo", consentAt: new Date(), dnc: false, isSynthetic: true },
    { userId, fullName: "Riya Demo", phoneNumber: "+91 00000 00003", language: "English", timezone: "Asia/Kolkata", consentStatus: "opted_out", consentSource: "Synthetic demo opt-out", consentScope: "None", consentAt: new Date(), dnc: true, isSynthetic: true },
  ]);

  await db.insert(workflowPolicies).values(
    Object.entries(DEMO_WORKFLOW_POLICIES).map(([workflow, policy]) => ({
      userId,
      workflow: workflow as "outbound" | "inbound" | "delegated",
      policyJson: JSON.stringify(policy),
    }))
  );
  return getWorkspace(userId);
}

export async function addContact(input: {
  userId: number;
  fullName: string;
  phoneNumber: string;
  language: "English" | "Hindi";
  consentSource: string;
  consentScope: string;
}) {
  const db = await requireDb();
  await db.insert(studentContacts).values({
    ...input,
    timezone: "Asia/Kolkata",
    consentStatus: "opt_in",
    consentAt: new Date(),
    dnc: false,
    isSynthetic: false,
  });
}

export async function addContactsBulk(input: Array<{
  userId: number;
  fullName: string;
  phoneNumber: string;
  language: "English" | "Hindi";
  consentSource: string;
  consentScope: string;
}>) {
  const db = await requireDb();
  if (input.length === 0) return;
  await db.insert(studentContacts).values(input.map(contact => ({
    ...contact,
    timezone: "Asia/Kolkata",
    consentStatus: "opt_in" as const,
    consentAt: new Date(),
    dnc: false,
    isSynthetic: false,
  })));
}

export async function createCampaign(input: {
  userId: number;
  name: string;
  approvedScript: string;
  knowledgeBase: string;
  frequencyCap: number;
}) {
  const db = await requireDb();
  await db.insert(campaigns).values({
    ...input,
    status: "draft",
    callingStartHour: 9,
    callingEndHour: 21,
    isSynthetic: false,
  });
}

export async function approveCampaign(userId: number, campaignId: number) {
  const db = await requireDb();
  await db.update(campaigns).set({ status: "approved", approvedAt: new Date() }).where(and(eq(campaigns.id, campaignId), eq(campaigns.userId, userId)));
}

export async function getSimulationContext(userId: number, campaignId: number, contactId: number) {
  const db = await requireDb();
  const [campaign] = await db.select().from(campaigns).where(and(eq(campaigns.id, campaignId), eq(campaigns.userId, userId))).limit(1);
  const [contact] = await db.select().from(studentContacts).where(and(eq(studentContacts.id, contactId), eq(studentContacts.userId, userId))).limit(1);
  if (!campaign || !contact) throw new Error("Campaign or contact was not found.");
  const prior = await db.select().from(callRecords).where(and(eq(callRecords.campaignId, campaignId), eq(callRecords.contactId, contactId), eq(callRecords.userId, userId)));
  return { campaign, contact, priorAttempts: prior.length };
}

export async function recordPolicyAudit(input: {
  userId: number;
  workflow: "outbound" | "inbound" | "delegated";
  eventType: string;
  allowed: boolean;
  message: string;
}) {
  const db = await requireDb();
  await db.insert(policyAudits).values(input);
}

export async function saveSimulation(input: {
  userId: number;
  campaignId: number;
  contactId: number;
  outcome: "interested" | "callback" | "not_interested" | "dnc";
  transcript: string;
  summary: string;
}) {
  const db = await requireDb();
  const priority = input.outcome === "callback" || input.outcome === "dnc";
  await db.insert(callRecords).values({ ...input, priority, isSynthetic: true });
  if (input.outcome === "dnc") {
    await db.update(studentContacts).set({ dnc: true, consentStatus: "opted_out" }).where(and(eq(studentContacts.id, input.contactId), eq(studentContacts.userId, input.userId)));
  }
  if (input.outcome === "callback") {
    await db.insert(callbackRequests).values({
      userId: input.userId,
      campaignId: input.campaignId,
      contactId: input.contactId,
      note: input.summary,
      status: "queued",
    });
  }
}
