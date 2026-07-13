import { NextResponse } from "next/server";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { SettingsData } from "@/types";

export async function GET() {
  try {
    const row = await db.select().from(settings).where(eq(settings.id, "default")).get();
    if (!row) {
      return NextResponse.json({
        syncFrequency: "6", notificationsEnabled: true, followUpDays: 5,
        alertHighFitDays: 2, dailyBriefingEnabled: true, lastBackupAt: null,
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
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({
      syncFrequency: "6", notificationsEnabled: true, followUpDays: 5,
      alertHighFitDays: 2, dailyBriefingEnabled: true, lastBackupAt: null,
    });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const existing = await db.select().from(settings).where(eq(settings.id, "default")).get();
    if (existing) {
      await db.update(settings).set({ ...body, updatedAt: new Date().toISOString() }).where(eq(settings.id, "default"));
    } else {
      await db.insert(settings).values({ id: "default", ...body });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
