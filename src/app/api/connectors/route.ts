import { NextResponse } from "next/server";
import { fetchRemoteOk } from "@/connectors/remoteok";
import { fetchWeWorkRemotely } from "@/connectors/weworkremotely";
import { fetchGreenhouse } from "@/connectors/greenhouse";
import { fetchLever } from "@/connectors/lever";
import { fetchRemotive } from "@/connectors/remotive";
import { fetchHackerNews } from "@/connectors/hackernews";
import { fetchArbeitnow } from "@/connectors/arbeitnow";
import { fetchJobicy } from "@/connectors/jobicy";
import { fetchLinkedInRSS } from "@/connectors/linkedin-rss";
import { fetchWellfound } from "@/connectors/wellfound";
import { fetchRemoteCo } from "@/connectors/remote-co";
import { fetchGoogleJobs } from "@/connectors/google-jobs";
import { fetch4DayWeek } from "@/connectors/4dayweek";
import { fetchNodesk } from "@/connectors/nodesk";
import { fetchRevelo } from "@/connectors/revelo";
import { fetchHimalayas } from "@/connectors/himalayas";
import { fetchStackOverflow } from "@/connectors/stackoverflow";
import { fetchGupy } from "@/connectors/gupy";
import { db } from "@/db";
import { connectorLogs, jobs } from "@/db/schema";
import { desc, sql } from "drizzle-orm";

interface ConnectorDef {
  id: string;
  name: string;
  fetch: () => Promise<{ new: number; duplicate: number; total: number }>;
}

const connectors: ConnectorDef[] = [
  { id: "remoteok", name: "Remote OK", fetch: fetchRemoteOk },
  { id: "weworkremotely", name: "We Work Remotely", fetch: fetchWeWorkRemotely },
  { id: "greenhouse", name: "Greenhouse", fetch: fetchGreenhouse },
  { id: "lever", name: "Lever", fetch: fetchLever },
  { id: "remotive", name: "Remotive", fetch: fetchRemotive },
  { id: "hackernews", name: "HackerNews", fetch: fetchHackerNews },
  { id: "arbeitnow", name: "Arbeitnow", fetch: fetchArbeitnow },
  { id: "jobicy", name: "Jobicy", fetch: fetchJobicy },
  { id: "linkedin_rss", name: "LinkedIn RSS", fetch: fetchLinkedInRSS },
  { id: "wellfound", name: "Wellfound", fetch: fetchWellfound },
  { id: "remote-co", name: "Remote.co", fetch: fetchRemoteCo },
  { id: "google_jobs", name: "Google Jobs", fetch: fetchGoogleJobs },
  { id: "4dayweek", name: "4 Day Week", fetch: fetch4DayWeek },
  { id: "nodesk", name: "Nodesk", fetch: fetchNodesk },
  { id: "revelo", name: "Revelo", fetch: fetchRevelo },
  { id: "himalayas", name: "Himalayas", fetch: fetchHimalayas },
  { id: "stackoverflow", name: "Stack Overflow Jobs", fetch: fetchStackOverflow },
  { id: "gupy", name: "Gupy", fetch: fetchGupy },
];

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const connectorId = body.connectorId as string | undefined;
  const connectorsList = body.connectors as string[] | undefined;
  const errors: string[] = [];

  const results: Record<string, { new: number; duplicate: number; total: number }> = {};

  let toRun = connectors;
  if (connectorId) {
    toRun = connectors.filter((c) => c.id === connectorId);
  }
  if (connectorsList) {
    toRun = connectors.filter((c) => connectorsList.includes(c.id));
  }

  for (const connector of toRun) {
    try {
      const result = await connector.fetch();
      results[connector.id] = result;
    } catch (err: any) {
      errors.push(`${connector.name}: ${err.message}`);
      results[connector.id] = { new: 0, duplicate: 0, total: 0 };
    }
  }

  return NextResponse.json({
    ok: errors.length === 0,
    results,
    errors: errors.length > 0 ? errors : undefined,
  });
}

export async function GET() {
  const logs = await db
    .select()
    .from(connectorLogs)
    .orderBy(desc(connectorLogs.runAt))
    .limit(50)
    .all();

  const connectorInfo = await Promise.all(connectors.map(async (c) => {
    const count = await db.select({ count: sql<number>`count(*)` }).from(jobs).where(sql`source = ${c.id}`).get();
    return {
      id: c.id,
      name: c.name,
      jobCount: count?.count || 0,
    };
  }));

  return NextResponse.json({ logs, connectors: connectorInfo });
}
