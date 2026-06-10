import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const jobs = sqliteTable("jobs", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  company: text("company").notNull(),
  description: text("description"),
  descriptionClean: text("description_clean"),
  hash: text("hash"),
  location: text("location"),
  locationType: text("location_type", {
    enum: ["remote", "hybrid", "onsite"],
  }),
  salaryMin: integer("salary_min"),
  salaryMax: integer("salary_max"),
  currency: text("currency"),
  salaryPeriod: text("salary_period", {
    enum: ["yearly", "monthly", "weekly", "hourly", "contract"],
  }),
  contractType: text("contract_type", {
    enum: ["clt", "pj", "internship", "freelancer", "temporary", "international"],
  }),
  experienceLevel: text("experience_level", {
    enum: ["internship", "trainee", "junior", "mid", "senior", "lead"],
  }),
  technologies: text("technologies", { mode: "json" }).$type<string[]>(),
  tags: text("tags", { mode: "json" }).$type<string[]>(),
  source: text("source").notNull(),
  sourceId: text("source_id"),
  url: text("url"),
  companyUrl: text("company_url"),
  companyLogoUrl: text("company_logo_url"),
  postedAt: text("posted_at"),
  fetchedAt: text("fetched_at")
    .notNull()
    .default(sql`(current_timestamp)`),
  isNormalized: integer("is_normalized", { mode: "boolean" }).default(false),
  isInternational: integer("is_international", { mode: "boolean" }).default(false),
  city: text("city"),
  country: text("country"),
  countryCode: text("country_code"),
  detectedLanguage: text("detected_language").default("pt"),
  translatedDescription: text("translated_description"),
  score: real("score"),
  scoreDetails: text("score_details", { mode: "json" }),
  summary: text("summary"),
  gaps: text("gaps", { mode: "json" }).$type<string[]>(),
  keyRequirements: text("key_requirements", { mode: "json" }).$type<string[]>(),
  fitLabel: text("fit_label", { enum: ["high", "good", "partial", "low"] }),
  coverSuggestion: text("cover_suggestion"),
  rawData: text("raw_data", { mode: "json" }),
  status: text("status", {
    enum: ["new", "saved", "high_priority", "preparing", "applied", "reviewing", "interview", "offer", "rejected", "ignored", "archived"],
  })
    .notNull()
    .default("new"),
  nextActionType: text("next_action_type"),
  nextActionDate: text("next_action_date"),
  lastContactedAt: text("last_contacted_at"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const jobEvents = sqliteTable("job_events", {
  id: text("id").primaryKey(),
  jobId: text("job_id")
    .notNull()
    .references(() => jobs.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(),
  description: text("description"),
  metadata: text("metadata", { mode: "json" }),
  occurredAt: text("occurred_at").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const jobFollowups = sqliteTable("job_followups", {
  id: text("id").primaryKey(),
  jobId: text("job_id")
    .notNull()
    .references(() => jobs.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  note: text("note"),
  dueAt: text("due_at").notNull(),
  done: integer("done", { mode: "boolean" }).default(false),
  doneAt: text("done_at"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const savedSearches = sqliteTable("saved_searches", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  filters: text("filters", { mode: "json" }).notNull(),
  notifyInApp: integer("notify_in_app", { mode: "boolean" }).default(true),
  lastRunAt: text("last_run_at"),
  lastNewCount: integer("last_new_count"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const sources = sqliteTable("sources", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  enabled: integer("enabled", { mode: "boolean" }).default(true),
  config: text("config", { mode: "json" }),
  lastSyncAt: text("last_sync_at"),
  lastError: text("last_error"),
  lastJobCount: integer("last_job_count"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const connectorLogs = sqliteTable("connector_logs", {
  id: text("id").primaryKey(),
  connectorName: text("connector_name").notNull(),
  runAt: text("run_at").notNull(),
  jobsFetched: integer("jobs_fetched").default(0),
  jobsNew: integer("jobs_new").default(0),
  jobsDuplicate: integer("jobs_duplicate").default(0),
  errorMessage: text("error_message"),
  durationMs: integer("duration_ms"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const profile = sqliteTable("profile", {
  id: text("id").primaryKey().default("default"),
  name: text("name"),
  headline: text("headline"),
  summary: text("summary"),
  skills: text("skills", { mode: "json" }).$type<string[]>(),
  desiredRoles: text("desired_roles", { mode: "json" }).$type<string[]>(),
  desiredSalaryMin: integer("desired_salary_min"),
  desiredSalaryMax: integer("desired_salary_max"),
  desiredCurrency: text("desired_currency").default("BRL"),
  desiredLocationTypes: text("desired_location_types", { mode: "json" }).$type<string[]>(),
  desiredContractTypes: text("desired_contract_types", { mode: "json" }).$type<string[]>(),
  experienceLevel: text("experience_level"),
  languages: text("languages", { mode: "json" }).$type<string[]>(),
  negativeKeywords: text("negative_keywords", { mode: "json" }).$type<string[]>(),
  githubUrl: text("github_url"),
  linkedinUrl: text("linkedin_url"),
  portfolioUrl: text("portfolio_url"),
  resumeUrl: text("resume_url"),
  resumeFilename: text("resume_filename"),
  contactEmail: text("contact_email"),

  freelanceMinHourlyRate: real("freelance_min_hourly_rate"),
  freelancePreferredCurrency: text("freelance_preferred_currency").default("USD"),
  freelanceAvailableHoursPerWeek: integer("freelance_available_hours_per_week"),
  freelanceOpenToFixedPrice: integer("freelance_open_to_fixed_price", { mode: "boolean" }).default(true),
  freelanceMinFixedProjectValue: real("freelance_min_fixed_project_value"),
  freelanceExperienceYears: integer("freelance_experience_years"),
  freelancePortfolioUrl: text("freelance_portfolio_url"),
  freelanceSpecialization: text("freelance_specialization"),

  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});


export const monitoredCompanies = sqliteTable("monitored_companies", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  normalizedName: text("normalized_name").notNull(),
  sector: text("sector"),
  priority: text("priority"),
  countryFocus: text("country_focus"),
  targetRoles: text("target_roles"),
  whyMonitor: text("why_monitor"),
  searchQueryPt: text("search_query_pt"),
  searchQueryEn: text("search_query_en"),
  atsHint: text("ats_hint"),
  careerUrl: text("career_url"),
  detectedAts: text("detected_ats"),
  status: text("status")
    .notNull()
    .default("never_synced"),
  lastSyncAttemptAt: text("last_sync_attempt_at"),
  lastSuccessfulSyncAt: text("last_successful_sync_at"),
  lastError: text("last_error"),
  totalJobsFound: integer("total_jobs_found").default(0),
  totalRelevantJobs: integer("total_relevant_jobs").default(0),
  totalSavedJobs: integer("total_saved_jobs").default(0),
  totalAppliedJobs: integer("total_applied_jobs").default(0),
  usefulnessRate: real("usefulness_rate").default(0.0),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(current_timestamp)`),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  notes: text("notes"),
});

export const jobSources = sqliteTable("job_sources", {
  id: text("id").primaryKey(),
  jobId: text("job_id")
    .notNull()
    .references(() => jobs.id, { onDelete: "cascade" }),
  sourceName: text("source_name").notNull(),
  sourceType: text("source_type").notNull(),
  originalUrl: text("original_url"),
  applyUrl: text("apply_url").notNull(),
  firstSeenAt: text("first_seen_at")
    .notNull()
    .default(sql`(current_timestamp)`),
  lastSeenAt: text("last_seen_at")
    .notNull()
    .default(sql`(current_timestamp)`),
  confidence: real("confidence").default(1.0),
  isPreferredApplySource: integer("is_preferred_apply_source", { mode: "boolean" }).default(false),
});

export const settings = sqliteTable("settings", {
  id: text("id").primaryKey().default("default"),
  syncFrequency: text("sync_frequency").default("6"),
  notificationsEnabled: integer("notifications_enabled", { mode: "boolean" }).default(true),
  followUpDays: integer("follow_up_days").default(5),
  alertHighFitDays: integer("alert_high_fit_days").default(2),
  dailyBriefingEnabled: integer("daily_briefing_enabled", { mode: "boolean" }).default(true),
  lastBackupAt: text("last_backup_at"),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const applicationTasks = sqliteTable("application_tasks", {
  id: text("id").primaryKey(),
  jobId: text("job_id")
    .notNull()
    .references(() => jobs.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  label: text("label").notNull(),
  isDone: integer("is_done", { mode: "boolean" }).default(false),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
  completedAt: text("completed_at"),
});

export * from "./schema/freelance";
