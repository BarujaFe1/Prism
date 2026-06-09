import { NextResponse } from "next/server";
import { stopFreelanceScheduler } from "@/lib/freelance/scheduler";

export async function POST() {
  stopFreelanceScheduler();
  return NextResponse.json({ ok: true });
}
