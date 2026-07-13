import { db } from "@/db";
import { jobs, jobEvents, jobFollowups, applicationTasks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Shell } from "@/components/layout/Shell";
import { JobDetailClient } from "./job-detail-client";

export const dynamic = "force-dynamic";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = await db.select().from(jobs).where(eq(jobs.id, id)).get();

  if (!job) {
    notFound();
  }

  const events = await db
    .select()
    .from(jobEvents)
    .where(eq(jobEvents.jobId, id))
    .orderBy(jobEvents.occurredAt)
    .all();

  const followups = await db
    .select()
    .from(jobFollowups)
    .where(eq(jobFollowups.jobId, id))
    .orderBy(jobFollowups.dueAt)
    .all();

  const tasks = await db
    .select()
    .from(applicationTasks)
    .where(eq(applicationTasks.jobId, id))
    .orderBy(applicationTasks.createdAt)
    .all();

  return (
    <Shell>
      <JobDetailClient job={job} events={events} followups={followups} tasks={tasks} />
    </Shell>
  );
}
