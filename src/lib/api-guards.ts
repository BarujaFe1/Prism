import type { ContractType, ExperienceLevel, FitLabel, JobStatus, LocationType } from "@/types";

export const ALLOWED_JOB_SORT = new Set(["date", "score", "salary", "source"]);

export const ALLOWED_JOB_PATCH_FIELDS = new Set([
  "status",
  "nextActionType",
  "nextActionDate",
  "lastContactedAt",
  "summary",
  "coverSuggestion",
  "fitLabel",
  "score",
]);

export const ALLOWED_SETTINGS_FIELDS = new Set([
  "syncFrequency",
  "notificationsEnabled",
  "followUpDays",
  "alertHighFitDays",
  "dailyBriefingEnabled",
  "lastBackupAt",
]);

export function parseCsvParam(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function clampInt(value: string | null | undefined, fallback: number, min: number, max: number): number {
  const n = parseInt(value || "", 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(Math.max(n, min), max);
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
  return values as JobStatus[];
}

export function asLocationTypes(values: string[]): LocationType[] {
  return values as LocationType[];
}

export function asContractTypes(values: string[]): ContractType[] {
  return values as ContractType[];
}

export function asExperienceLevels(values: string[]): ExperienceLevel[] {
  return values as ExperienceLevel[];
}

export function asFitLabels(values: string[]): FitLabel[] {
  return values as FitLabel[];
}

/** True when the app should refuse destructive/sync mutations (public demo). */
export function isDemoMode(): boolean {
  return process.env.PRISM_DEMO_MODE === "1" || process.env.PRISM_DEMO_MODE === "true";
}

export function demoModeBlockedResponse() {
  return {
    error: "Demo mode is read-only. Mutations and connector sync are disabled.",
    code: "DEMO_READ_ONLY",
  };
}
