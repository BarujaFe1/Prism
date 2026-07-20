import { NextResponse } from "next/server";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { SettingsData } from "@/types";
import {
  ALLOWED_SETTINGS_FIELDS,
  apiError,
  demoModeBlockedResponse,
  isDemoMode,
  sanitizePatch,
  validationError,
} from "@/lib/api-guards";

const DEFAULTS: SettingsData = {
  syncFrequency: "6",
  notificationsEnabled: true,
  followUpDays: 5,
  alertHighFitDays: 2,
  dailyBriefingEnabled: true,
  lastBackupAt: null,
};

export async function GET() {
  try {
    const row = await db.select().from(settings).where(eq(settings.id, "default")).get();
    if (!row) {
      return NextResponse.json(DEFAULTS);
    }
    const data: SettingsData = {
      syncFrequency: row.syncFrequency || "6",
      notificationsEnabled: !!row.notificationsEnabled,
      followUpDays: row.followUpDays || 5,
      alertHighFitDays: row.alertHighFitDays || 2,
      dailyBriefingEnabled: row.dailyBriefingEnabled !== false,
      lastBackupAt: row.lastBackupAt || null,
    };
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(DEFAULTS);
  }
}

export async function PATCH(request: Request) {
  try {
    if (isDemoMode()) {
      return NextResponse.json(demoModeBlockedResponse(), { status: 403 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const sanitized = sanitizePatch(body, ALLOWED_SETTINGS_FIELDS);
    if (Object.keys(sanitized).length === 0) {
      return NextResponse.json(validationError("no valid fields to update"), {
        status: 400,
      });
    }

    const existing = await db
      .select()
      .from(settings)
      .where(eq(settings.id, "default"))
      .get();

    if (existing) {
      await db
        .update(settings)
        .set({ ...sanitized, updatedAt: new Date().toISOString() })
        .where(eq(settings.id, "default"));
    } else {
      await db.insert(settings).values({ id: "default", ...sanitized });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update settings";
    return NextResponse.json(apiError("INTERNAL_ERROR", message), { status: 500 });
  }
}
