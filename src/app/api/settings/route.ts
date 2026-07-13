import { NextResponse } from "next/server";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { SettingsData } from "@/types";
import {
  ALLOWED_SETTINGS_FIELDS,
  demoModeBlockedResponse,
  isDemoMode,
  sanitizePatch,
} from "@/lib/api-guards";

export async function GET() {
  try {
    const row = await db.select().from(settings).where(eq(settings.id, "default")).get();
    if (!row) {
      return NextResponse.json({
        syncFrequency: "6",
        notificationsEnabled: true,
        followUpDays: 5,
        alertHighFitDays: 2,
        dailyBriefingEnabled: true,
        lastBackupAt: null,
        demoMode: isDemoMode(),
      });
    }
    const data: SettingsData = {
      syncFrequency: row.syncFrequency || "6",
      notificationsEnabled: !!row.notificationsEnabled,
      followUpDays: row.followUpDays || 5,
      alertHighFitDays: row.alertHighFitDays || 2,
      dailyBriefingEnabled: row.dailyBriefingEnabled !== false,
      lastBackupAt: row.lastBackupAt || null,
    };
    return NextResponse.json({
      ...data,
      demoMode: isDemoMode(),
    });
  } catch {
    return NextResponse.json({
      syncFrequency: "6",
      notificationsEnabled: true,
      followUpDays: 5,
      alertHighFitDays: 2,
      dailyBriefingEnabled: true,
      lastBackupAt: null,
      demoMode: isDemoMode(),
    });
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
      return NextResponse.json({ error: "no valid fields to update" }, { status: 400 });
    }

    const existing = await db.select().from(settings).where(eq(settings.id, "default")).get();
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
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
