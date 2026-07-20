import type { ContractType, ExperienceLevel, FitLabel, JobStatus, LocationType } from "@/types";

export const ALLOWED_JOB_SORT = new Set(["date", "score", "salary", "source"]);

/** User-editable job fields only — never score/fitLabel/source/audit. */
export const ALLOWED_JOB_PATCH_FIELDS = new Set([
  "status",
  "nextActionType",
  "nextActionDate",
  "lastContactedAt",
  "appliedAt",
  "summary",
  "coverSuggestion",
  "checklistJson",
  "tailoredResume",
  "cvVersionUsed",
  "portfolioLinkUsed",
  "rejectionReason",
]);

export const ALLOWED_SETTINGS_FIELDS = new Set([
  "syncFrequency",
  "notificationsEnabled",
  "followUpDays",
  "alertHighFitDays",
  "dailyBriefingEnabled",
  "lastBackupAt",
]);

export const ALLOWED_PROFILE_FIELDS = new Set([
  "name",
  "headline",
  "summary",
  "skills",
  "desiredRoles",
  "desiredSalaryMin",
  "desiredSalaryMax",
  "desiredCurrency",
  "desiredLocationTypes",
  "desiredContractTypes",
  "experienceLevel",
  "languages",
  "negativeKeywords",
  "githubUrl",
  "linkedinUrl",
  "portfolioUrl",
  "resumeUrl",
  "resumeFilename",
  "contactEmail",
  "freelanceMinHourlyRate",
  "freelancePreferredCurrency",
  "freelanceAvailableHoursPerWeek",
  "freelanceOpenToFixedPrice",
  "freelanceMinFixedProjectValue",
  "freelanceExperienceYears",
  "freelancePortfolioUrl",
  "freelanceSpecialization",
  "skillsEvidence",
  "learningBacklog",
]);

/** User-editable freelance project fields — fitScore/breakdown remain computed. */
export const ALLOWED_FREELANCE_PATCH_FIELDS = new Set(["status"]);

const JOB_STATUSES = new Set<string>([
  "new",
  "saved",
  "high_priority",
  "preparing",
  "applied",
  "reviewing",
  "testing",
  "interview",
  "offer",
  "rejected",
  "ignored",
  "archived",
]);

const LOCATION_TYPES = new Set<string>(["remote", "hybrid", "onsite"]);
const CONTRACT_TYPES = new Set<string>([
  "clt",
  "pj",
  "internship",
  "freelancer",
  "temporary",
  "international",
]);
const EXPERIENCE_LEVELS = new Set<string>([
  "internship",
  "trainee",
  "junior",
  "mid",
  "senior",
  "lead",
]);
const FIT_LABELS = new Set<string>(["high", "good", "partial", "low"]);

export function parseCsvParam(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function clampInt(
  value: string | null | undefined,
  fallback: number,
  min: number,
  max: number
): number {
  const n = parseInt(value || "", 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

/** Escape LIKE wildcards so user search cannot broaden unexpectedly. */
export function escapeLike(value: string): string {
  return value.replace(/[%_\\]/g, (ch) => `\\${ch}`);
}

export function sanitizePatch<T extends Record<string, unknown>>(
  body: Record<string, unknown>,
  allowed: Set<string>
): Partial<T> {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    if (allowed.has(key)) sanitized[key] = value;
  }
  return sanitized as Partial<T>;
}

export function asJobStatuses(values: string[]): JobStatus[] {
  return values.filter((v) => JOB_STATUSES.has(v)) as JobStatus[];
}

export function asLocationTypes(values: string[]): LocationType[] {
  return values.filter((v) => LOCATION_TYPES.has(v)) as LocationType[];
}

export function asContractTypes(values: string[]): ContractType[] {
  return values.filter((v) => CONTRACT_TYPES.has(v)) as ContractType[];
}

export function asExperienceLevels(values: string[]): ExperienceLevel[] {
  return values.filter((v) => EXPERIENCE_LEVELS.has(v)) as ExperienceLevel[];
}

export function asFitLabels(values: string[]): FitLabel[] {
  return values.filter((v) => FIT_LABELS.has(v)) as FitLabel[];
}

/** True when the app should refuse destructive/sync mutations (public demo). */
export function isDemoMode(): boolean {
  return process.env.PRISM_DEMO_MODE === "1" || process.env.PRISM_DEMO_MODE === "true";
}

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export function apiError(
  code: string,
  message: string,
  details?: unknown
): ApiErrorBody {
  return {
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
  };
}

export function demoModeBlockedResponse(): ApiErrorBody {
  return apiError(
    "DEMO_READ_ONLY",
    "Demo mode is read-only. Mutations and connector sync are disabled."
  );
}

export function validationError(message: string, details?: unknown): ApiErrorBody {
  return apiError("VALIDATION_ERROR", message, details);
}
