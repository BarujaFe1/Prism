"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  GitPullRequestArrow, Sparkles, Bookmark, Send, Search, MessageCircle,
  Briefcase, XCircle, Eye, Loader2, ArrowRight, Clock, Calendar,
  AlertTriangle, ArrowUpCircle, CheckCircle2, Ban, Archive,
} from "lucide-react";
import { useMemo } from "react";
import { statusLabel, timeAgo } from "@/lib/utils";
import type { JobWithStatus } from "@/types";

const pipelineStages: { status: string; label: string; icon: any; color: string }[] = [
  { status: "saved", label: "Salvas", icon: Bookmark, color: "text-blue-500" },
  { status: "high_priority", label: "Prioritárias", icon: Sparkles, color: "text-amber-500" },
  { status: "preparing", label: "Preparando", icon: ArrowUpCircle, color: "text-purple-500" },
  { status: "applied", label: "Aplicadas", icon: Send, color: "text-teal-500" },
  { status: "reviewing", label: "Em análise", icon: Search, color: "text-indigo-500" },
  { status: "interview", label: "Entrevista", icon: MessageCircle, color: "text-emerald-500" },
  { status: "offer", label: "Oferta", icon: Briefcase, color: "text-emerald-600" },
  { status: "rejected", label: "Recusadas", icon: XCircle, color: "text-rose-500" },
  { status: "archived", label: "Arquivadas", icon: Archive, color: "text-text-tertiary" },
];

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

function ageLabel(days: number): string {
  if (days === 0) return "hoje";
  if (days === 1) return "1 dia";
  return `${days} dias`;
}

function isOverdue(dateStr: string, thresholdDays: number): boolean {
  return daysSince(dateStr) > thresholdDays;
}

export function PipelineClient() {
  const queryClient = useQueryClient();

  const curatedStatuses = pipelineStages.map((s) => s.status).join(",");
  const allStatuses = ["saved", "high_priority", "preparing", "applied", "reviewing", "interview", "offer", "rejected", "archived"];

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["pipeline-jobs", curatedStatuses],
    queryFn: async () => {
      const res = await fetch(`/api/jobs?limit=500&status=${allStatuses.join(",")}`);
      return res.json() as Promise<JobWithStatus[]>;
    },
    staleTime: 10000,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, nextActionType, nextActionDate }: { id: string; status?: string; nextActionType?: string; nextActionDate?: string }) => {
      const body: Record<string, any> = { id };
      if (status) body.status = status;
      if (nextActionType !== undefined) body.nextActionType = nextActionType;
      if (nextActionDate !== undefined) body.nextActionDate = nextActionDate;
      await fetch("/api/jobs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pipeline-jobs"] }),
  });

  const grouped = useMemo(() => {
    const map = new Map<string, JobWithStatus[]>();
    pipelineStages.forEach((s) => map.set(s.status, []));
    jobs?.forEach((j) => {
      const arr = map.get(j.status) || [];
      arr.push(j);
      map.set(j.status, arr);
    });
    return map;
  }, [jobs]);

  const today = new Date().toISOString().split("T")[0];
  const now = Date.now();

  const needsFollowUp = useMemo(() => {
    if (!jobs) return [];
    return jobs.filter((j) => {
      if (j.status === "applied" || j.status === "reviewing" || j.status === "interview") {
        const updated = new Date(j.updatedAt).getTime();
        return (now - updated) > 5 * 86400000;
      }
      if (j.nextActionDate && j.nextActionDate <= today) return true;
      return false;
    });
  }, [jobs, today, now]);

  const hasAnyJobs = jobs && jobs.length > 0;

  return (
    <div className="px-6 pt-4 pb-16">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Pipeline</h1>
        <p className="text-sm text-text-secondary mt-1">Acompanhe o estágio de cada candidatura</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-text-tertiary" />
        </div>
      ) : !hasAnyJobs ? (
        <div className="rounded-xl border border-dashed p-16 text-center max-w-xl mx-auto mt-12">
          <GitPullRequestArrow className="h-8 w-8 mx-auto text-text-tertiary mb-3" />
          <p className="text-sm text-text-secondary font-medium">Pipeline vazio</p>
          <p className="text-xs text-text-tertiary mt-1 mb-4">
            O Pipeline só mostra vagas que você moveu intencionalmente. Salve vagas do Radar ou Explorar para começar.
          </p>
          <Link href="/"><Button variant="primary"><Eye className="h-4 w-4" />Ir para o Radar</Button></Link>
        </div>
      ) : (
        <>
          {/* Alertas de follow-up */}
          {needsFollowUp.length > 0 && (
            <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                  {needsFollowUp.length} candidatura{needsFollowUp.length > 1 ? "s" : ""} precisa{needsFollowUp.length > 1 ? "m" : ""} de follow-up
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {needsFollowUp.slice(0, 5).map((j) => (
                  <Link key={j.id} href={`/jobs/${j.id}`}
                    className="text-xs px-2.5 py-1.5 rounded-lg bg-white dark:bg-amber-900/40 border border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors">
                    {j.title} · {j.company}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Timeline / Kanban horizontal scrolling */}
          <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: "60vh" }}>
            {pipelineStages.map((stage) => {
              const Icon = stage.icon;
              const stageJobs = grouped.get(stage.status) || [];

              return (
                <div key={stage.status} className="flex-shrink-0 w-64">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-1.5">
                      <Icon className={`h-3.5 w-3.5 ${stage.color}`} />
                      <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">{stage.label}</h3>
                    </div>
                    <span className="text-xs text-text-tertiary tabular-nums">{stageJobs.length}</span>
                  </div>

                  <div className="space-y-2">
                    {stageJobs.map((job) => {
                      const ageDays = daysSince(job.updatedAt);
                      const stale = ageDays > 14;
                      const hasNextAction = job.nextActionDate && job.nextActionDate <= today;

                      return (
                        <div key={job.id} className="group relative">
                          <Link href={`/jobs/${job.id}`}>
                            <Card className={`cursor-pointer hover:border-accent/30 transition-all duration-200 ${stale ? "opacity-60" : ""}`}>
                              <CardContent className="pb-3 pt-3">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-sm font-medium text-text-primary leading-snug line-clamp-2 flex-1">{job.title}</p>
                                  {stale && <Clock className="h-3 w-3 text-text-tertiary shrink-0 mt-0.5" />}
                                </div>
                                <p className="text-xs text-text-secondary mt-0.5">{job.company}</p>

                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                  {/* Score */}
                                  {job.score !== null && (
                                    <span className={`text-[10px] font-semibold tabular-nums ${
                                      job.score >= 0.75 ? "text-emerald-600 dark:text-emerald-400" :
                                      job.score >= 0.50 ? "text-blue-600 dark:text-blue-400" :
                                      "text-text-tertiary"
                                    }`}>
                                      {Math.round(job.score * 100)}%
                                    </span>
                                  )}
                                  {/* Aging badge */}
                                  <span className={`text-[10px] ${ageDays > 7 ? "text-amber-500 font-medium" : "text-text-tertiary"}`}>
                                    {ageLabel(ageDays)}
                                  </span>
                                  {/* Next action indicator */}
                                  {hasNextAction && (
                                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-0.5">
                                      <AlertTriangle className="h-2.5 w-2.5" />
                                      Ação
                                    </span>
                                  )}
                                </div>

                                {/* Next action detail */}
                                {job.nextActionType && (
                                  <p className="text-[10px] text-text-tertiary mt-1 truncate">
                                    {job.nextActionType === "follow_up" ? "📩 Follow-up pendente" :
                                     job.nextActionType === "prepare" ? "📝 Preparar candidatura" :
                                     job.nextActionType === "apply" ? "🚀 Aplicar" :
                                     job.nextActionType === "interview" ? "🎯 Entrevista" :
                                     job.nextActionType === "test" ? "🧪 Teste técnico" :
                                     job.nextActionType === "thank_you" ? "🙏 Agradecimento" : job.nextActionType}
                                    {job.nextActionDate && ` até ${new Date(job.nextActionDate).toLocaleDateString("pt-BR")}`}
                                  </p>
                                )}
                              </CardContent>
                            </Card>
                          </Link>

                          {/* Stage transition buttons */}
                          <div className="absolute -right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-0.5">
                            {/* Find next possible status */}
                            {stage.status === "saved" && (
                              <button onClick={(e) => { e.preventDefault(); updateMutation.mutate({ id: job.id, status: "high_priority" }); }}
                                className="h-5 w-5 rounded-full bg-amber-500/20 hover:bg-amber-500/40 flex items-center justify-center" title="Priorizar">
                                <ArrowUpCircle className="h-3 w-3 text-amber-500" />
                              </button>
                            )}
                            {stage.status === "high_priority" && (
                              <button onClick={(e) => { e.preventDefault(); updateMutation.mutate({ id: job.id, status: "preparing" }); }}
                                className="h-5 w-5 rounded-full bg-purple-500/20 hover:bg-purple-500/40 flex items-center justify-center" title="Preparar">
                                <ArrowUpCircle className="h-3 w-3 text-purple-500" />
                              </button>
                            )}
                            {stage.status === "preparing" && (
                              <button onClick={(e) => { e.preventDefault(); updateMutation.mutate({ id: job.id, status: "applied" }); }}
                                className="h-5 w-5 rounded-full bg-teal-500/20 hover:bg-teal-500/40 flex items-center justify-center" title="Aplicar">
                                <Send className="h-3 w-3 text-teal-500" />
                              </button>
                            )}
                            {(stage.status === "applied" || stage.status === "reviewing") && (
                              <button onClick={(e) => { e.preventDefault(); updateMutation.mutate({ id: job.id, nextActionType: "follow_up", nextActionDate: new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0] }); }}
                                className="h-5 w-5 rounded-full bg-amber-500/20 hover:bg-amber-500/40 flex items-center justify-center" title="Agendar follow-up">
                                <Calendar className="h-3 w-3 text-amber-500" />
                              </button>
                            )}
                            {stage.status !== "archived" && stage.status !== "rejected" && (
                              <button onClick={(e) => { e.preventDefault(); updateMutation.mutate({ id: job.id, status: "archived" }); }}
                                className="h-5 w-5 rounded-full bg-gray-500/20 hover:bg-gray-500/40 flex items-center justify-center" title="Arquivar">
                                <Archive className="h-3 w-3 text-gray-500" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {stageJobs.length === 0 && (
                      <div className="rounded-xl border border-dashed p-5 text-center">
                        <Icon className={`h-5 w-5 mx-auto mb-1.5 ${stage.color} opacity-40`} />
                        <p className="text-[11px] text-text-tertiary">Nenhuma vaga nesta coluna</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
