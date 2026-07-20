import { NextResponse } from "next/server";
import { startFreelanceScheduler } from "@/lib/freelance/scheduler";
import { demoModeBlockedResponse, isDemoMode } from "@/lib/api-guards";

export async function POST() {
  if (isDemoMode()) {
    return NextResponse.json(demoModeBlockedResponse(), { status: 403 });
  }

  startFreelanceScheduler(60);
  return NextResponse.json({ ok: true });
}
