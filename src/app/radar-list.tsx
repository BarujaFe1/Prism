"use client";

import { JobCard } from "@/components/jobs/JobCard";
import type { JobWithStatus } from "@/types";

export function RadarList({ jobs }: { jobs: JobWithStatus[] }) {
  if (jobs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-12 text-center">
        <p className="text-sm text-text-secondary">Nenhuma vaga encontrada ainda.</p>
        <p className="text-xs text-text-tertiary mt-1">Configure fontes na página Fontes para começar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
}
