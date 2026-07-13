import { NextResponse } from "next/server";
import { startFreelanceScheduler } from "@/lib/freelance/scheduler";

export async function POST() {
  startFreelanceScheduler(60);
  return NextResponse.json({ ok: true });
}
