import { sqliteTable, text, real, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const freelanceProjects = sqliteTable("freelance_projects", {
  id: text("id").primaryKey(),
  externalId: text("external_id"),
  sourceId: text("source_id").notNull(),

  title: text("title").notNull(),
  clientName: text("client_name"),
  clientUrl: text("client_url"),
  clientCountry: text("client_country"),
  clientRating: real("client_rating"),
  clientTotalSpent: real("client_total_spent"),
  clientHireRate: real("client_hire_rate"),
  clientTotalHires: integer("client_total_hires"),

  description: text("description"),
  url: text("url").notNull(),
  platform: text("platform").notNull(),
  projectType: text("project_type"),
  duration: text("duration"),
  engagementType: text("engagement_type"),
  experienceLevel: text("experience_level"),

  budgetMin: real("budget_min"),
  budgetMax: real("budget_max"),
  budgetCurrency: text("budget_currency").default("USD"),
  budgetType: text("budget_type"),
  hourlyRateMin: real("hourly_rate_min"),
  hourlyRateMax: real("hourly_rate_max"),

  skills: text("skills"),
  category: text("category"),
  subcategory: text("subcategory"),

  proposalsCount: integer("proposals_count"),
  proposalsBracket: text("proposals_bracket"),
  interviewsCount: integer("interviews_count"),

  fitScore: real("fit_score"),
  fitBreakdown: text("fit_breakdown"),
  redFlags: text("red_flags"),
  opportunities: text("opportunities"),
  status: text("status").default("new"),

  postedAt: text("posted_at"),
  expiresAt: text("expires_at"),
  collectedAt: text("collected_at").notNull().default(sql`(current_timestamp)`),
  updatedAt: text("updated_at").default(sql`(current_timestamp)`),

  contentHash: text("content_hash"),
});

export const freelanceProposals = sqliteTable("freelance_proposals", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => freelanceProjects.id, { onDelete: "cascade" }),

  coverLetter: text("cover_letter"),
  proposedRate: real("proposed_rate"),
  proposedRateType: text("proposed_rate_type"),
  proposedDuration: text("proposed_duration"),
  attachments: text("attachments"),

  outcome: text("outcome"),
  clientFeedback: text("client_feedback"),
  finalRate: real("final_rate"),
  contractValue: real("contract_value"),

  proposedAt: text("proposed_at"),
  respondedAt: text("responded_at"),
  contractedAt: text("contracted_at"),

  notes: text("notes"),
});

export const freelanceSources = sqliteTable("freelance_sources", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  platform: text("platform").notNull(),
  config: text("config"),
  enabled: integer("enabled", { mode: "boolean" }).default(true),
  lastSyncAt: text("last_sync_at"),
  totalCollected: integer("total_collected").default(0),
  status: text("status").default("active"),
  errorMessage: text("error_message"),
  avgProjectsPerSync: real("avg_projects_per_sync"),
});

export const freelanceClientWatchlist = sqliteTable("freelance_client_watchlist", {
  id: text("id").primaryKey(),
  clientName: text("client_name").notNull(),
  platform: text("platform").notNull(),
  clientUrl: text("client_url"),
  reason: text("reason"),
  alertOnNewProject: integer("alert_on_new_project", { mode: "boolean" }).default(true),
  createdAt: text("created_at").default(sql`(current_timestamp)`),
});

export const freelanceRateHistory = sqliteTable("freelance_rate_history", {
  id: text("id").primaryKey(),
  category: text("category").notNull(),
  skill: text("skill"),
  platform: text("platform"),
  p25Rate: real("p25_rate"),
  p50Rate: real("p50_rate"),
  p75Rate: real("p75_rate"),
  sampleSize: integer("sample_size"),
  recordedAt: text("recorded_at").default(sql`(current_timestamp)`),
});
