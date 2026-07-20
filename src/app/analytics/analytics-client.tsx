"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart3, Briefcase, TrendingUp, Send, Star, Target, Layers,
  Radar, Compass, Sparkles, Loader2, User, Globe, Bot,
  AlertTriangle, AlertCircle, CheckCircle, Clock, CheckCircle2,
  Download,
} from "lucide-react";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from "recharts";
import type { JobWithStatus, ProfileData } from "@/types";
import {
  locationTypeLabel, experienceLevelLabel,
} from "@/lib/utils";

const TEAL = "#0d9488";
const BLUE = "#3b82f6";
const AMBER = "#f59e0b";
const EMERALD = "#10b981";
const ROSE = "#f43f5e";
const PURPLE = "#8b5cf6";
const COLORS = [TEAL, BLUE, EMERALD, AMBER, PURPLE, ROSE, "#6366f1", "#14b8a6", "#f97316", "#a855f7"];
const COLORS_PIE = ["#0d9488", "#3b82f6", "#f59e0b", "#f43f5e", "#8b5cf6", "#10b981"];

export function AnalyticsClient() {
  const { data: jobs, isLoading, isError } = useQuery({
    queryKey: ["analytics-jobs"],
    queryFn: async () => {
      const res = await fetch("/api/jobs?limit=500");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json() as Promise<JobWithStatus[]>;
    },
    retry: 2,
    staleTime: 15000,
  });

  const { data: profile } = useQuery({
    queryKey: ["analytics-profile"],
    queryFn: async () => {
      const res = await fetch("/api/profile");
      return res.json() as Promise<ProfileData>;
    },
    staleTime: 30000,
  });

  const { data: freelanceResponse } = useQuery({
    queryKey: ["analytics-freelance-projects"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/freelance/projects?limit=500");
        if (!res.ok) return { projects: [], total: 0 };
        return res.json() as Promise<{ projects: { collectedAt?: string; fitScore?: number; status?: string }[]; total: number }>;
      } catch (err) {
        return { projects: [], total: 0 };
      }
    },
    staleTime: 30000,
  });

  const freelanceProjects = useMemo(() => freelanceResponse?.projects || [], [freelanceResponse]);

  const { data: connectorsData } = useQuery({
    queryKey: ["analytics-connectors"],
    queryFn: async () => {
      const res = await fetch("/api/connectors");
      if (!res.ok) throw new Error("Failed to fetch connectors");
      return res.json() as Promise<{
        logs: { id: string; connectorName: string; runAt: string; jobsFetched: number; jobsNew: number; jobsDuplicate: number; errorMessage: string | null; durationMs: number | null }[];
        connectors: { id: string; name: string; jobCount: number }[];
      }>;
    },
    staleTime: 30000,
  });

  const [nowTime] = useState(() => Date.now());

  const fortyEightHoursAgo = useMemo(() => nowTime - 48 * 60 * 60 * 1000, [nowTime]);

  const novas48h = useMemo(() => {
    const safeJobs = jobs ?? [];
    return safeJobs.filter((j) => {
      const fetched = j.fetchedAt ? new Date(j.fetchedAt).getTime() : 0;
      return fetched > fortyEightHoursAgo;
    }).length;
  }, [jobs, fortyEightHoursAgo]);

  const estaSemana = useMemo(() => {
    const safeJobs = jobs ?? [];
    return safeJobs.filter((j) => {
      const d = j.fetchedAt ? new Date(j.fetchedAt).getTime() : 0;
      return nowTime - d < 7 * 86400000;
    }).length;
  }, [jobs, nowTime]);

  const profileSkillsLower = useMemo(
    () => (profile?.skills || []).map((s) => s.toLowerCase()),
    [profile]
  );

  const techCount = useMemo(() => {
    const map = new Map<string, number>();
    if (!jobs) return map;
    jobs.forEach((j) => (j.technologies || []).forEach((t: string) => map.set(t, (map.get(t) || 0) + 1)));
    return map;
  }, [jobs]);

  const skillVsDemand = useMemo(() => {
    if (!techCount || techCount.size === 0) return [];
    const mercadoAll = [...techCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
    return mercadoAll.map(([tech, count]) => {
      const inProfile = profileSkillsLower.includes(tech.toLowerCase());
      return { name: tech, vagas: count, profileSkill: inProfile ? count : 0 };
    });
  }, [techCount, profileSkillsLower]);

  // Classified domains distribution
  const domainData = useMemo(() => {
    if (!jobs) return [];
    const map = new Map<string, number>();
    jobs.forEach((job) => {
      let d = "unknown";
      try {
        const details = typeof job.scoreDetails === "string" ? JSON.parse(job.scoreDetails) : job.scoreDetails;
        d = details?.domain || "unknown";
      } catch {
        // fallback
      }
      map.set(d, (map.get(d) || 0) + 1);
    });

    const domainLabels: Record<string, string> = {
      data: "Dados / Estatística",
      data_engineering: "Eng. de Dados",
      analytics: "Analytics / BI",
      ai_llm: "IA / LLM",
      fullstack_backend: "Full-Stack / Product / Backend",
      frontend: "Frontend",
      software_engineering: "Eng. de Software",
      design: "Design",
      legal: "Jurídico",
      sales: "Vendas / Marketing",
      finance_ops: "Finanças / Ops",
      admin_support: "Suporte / Admin",
      unknown: "Desconhecido",
    };

    return [...map.entries()]
      .map(([key, value]) => ({
        key,
        name: domainLabels[key] || key,
        value,
      }))
      .sort((a, b) => b.value - a.value);
  }, [jobs]);

  // Quality metrics per job source
  const sourceStats = useMemo(() => {
    if (!jobs) return [];
    const map = new Map<string, { total: number; relevant: number; pipeline: number; applied: number; discarded: number }>();
    
    jobs.forEach((j) => {
      const stats = map.get(j.source) || { total: 0, relevant: 0, pipeline: 0, applied: 0, discarded: 0 };
      stats.total++;
      
      const isPipeline = ["saved", "high_priority", "preparing", "applied", "reviewing", "interview", "offer", "rejected"].includes(j.status);
      const isApplied = ["applied", "reviewing", "interview", "offer"].includes(j.status);
      const isDiscarded = ["ignored", "archived"].includes(j.status);
      const isRelevant = j.fitLabel === "high" || j.fitLabel === "good" || (j.score ?? 0) >= 0.70;

      if (isPipeline) stats.pipeline++;
      if (isApplied) stats.applied++;
      if (isDiscarded) stats.discarded++;
      if (isRelevant) stats.relevant++;

      map.set(j.source, stats);
    });

    return [...map.entries()].map(([source, stats]) => ({
      source,
      ...stats,
      conversionRate: stats.total > 0 ? Math.round((stats.pipeline / stats.total) * 100) : 0,
      appliedRate: stats.pipeline > 0 ? Math.round((stats.applied / stats.pipeline) * 100) : 0,
    })).sort((a, b) => b.total - a.total);
  }, [jobs]);

  // Sync health errors
  const failedConnectors = useMemo(() => {
    if (!connectorsData?.logs) return [];
    const latestLogs = new Map<string, typeof connectorsData.logs[0]>();
    connectorsData.logs.forEach((log) => {
      if (!latestLogs.has(log.connectorName)) {
        latestLogs.set(log.connectorName, log);
      }
    });
    return [...latestLogs.values()]
      .filter((log) => log.errorMessage !== null)
      .map((log) => ({ name: log.connectorName, error: log.errorMessage, runAt: log.runAt }));
  }, [connectorsData]);

  // North Star: Strategic applications per week (fit >= 75%, applied, recent, checklist complete >= 4/8 checked items)
  const strategicApplicationsWeek = useMemo(() => {
    const safeJobs = jobs ?? [];
    const sevenDaysAgo = nowTime - 7 * 24 * 60 * 60 * 1000;
    return safeJobs.filter((j) => {
      const isApplied = ["applied", "reviewing", "testing", "interview", "offer", "rejected"].includes(j.status);
      if (!isApplied) return false;
      
      const appliedTime = j.appliedAt ? new Date(j.appliedAt).getTime() : 0;
      if (appliedTime < sevenDaysAgo) return false;

      let fitScoreVal = 0;
      try {
        const details = typeof j.scoreDetails === "string" ? JSON.parse(j.scoreDetails) : j.scoreDetails;
        fitScoreVal = details?.fitScore ?? (j.score ?? 0);
      } catch {
        fitScoreVal = j.score ?? 0;
      }
      if (fitScoreVal < 0.75) return false;

      let checklistCount = 0;
      try {
        const checklist = j.checklistJson ? JSON.parse(j.checklistJson) : [];
        checklistCount = Array.isArray(checklist) ? checklist.filter((item: { checked?: boolean }) => !!item.checked).length : 0;
      } catch {
        checklistCount = 0;
      }
      return checklistCount >= 4;
    }).length;
  }, [jobs, nowTime]);

  // Secondary metric for freela: qualified freelas per week (fit >= 70%, recent, action taken)
  const qualifiedFreelasWeek = useMemo(() => {
    const sevenDaysAgo = nowTime - 7 * 24 * 60 * 60 * 1000;
    return freelanceProjects.filter((p) => {
      const collectedTime = p.collectedAt ? new Date(p.collectedAt).getTime() : 0;
      if (collectedTime < sevenDaysAgo) return false;

      const fitVal = p.fitScore ?? 0;
      if (fitVal < 0.70) return false;

      const hasAction = !["new", "ignored"].includes(p.status || "");
      return hasAction;
    }).length;
  }, [freelanceProjects, nowTime]);

  // Average fit of applied jobs
  const appliedJobs = useMemo(() => {
    const safeJobs = jobs ?? [];
    return safeJobs.filter((j) => ["applied", "reviewing", "testing", "interview", "offer"].includes(j.status));
  }, [jobs]);

  const avgFitApplied = useMemo(() => {
    if (!appliedJobs || appliedJobs.length === 0) return 0;
    let sum = 0;
    appliedJobs.forEach((j) => {
      let fitScoreVal = j.score ?? 0;
      try {
        const details = typeof j.scoreDetails === "string" ? JSON.parse(j.scoreDetails) : j.scoreDetails;
        fitScoreVal = details?.fitScore ?? (j.score ?? 0);
      } catch {
        // fallback
      }
      sum += fitScoreVal;
    });
    return Math.round((sum / appliedJobs.length) * 100);
  }, [appliedJobs]);

  // Checklist compliance rate (applied/reviewing/testing/interview/offer with >= 4 items checked)
  const checklistComplianceRate = useMemo(() => {
    const safeJobs = jobs ?? [];
    const pipelineAppliedOrPreparing = safeJobs.filter((j) => 
      ["preparing", "applied", "reviewing", "testing", "interview", "offer", "rejected"].includes(j.status)
    );
    if (pipelineAppliedOrPreparing.length === 0) return 0;
    
    let completeCount = 0;
    pipelineAppliedOrPreparing.forEach((j) => {
      let checklistCount = 0;
      try {
        const checklist = j.checklistJson ? JSON.parse(j.checklistJson) : [];
        checklistCount = Array.isArray(checklist) ? checklist.filter((item: { checked?: boolean }) => !!item.checked).length : 0;
      } catch {
        // fallback
      }
      if (checklistCount >= 4) completeCount++;
    });
    return Math.round((completeCount / pipelineAppliedOrPreparing.length) * 100);
  }, [jobs]);

  // Recurrent Skills Gaps in Felipe's Pipeline
  const recurrentGaps = useMemo(() => {
    const safeJobs = jobs ?? [];
    const map = new Map<string, number>();
    const pipeline = safeJobs.filter((j) => 
      ["saved", "high_priority", "preparing", "applied", "reviewing", "testing", "interview", "offer", "rejected"].includes(j.status)
    );
    
    pipeline.forEach((j) => {
      let missingGaps: string[] = [];
      try {
        const details = typeof j.scoreDetails === "string" ? JSON.parse(j.scoreDetails) : j.scoreDetails;
        missingGaps = details?.missingGaps || [];
      } catch {
        const jTechs = j.technologies || [];
        missingGaps = jTechs.filter((t) => !profileSkillsLower.includes(t.toLowerCase()));
      }
      
      missingGaps.forEach((g) => {
        const capitalizedGap = g.charAt(0).toUpperCase() + g.slice(1).toLowerCase();
        map.set(capitalizedGap, (map.get(capitalizedGap) || 0) + 1);
      });
    });
    
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));
  }, [jobs, profileSkillsLower]);

  if (isLoading) {
    return (
      <div className="px-6 pt-4 pb-16 max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Analytics</h1>
          <p className="text-sm text-text-secondary mt-1">Carregando métricas...</p>
        </div>
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}><CardContent className="pt-4 pb-4"><div className="h-12 bg-bg-elevated rounded-lg animate-pulse" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  if (isError || !jobs) {
    return <EmptyState />;
  }

  if (jobs.length === 0) {
    return <EmptyState />;
  }

  const total = jobs.length;

  const pipelineJobs = jobs.filter((j) => ["saved", "high_priority", "preparing", "applied", "reviewing", "interview", "offer", "rejected"].includes(j.status));
  const discoveryToPipelineRate = total > 0 ? Math.round((pipelineJobs.length / total) * 100) : 0;
  const applied = jobs.filter((j) => ["applied", "reviewing", "interview", "offer"].includes(j.status)).length;
  const pipelineToAppliedRate = pipelineJobs.length > 0 ? Math.round((applied / pipelineJobs.length) * 100) : 0;

  const interviews = jobs.filter((j) => ["interview", "offer"].includes(j.status)).length;
  const offers = jobs.filter((j) => j.status === "offer").length;
  const responseRate = applied > 0 ? Math.round((interviews / applied) * 100) : 0;

  const suppressedCount = jobs.filter((j) => {
    try {
      const d = typeof j.scoreDetails === "string" ? JSON.parse(j.scoreDetails) : j.scoreDetails;
      return d?.scoreLabel === "Fora do foco" || (j.score ?? 0) <= 0.30;
    } catch {
      return (j.score ?? 0) <= 0.30;
    }
  }).length;

  const pipelineFunnel = [
    { name: "Descobertas", value: total },
    { name: "Pipeline / Salvas", value: pipelineJobs.length },
    { name: "Aplicadas", value: applied },
    { name: "Em análise", value: jobs.filter((j) => j.status === "reviewing").length },
    { name: "Entrevistas", value: interviews },
    { name: "Ofertas", value: offers },
  ];

  const timelineData = (() => {
    const dayMap = new Map<string, number>();
    const nowRef = new Date(nowTime);
    for (let i = 29; i >= 0; i--) {
      const d = new Date(nowRef);
      d.setDate(d.getDate() - i);
      dayMap.set(d.toISOString().split("T")[0], 0);
    }
    jobs.forEach((j) => {
      const d = j.fetchedAt?.split(/[T ]/)[0];
      if (d && dayMap.has(d)) dayMap.set(d, (dayMap.get(d) || 0) + 1);
    });
    return [...dayMap.entries()].map(([date, count]) => ({
      date: date.slice(5),
      value: count,
    }));
  })();

  return (
    <div className="px-6 pt-4 pb-16 max-w-7xl mx-auto">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Analytics</h1>
          <p className="text-sm text-text-secondary mt-1">
            Métricas de funil acionáveis e análise de conversão por fonte
            <span className="ml-2 text-text-tertiary">· {estaSemana} novas esta semana</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a href="/api/case-export" download="prism-case-study.md">
            <Button variant="secondary" className="gap-2 text-xs h-9">
              <Download className="h-4 w-4 text-accent" />
              Exportar Case (Portfólio)
            </Button>
          </a>
        </div>
      </div>

      {/* Warning Center for Connection Failures */}
      {failedConnectors.length > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex gap-3 items-start animate-fade-in">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-red-600 dark:text-red-400">
              Falha de Conexão Detectada ({failedConnectors.length} fontes)
            </h3>
            <p className="text-xs text-text-secondary mt-1">
              Os seguintes conectores falharam na última tentativa de sincronização:
            </p>
            <div className="mt-2 space-y-1">
              {failedConnectors.map((c) => (
                <div key={c.name} className="text-xs flex items-center justify-between text-text-secondary bg-bg p-2 rounded-lg border border-border">
                  <span>💼 <strong className="text-text-primary">{c.name}</strong></span>
                  <span className="text-text-tertiary truncate max-w-md text-[11px]" title={c.error || ""}>
                    {c.error || "Erro desconhecido"}
                  </span>
                  <span className="text-[10px] text-text-tertiary">{new Date(c.runAt).toLocaleTimeString("pt-BR")}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* North Star & Performance Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6 text-left">
        <Card className="border-accent/30 bg-accent/5 overflow-hidden">
          <CardContent className="pt-5 pb-5 flex items-start gap-4">
            <div className="p-3 bg-accent/10 rounded-xl text-accent shrink-0">
              <Target className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-accent uppercase font-bold tracking-wider">Métrica Estrela (North Star)</span>
              <h3 className="text-lg font-bold text-text-primary">Candidaturas Estratégicas esta Semana: <span className="text-accent text-xl">{strategicApplicationsWeek}</span></h3>
              <p className="text-[11px] text-text-secondary leading-normal">
                Candidaturas enviadas nos últimos 7 dias com fit técnico &ge; 75% e checklist de qualidade cumprido (&ge; 4 itens). Meta de qualidade real!
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-500/20 bg-emerald-500/5 overflow-hidden">
          <CardContent className="pt-5 pb-5 flex items-start gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 shrink-0">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider">Métrica Secundária (Freelas)</span>
              <h3 className="text-lg font-bold text-text-primary">Freelas Qualificados esta Semana: <span className="text-emerald-400 text-xl">{qualifiedFreelasWeek}</span></h3>
              <p className="text-[11px] text-text-secondary leading-normal">
                Projetos freelancers identificados nos últimos 7 dias com fit &ge; 70% e ação de proposta tomada. Caminho rápido para receita.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 text-left">
        {[
          { label: "Total Coletado", value: total, icon: Briefcase, color: "text-text-primary" },
          { label: "Novas (48h)", value: novas48h, icon: Clock, color: "text-accent" },
          { label: "Fit Médio (Aplicadas)", value: `${avgFitApplied}%`, icon: Sparkles, color: "text-emerald-500" },
          { label: "Compliance Checklist", value: `${checklistComplianceRate}%`, icon: CheckCircle2, color: "text-teal-500" },
        ].map((c) => (
          <Card key={c.label}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <c.icon className={`h-4 w-4 ${c.color}`} />
                <span className="text-xs text-text-tertiary font-medium uppercase tracking-wider">{c.label}</span>
              </div>
              <p className={`text-2xl font-bold mt-1 tabular-nums ${c.color}`}>{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Actionable Funnel Conversions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 text-left">
        {[
          { label: "Conversão: Coleta → Pipeline", value: `${discoveryToPipelineRate}%`, desc: "Percentual de vagas descobertas que foram salvas ou priorizadas", icon: Layers, color: "text-blue-500" },
          { label: "Aproveitamento: Pipeline → Aplicada", value: `${pipelineToAppliedRate}%`, desc: "Percentual de vagas em pipeline que geraram candidaturas", icon: Target, color: "text-teal-500" },
          { label: "Taxa de Resposta (Entrevistas)", value: `${responseRate}%`, desc: "Percentual de candidaturas que avançaram para entrevistas nos últimos 30 dias", icon: TrendingUp, color: "text-emerald-500" },
        ].map((c) => (
          <Card key={c.label} className="border-border/60 hover:shadow-sm transition-shadow">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-2 mb-1.5">
                <c.icon className={`h-4 w-4 ${c.color}`} />
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">{c.label}</h3>
              </div>
              <p className="text-3xl font-extrabold tabular-nums text-text-primary">{c.value}</p>
              <p className="text-xs text-text-tertiary mt-2 leading-relaxed">{c.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Split Charts: Domains & Funnel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Domain Distribution */}
        <Card>
          <CardHeader><h2 className="text-sm font-semibold text-text-primary">Distribuição por Domínio (Classificado)</h2></CardHeader>
          <CardContent>
            {domainData.length === 0 ? (
              <div className="flex items-center justify-center h-[200px] text-xs text-text-tertiary">Sem dados</div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={domainData.slice(0, 8)} layout="vertical" margin={{ left: 20 }}>
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#6e6e73" }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: "#6e6e73" }} axisLine={false} tickLine={false} width={120} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid rgba(0,0,0,0.1)", fontSize: 12 }} />
                  <Bar dataKey="value" fill={TEAL} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Funnel chart list */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text-primary">Funil de Conversão Real</h2>
              {suppressedCount > 0 && (
                <span className="text-[10px] text-amber-500 font-medium">⚠️ {suppressedCount} vagas de baixo fit / suprimidas</span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 pt-2">
              {pipelineFunnel.map((stage) => {
                const maxVal = pipelineFunnel[0].value || 1;
                const pct = (stage.value / maxVal) * 100;
                return (
                  <div key={stage.name} className="flex items-center gap-3">
                    <span className="text-xs text-text-secondary w-28 shrink-0">{stage.name}</span>
                    <div className="flex-1 h-5 rounded-lg bg-bg-elevated overflow-hidden relative border border-border/40">
                      <div className="h-full rounded-lg bg-accent/30 transition-all border-r border-accent/70" style={{ width: `${pct}%` }} />
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] text-text-secondary font-medium">
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                    <span className="text-xs text-text-primary font-semibold tabular-nums w-8 text-right shrink-0">{stage.value}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversion per Source Table */}
      <Card className="mb-8">
        <CardHeader>
          <h2 className="text-sm font-semibold text-text-primary">Aproveitamento e Qualidade das Fontes (Canais de Aquisição)</h2>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/80 text-[10px] uppercase font-semibold text-text-tertiary">
                <th className="py-2.5 px-3">Fonte</th>
                <th className="py-2.5 px-3 text-right">Vagas Coletadas</th>
                <th className="py-2.5 px-3 text-right">Alto Fit (&ge;70)</th>
                <th className="py-2.5 px-3 text-right">Pipeline</th>
                <th className="py-2.5 px-3 text-right">Aplicadas</th>
                <th className="py-2.5 px-3 text-right">Descartadas</th>
                <th className="py-2.5 px-3 text-right text-accent">Conversão (Coleta &rarr; Pipeline)</th>
              </tr>
            </thead>
            <tbody>
              {sourceStats.slice(0, 10).map((stat) => (
                <tr key={stat.source} className="border-b border-border/40 text-xs text-text-secondary hover:bg-bg-elevated/20 transition-colors">
                  <td className="py-2.5 px-3 font-medium text-text-primary">{stat.source}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums">{stat.total}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-emerald-500 font-semibold">{stat.relevant}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-blue-500">{stat.pipeline}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-teal-500 font-medium">{stat.applied}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-text-tertiary">{stat.discarded}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums font-bold text-accent">{stat.conversionRate}%</td>
                </tr>
              ))}
              {sourceStats.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-xs text-text-tertiary">Nenhum dado por fonte</td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Line charts and skills comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
        {/* Collection Timeline */}
        <Card>
          <CardHeader><h2 className="text-sm font-semibold text-text-primary">Volume de Coleta Diária (Últimos 30 Dias)</h2></CardHeader>
          <CardContent>
            {timelineData.every((d) => d.value === 0) ? (
              <div className="flex items-center justify-center h-[200px] text-xs text-text-tertiary">
                Sem dados nos últimos 30 dias
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5ea" />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#6e6e73" }} axisLine={false} tickLine={false} interval={4} />
                  <YAxis tick={{ fontSize: 10, fill: "#6e6e73" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid rgba(0,0,0,0.1)", fontSize: 12 }} />
                  <Line type="monotone" dataKey="value" stroke={TEAL} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Skills vs Demand */}
        <Card>
          <CardHeader><h2 className="text-sm font-semibold text-text-primary">Skills Desejadas vs Presença no Mercado</h2></CardHeader>
          <CardContent>
            {skillVsDemand.length === 0 ? (
              <div className="flex items-center justify-center h-[200px] text-xs text-text-tertiary">Sem dados</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={skillVsDemand} margin={{ left: -10 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#6e6e73" }} axisLine={false} tickLine={false} interval={0} angle={-25} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 10, fill: "#6e6e73" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid rgba(0,0,0,0.1)", fontSize: 12 }} />
                  <Bar dataKey="vagas" fill="#71717a" radius={[2, 2, 0, 0]} name="Mercado" />
                  <Bar dataKey="profileSkill" fill={TEAL} radius={[2, 2, 0, 0]} name="Minha skill" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Recurrent Skills Gaps */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-rose-500" />
                Gaps de Habilidades Recorrentes
              </h2>
            </div>
          </CardHeader>
          <CardContent>
            {recurrentGaps.length === 0 ? (
              <div className="flex items-center justify-center h-[200px] text-xs text-text-tertiary">
                Sem gaps recorrentes no pipeline
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={recurrentGaps} margin={{ left: -10 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#6e6e73" }} axisLine={false} tickLine={false} interval={0} angle={-25} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 10, fill: "#6e6e73" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid rgba(0,0,0,0.1)", fontSize: 12 }} />
                  <Bar dataKey="count" fill={ROSE} radius={[2, 2, 0, 0]} name="Ocorrências" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="px-6 pt-4 pb-16 max-w-6xl mx-auto">
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <BarChart3 className="h-12 w-12 text-text-tertiary mb-4" />
        <h2 className="text-lg font-semibold text-text-primary mb-2">Nenhum dado ainda</h2>
        <p className="text-sm text-text-secondary max-w-md mb-6">
          Nenhuma candidatura registrada. Comece salvando vagas no Radar ou configurando fontes automáticas.
        </p>
        <div className="flex gap-3">
          <Link href="/">
            <Button variant="primary">
              <Radar className="h-4 w-4" />
              Ir para o Radar
            </Button>
          </Link>
          <Link href="/sources">
            <Button variant="secondary">
              <Compass className="h-4 w-4" />
              Configurar fontes
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
