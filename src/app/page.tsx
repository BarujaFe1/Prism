"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Shell } from "@/components/layout/Shell";
import { RadarList } from "./radar-list";
import { Loader2, Compass, RefreshCw, User, Bell, Calendar, AlertTriangle, Sparkles, Send, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { JobWithStatus, SettingsData } from "@/types";
import { locationTypeLabel, experienceLevelLabel, timeAgo } from "@/lib/utils";

const MODALIDADE_FILTERS = ["remote", "hybrid", "onsite"];
const SENIORITY_FILTERS = ["internship", "trainee", "junior", "mid", "senior", "lead"];

export default function RadarPage() {
  const [modalidadeFilters, setModalidadeFilters] = useState<string[]>([]);
  const [seniorityFilters, setSeniorityFilters] = useState<string[]>([]);

  const toggleModalidade = (val: string) => {
    setModalidadeFilters((prev) => prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val]);
  };
  const toggleSeniority = (val: string) => {
    setSeniorityFilters((prev) => prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val]);
  };

  const { data: allJobs, isLoading } = useQuery({
    queryKey: ["radar-jobs"],
    queryFn: async () => {
      const res = await fetch("/api/jobs?limit=500");
      const data = await res.json() as JobWithStatus[];
      return data;
    },
    staleTime: 10000,
  });

  const stats = useMemo(() => {
    if (!allJobs) return { total: 0, novas: 0, altoFit: 0, aplicadasEstaSemana: 0 };
    const fortyEightHoursAgo = Date.now() - 48 * 60 * 60 * 1000;
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return {
      total: allJobs.length,
      novas: allJobs.filter((j) => {
        const collected = j.fetchedAt ? new Date(j.fetchedAt).getTime() : 0;
        return collected > fortyEightHoursAgo && collected > 0;
      }).length,
      altoFit: allJobs.filter((j) => j.fitLabel === "high" && (j.score ?? 0) >= 0.75).length,
      aplicadasEstaSemana: allJobs.filter((j) => j.status === "applied" && new Date(j.updatedAt).getTime() > sevenDaysAgo).length,
    };
  }, [allJobs]);

  const filteredNewJobs = useMemo(() => {
    if (!allJobs) return [];
    return allJobs.filter((j) => {
      if (j.status !== "new") return false;

      let details: any = {};
      try {
        details = typeof j.scoreDetails === "string" ? JSON.parse(j.scoreDetails) : j.scoreDetails || {};
      } catch {
        // Fallback
      }

      // Hide suppressed / out of focus jobs from the main Radar feed
      if (details?.scoreLabel === "Fora do foco" || (j.score ?? 0) <= 0.30) {
        return false;
      }

      if (modalidadeFilters.length > 0 && (!j.locationType || !modalidadeFilters.includes(j.locationType))) return false;
      if (seniorityFilters.length > 0 && (!j.experienceLevel || !seniorityFilters.includes(j.experienceLevel))) return false;
      return true;
    });
  }, [allJobs, modalidadeFilters, seniorityFilters]);

  const highFitJobs = useMemo(() => {
    return filteredNewJobs.filter((j) => (j.score ?? 0) >= 0.85).slice(0, 10);
  }, [filteredNewJobs]);

  const moderateFitJobs = useMemo(() => {
    return filteredNewJobs.filter((j) => (j.score ?? 0) >= 0.70 && (j.score ?? 0) < 0.85).slice(0, 10);
  }, [filteredNewJobs]);

  const recentJobs = useMemo(() => {
    return filteredNewJobs.sort((a, b) => new Date(b.fetchedAt || "").getTime() - new Date(a.fetchedAt || "").getTime()).slice(0, 30);
  }, [filteredNewJobs]);

  const lastSync = allJobs && allJobs.length > 0
    ? allJobs.sort((a, b) => new Date(b.fetchedAt).getTime() - new Date(a.fetchedAt).getTime())[0]?.fetchedAt
    : null;

  const isSyncOld = useMemo(() => {
    if (!lastSync) return false;
    return (Date.now() - new Date(lastSync).getTime()) > 48 * 60 * 60 * 1000;
  }, [lastSync]);

  const hasFilters = modalidadeFilters.length > 0 || seniorityFilters.length > 0;

  // Daily Briefing data
  const { data: settings } = useQuery<SettingsData>({
    queryKey: ["settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings");
      return res.json();
    },
    staleTime: 30000,
  });

  const briefing = useMemo(() => {
    if (!allJobs || !settings?.dailyBriefingEnabled) return null;
    const today = new Date().toISOString().split("T")[0];
    const now = Date.now();

    // Follow-ups overdue: applied/reviewing/interview with no update in 5+ days
    const followUpsOverdue = allJobs.filter((j) => {
      if (!["applied", "reviewing", "interview"].includes(j.status)) return false;
      return (now - new Date(j.updatedAt).getTime()) > (settings.followUpDays || 5) * 86400000;
    });

    // High fit jobs not yet actioned
    const highFitNotActioned = allJobs.filter((j) =>
      j.fitLabel === "high" && (j.score ?? 0) >= 0.75 && ["new", "saved"].includes(j.status)
    ).slice(0, 5);

    // Top recommendation
    const topRec = allJobs.filter((j) =>
      j.fitLabel === "high" && (j.score ?? 0) >= 0.80 && j.status === "new"
    ).sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];

    const hasPendingAction = followUpsOverdue.length > 0 || highFitNotActioned.length > 0;

    return { followUpsOverdue, highFitNotActioned, topRec, hasPendingAction };
  }, [allJobs, settings]);

  return (
    <Shell>
      <div className="px-6 pt-4 pb-16 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Radar</h1>
            <p className="text-sm text-text-secondary mt-1">
              Vagas novas e sinais fortes para sua carreira
              {lastSync && (
                <span className="ml-2 text-text-tertiary">
                  · Última coleta: {new Date(lastSync).toLocaleString("pt-BR")}
                </span>
              )}
              {isSyncOld && (
                <span className="ml-2 text-amber-500 font-medium inline-flex items-center gap-1">
                  ⚠️ Última coleta antiga (há mais de 48h)
                </span>
              )}
            </p>
          </div>
          <Link href="/sources">
            <Button variant="ghost" size="sm">
              <RefreshCw className="h-3.5 w-3.5" />
              Sincronizar
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total de vagas", value: stats.total, color: "text-text-primary" },
            { label: "Novas (48h)", value: stats.novas, color: "text-accent" },
            { label: "Alto fit", value: stats.altoFit, color: "text-emerald-600 dark:text-emerald-400" },
            { label: "Aplicadas (7 dias)", value: stats.aplicadasEstaSemana, color: "text-success" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border bg-bg p-4">
              <p className="text-xs text-text-tertiary font-medium uppercase tracking-wider">{s.label}</p>
              <p className={`text-2xl font-semibold mt-1 tabular-nums ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Daily Briefing */}
        {briefing?.hasPendingAction && (
          <div className="mb-6 rounded-xl border border-accent/20 bg-accent/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-accent" />
              <h2 className="text-sm font-semibold text-text-primary">Hoje no Radar</h2>
              <span className="text-[10px] text-text-tertiary">· {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Follow-ups overdue */}
              {briefing.followUpsOverdue.length > 0 && (
                <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Bell className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                    <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                      {briefing.followUpsOverdue.length} follow-up{briefing.followUpsOverdue.length > 1 ? "s" : ""} pendente{briefing.followUpsOverdue.length > 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="space-y-1">
                    {briefing.followUpsOverdue.slice(0, 3).map((j) => (
                      <Link key={j.id} href={`/jobs/${j.id}`}
                        className="block text-[11px] text-amber-700 dark:text-amber-400 hover:underline truncate">
                        {j.title} · {j.company}
                      </Link>
                    ))}
                  </div>
                  <Link href="/pipeline" className="text-[10px] text-accent hover:underline mt-1.5 inline-flex items-center gap-0.5">
                    Ver pipeline <ArrowRight className="h-2.5 w-2.5" />
                  </Link>
                </div>
              )}

              {/* High fit not actioned */}
              {briefing.highFitNotActioned.length > 0 && (
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                      {briefing.highFitNotActioned.length} alto fit sem ação
                    </p>
                  </div>
                  <div className="space-y-1">
                    {briefing.highFitNotActioned.map((j) => (
                      <Link key={j.id} href={`/jobs/${j.id}`}
                        className="block text-[11px] text-emerald-700 dark:text-emerald-400 hover:underline truncate">
                        {Math.round((j.score ?? 0) * 100)}% · {j.title} · {j.company}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Top recommendation */}
              {briefing.topRec && (
                <div className="rounded-lg bg-accent/10 border border-accent/20 p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Send className="h-3.5 w-3.5 text-accent" />
                    <p className="text-xs font-semibold text-text-primary">Recomendação do dia</p>
                  </div>
                  <Link href={`/jobs/${briefing.topRec.id}`}
                    className="block text-[11px] text-accent hover:underline">
                    {Math.round((briefing.topRec.score ?? 0) * 100)}% · {briefing.topRec.title}
                  </Link>
                  <p className="text-[10px] text-text-tertiary mt-0.5">{briefing.topRec.company}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 mb-6 pb-4 border-b border-border">
          <span className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider mr-1">Modalidade</span>
          {MODALIDADE_FILTERS.map((m) => (
            <button
              key={m}
              onClick={() => toggleModalidade(m)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                modalidadeFilters.includes(m)
                  ? "bg-accent/10 text-accent ring-1 ring-accent/30"
                  : "bg-bg-elevated text-text-secondary hover:text-text-primary hover:bg-bg-elevated/80"
              }`}
            >
              {locationTypeLabel(m)}
            </button>
          ))}
          <span className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider ml-3 mr-1">Senioridade</span>
          {SENIORITY_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => toggleSeniority(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                seniorityFilters.includes(s)
                  ? "bg-accent/10 text-accent ring-1 ring-accent/30"
                  : "bg-bg-elevated text-text-secondary hover:text-text-primary hover:bg-bg-elevated/80"
              }`}
            >
              {experienceLevelLabel(s)}
            </button>
          ))}
          {hasFilters && (
            <button
              onClick={() => { setModalidadeFilters([]); setSeniorityFilters([]); }}
              className="text-[11px] text-text-tertiary hover:text-text-primary ml-2"
            >
              Limpar
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-text-tertiary" />
          </div>
        ) : !allJobs || allJobs.length === 0 ? (
          <div className="rounded-xl border border-dashed p-16 text-center">
            <Compass className="h-8 w-8 mx-auto text-text-tertiary mb-3" />
            <p className="text-sm text-text-secondary">Nenhuma vaga encontrada</p>
            <p className="text-xs text-text-tertiary mt-1 mb-4">Execute uma sincronização nas Fontes ou ajuste suas habilidades no Perfil.</p>
            <div className="flex items-center justify-center gap-3">
              <Link href="/sources">
                <Button variant="primary"><RefreshCw className="h-4 w-4" />Sincronizar agora</Button>
              </Link>
              <Link href="/profile">
                <Button variant="secondary"><User className="h-4 w-4" />Editar perfil</Button>
              </Link>
            </div>
          </div>
        ) : (
          <>
            {highFitJobs.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Excelente Fit (&gt;=85%) — Excelente correspondência
                </h2>
                <RadarList jobs={highFitJobs} />
              </div>
            )}
            {highFitJobs.length === 0 && hasFilters && (
              <div className="mb-8 rounded-xl border border-dashed p-8 text-center">
                <p className="text-sm text-text-secondary">Nenhuma vaga de excelente fit com estes filtros</p>
                <p className="text-xs text-text-tertiary mt-1">Tente ampliar os filtros ou executar uma sincronização.</p>
              </div>
            )}

            {moderateFitJobs.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  Fit Bom/Moderado (70-84%) — Vale considerar
                </h2>
                <RadarList jobs={moderateFitJobs} />
              </div>
            )}

            {recentJobs.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  Últimas vagas
                </h2>
                <RadarList jobs={recentJobs} />
              </div>
            )}

            {filteredNewJobs.length === 0 && (
              <div className="rounded-xl border border-dashed p-16 text-center">
                <Compass className="h-8 w-8 mx-auto text-text-tertiary mb-3" />
                <p className="text-sm text-text-secondary">Nenhuma vaga nova com esses filtros</p>
                <p className="text-xs text-text-tertiary mt-1">Tente remover alguns filtros para ver mais resultados.</p>
              </div>
            )}
          </>
        )}
      </div>
    </Shell>
  );
}
