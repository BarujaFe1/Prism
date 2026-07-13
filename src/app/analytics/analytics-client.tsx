"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart3, Briefcase, TrendingUp, Send, Star, Target, Layers,
  Radar, Compass, Sparkles, Loader2, User, Globe, Bot,
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

const FIT_LABELS_PT: Record<string, string> = {
  high: "Alto fit",
  good: "Bom fit",
  partial: "Fit parcial",
  low: "Baixo fit",
};

export function AnalyticsClient() {
  const [chartView, setChartView] = useState<"mercado" | "perfil">("perfil");

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

  const topTechs = useMemo(() => {
    const allEntries = [...techCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
    if (chartView === "mercado" || !profileSkillsLower.length) return allEntries;
    const profileFiltered = allEntries.filter(([tech]) => profileSkillsLower.includes(tech.toLowerCase()));
    return profileFiltered.length > 0 ? profileFiltered : allEntries;
  }, [techCount, profileSkillsLower, chartView]);

  const allProfileTechs = useMemo(() => {
    if (chartView !== "mercado" || !profileSkillsLower.length) return [];
    return [...techCount.entries()]
      .filter(([tech]) => profileSkillsLower.includes(tech.toLowerCase()))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [techCount, profileSkillsLower, chartView]);

  const skillVsDemand = useMemo(() => {
    if (!techCount || techCount.size === 0) return [];
    const mercadoAll = [...techCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
    return mercadoAll.map(([tech, count]) => {
      const inProfile = profileSkillsLower.includes(tech.toLowerCase());
      return { name: tech, vagas: count, profileSkill: inProfile ? count : 0 };
    });
  }, [techCount, profileSkillsLower]);

  if (isLoading) {
    return (
      <div className="px-6 pt-4 pb-16 max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Analytics</h1>
          <p className="text-sm text-text-secondary mt-1">Carregando métricas...</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
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
  const bySource = group(jobs, "source");
  const byLocation = group(jobs, "locationType");
  const byLevel = group(jobs, "experienceLevel");
  const byStatus = group(jobs, "status");
  const byFit = group(jobs, "fitLabel");
  const byTags = groupJobsByTags(jobs);

  const applied = jobs.filter((j) => ["applied", "reviewing", "interview", "offer"].includes(j.status)).length;
  const interviews = jobs.filter((j) => ["interview", "offer"].includes(j.status)).length;
  const offers = jobs.filter((j) => j.status === "offer").length;
  const highFit = jobs.filter((j) => j.fitLabel === "high").length;
  const responseRate = applied > 0 ? Math.round((interviews / applied) * 100) : 0;

  const aiJobs = jobs.filter((j) => {
    const tags = j.tags || [];
    const text = `${j.title} ${j.description || ""}`.toLowerCase();
    return tags.includes("ai-engineering") || tags.includes("llm-dev") ||
      /llm|gpt|claude|gemini|ai agent|prompt engineer|rag|langchain|ai engineer/i.test(text);
  });
  const aiPct = total > 0 ? Math.round((aiJobs.length / total) * 100) : 0;

  const sourceData = Object.entries(bySource).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ name: k, value: v }));
  const locationData = Object.entries(byLocation).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ name: locationTypeLabel(k) || k, value: v }));
  const levelData = Object.entries(byLevel).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ name: experienceLevelLabel(k) || k, value: v }));

  const pipelineFunnel = [
    { name: "Novas", value: jobs.filter((j) => j.status === "new").length },
    { name: "Salvas", value: jobs.filter((j) => j.status === "saved").length },
    { name: "Aplicadas", value: applied },
    { name: "Em análise", value: jobs.filter((j) => j.status === "reviewing").length },
    { name: "Entrevista", value: interviews },
    { name: "Oferta", value: offers },
  ];

  const timelineData = (() => {
    const dayMap = new Map<string, number>();
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      dayMap.set(d.toISOString().split("T")[0], 0);
    }
    jobs.forEach((j) => {
      const d = j.fetchedAt?.split("T")[0];
      if (d && dayMap.has(d)) dayMap.set(d, (dayMap.get(d) || 0) + 1);
    });
    return [...dayMap.entries()].map(([date, count]) => ({
      date: date.slice(5),
      value: count,
    }));
  })();

  const now = new Date();
  const estaSemana = jobs.filter((j) => {
    const d = new Date(j.fetchedAt);
    return now.getTime() - d.getTime() < 7 * 86400000;
  }).length;

  const avgScore = jobs.reduce((acc, j) => acc + (j.score || 0), 0) / Math.max(total, 1);

  return (
    <div className="px-6 pt-4 pb-16 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Analytics</h1>
        <p className="text-sm text-text-secondary mt-1">
          Métricas e distribuição das vagas
          <span className="ml-2 text-text-tertiary">· {estaSemana} novas esta semana</span>
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
        {[
          { label: "Total de vagas", value: total, icon: Briefcase, color: "text-accent" },
          { label: "Alto fit", value: highFit, icon: Sparkles, color: "text-emerald-500" },
          { label: "Candidaturas", value: applied, icon: Send, color: "text-blue-500" },
          { label: "Taxa de resposta", value: `${responseRate}%`, icon: TrendingUp, color: responseRate > 20 ? "text-emerald-500" : "text-amber-500" },
        ].map((c) => (
          <Card key={c.label}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <c.icon className={`h-4 w-4 ${c.color}`} />
                <span className="text-xs text-text-tertiary font-medium uppercase tracking-wider">{c.label}</span>
              </div>
              <p className={`text-xl font-semibold tabular-nums ${c.color}`}>{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader><h2 className="text-sm font-semibold text-text-primary">Vagas por fonte</h2></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={sourceData} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" tick={{ fontSize: 11, fill: "#6e6e73" }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#6e6e73" }} axisLine={false} tickLine={false} width={80} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e5ea", fontSize: 12 }} />
                <Bar dataKey="value" fill={TEAL} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h2 className="text-sm font-semibold text-text-primary">Vagas por modalidade</h2></CardHeader>
          <CardContent className="flex justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={locationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {locationData.map((_, idx) => <Cell key={idx} fill={COLORS_PIE[idx % COLORS_PIE.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e5ea", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader><h2 className="text-sm font-semibold text-text-primary">Vagas por nível</h2></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={levelData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6e6e73" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#6e6e73" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e5ea", fontSize: 12 }} />
                <Bar dataKey="value" fill={TEAL} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h2 className="text-sm font-semibold text-text-primary">Funil de candidaturas</h2></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pipelineFunnel.map((stage) => {
                const maxVal = pipelineFunnel[0].value || 1;
                const pct = (stage.value / maxVal) * 100;
                return (
                  <div key={stage.name} className="flex items-center gap-3">
                    <span className="text-xs text-text-secondary w-24">{stage.name}</span>
                    <div className="flex-1 h-6 rounded-lg bg-bg-elevated overflow-hidden relative">
                      <div className="h-full rounded-lg bg-accent/70 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-text-tertiary tabular-nums w-6 text-right">{stage.value}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text-primary">Vagas coletadas (últimos 30 dias)</h2>
            </div>
          </CardHeader>
          <CardContent>
            {timelineData.every((d) => d.value === 0) ? (
              <div className="flex items-center justify-center h-[200px] text-xs text-text-tertiary">
                Sem dados de coleta nos últimos 30 dias
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5ea" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#6e6e73" }} axisLine={false} tickLine={false} interval={4} />
                  <YAxis tick={{ fontSize: 11, fill: "#6e6e73" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e5ea", fontSize: 12 }} />
                  <Line type="monotone" dataKey="value" stroke={TEAL} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text-primary">Top tecnologias</h2>
              <div className="flex gap-1">
                <button
                  onClick={() => setChartView("perfil")}
                  className={`text-[10px] px-2 py-0.5 rounded ${chartView === "perfil" ? "bg-accent text-white" : "bg-bg-elevated text-text-tertiary"}`}
                >
                  <User className="h-2.5 w-2.5 inline mr-0.5" />
                  Meu perfil
                </button>
                <button
                  onClick={() => setChartView("mercado")}
                  className={`text-[10px] px-2 py-0.5 rounded ${chartView === "mercado" ? "bg-accent text-white" : "bg-bg-elevated text-text-tertiary"}`}
                >
                  <Globe className="h-2.5 w-2.5 inline mr-0.5" />
                  Mercado
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topTechs.length === 0 ? (
                <p className="text-xs text-text-tertiary text-center py-4">Nenhuma tecnologia encontrada</p>
              ) : (
                topTechs.map(([tech, count]) => {
                  const maxCount = topTechs[0]?.[1] || 1;
                  const isProfileMatch = profileSkillsLower.includes(tech.toLowerCase());
                  return (
                    <div key={tech} className="flex items-center gap-3">
                      <span className={`text-xs w-28 truncate ${isProfileMatch ? "text-accent font-medium" : "text-text-secondary"}`}>
                        {isProfileMatch ? "✓ " : ""}{tech}
                      </span>
                      <div className="flex-1 h-2 rounded-full bg-bg-elevated overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${isProfileMatch ? "bg-accent" : "bg-text-tertiary/50"}`}
                          style={{ width: `${(count / maxCount) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-text-tertiary tabular-nums w-6 text-right">{count}</span>
                    </div>
                  );
                })
              )}
              {allProfileTechs.length > 0 && chartView === "mercado" && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-[10px] text-text-tertiary mb-1.5">Minhas skills no mercado:</p>
                  <div className="flex flex-wrap gap-1">
                    {allProfileTechs.map(([tech]) => (
                      <Badge key={tech} variant="accent" className="text-[10px]">{tech}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader><h2 className="text-sm font-semibold text-text-primary">Demanda vs Suas skills</h2></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={skillVsDemand} margin={{ left: -10 }}>
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#6e6e73" }} axisLine={false} tickLine={false} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11, fill: "#6e6e73" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e5ea", fontSize: 12 }} />
                <Bar dataKey="vagas" fill="#6e6e73" radius={[2, 2, 0, 0]} name="Mercado" />
                <Bar dataKey="profileSkill" fill={TEAL} radius={[2, 2, 0, 0]} name="Sua skill" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Bot className="h-4 w-4 text-text-tertiary" />
              Vagas de IA
            </h2>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-2xl font-semibold tabular-nums text-accent">{aiJobs.length}</p>
                <p className="text-xs text-text-tertiary">vagas relacionadas a IA</p>
              </div>
              <div className="flex-1">
                <p className="text-2xl font-semibold tabular-nums text-emerald-500">{aiPct}%</p>
                <p className="text-xs text-text-tertiary">do total de vagas</p>
              </div>
            </div>
            {aiJobs.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-[10px] text-text-tertiary mb-1.5">Exemplos:</p>
                <div className="space-y-1">
                  {aiJobs.slice(0, 3).map((j) => (
                    <p key={j.id} className="text-xs text-text-secondary truncate">{j.title}</p>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader><h2 className="text-sm font-semibold text-text-primary">Por senioridade</h2></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(byLevel).sort((a, b) => b[1] - a[1]).map(([key, count]) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-xs text-text-secondary w-24">{experienceLevelLabel(key) || key}</span>
                  <div className="flex-1 h-2 rounded-full bg-bg-elevated overflow-hidden">
                    <div className="h-full rounded-full bg-teal-400/70 transition-all" style={{ width: `${(count / total) * 100}%` }} />
                  </div>
                  <span className="text-xs text-text-tertiary tabular-nums w-8 text-right">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h2 className="text-sm font-semibold text-text-primary">Score médio: {(avgScore * 100).toFixed(0)}%</h2></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(byFit).sort((a, b) => b[1] - a[1]).map(([key, count]) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-xs text-text-secondary w-24">{FIT_LABELS_PT[key] || key || "sem fit"}</span>
                  <div className="flex-1 h-2 rounded-full bg-bg-elevated overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${(count / total) * 100}%`, backgroundColor: key === "high" ? "#10b981" : key === "good" ? "#3b82f6" : key === "partial" ? "#f59e0b" : "#a1a1a6" }}
                    />
                  </div>
                  <span className="text-xs text-text-tertiary tabular-nums w-8 text-right">{count}</span>
                </div>
              ))}
            </div>
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

function group(items: JobWithStatus[], key: keyof JobWithStatus): Record<string, number> {
  const result: Record<string, number> = {};
  items.forEach((item) => {
    const k = String(item[key] ?? "unknown");
    result[k] = (result[k] || 0) + 1;
  });
  return result;
}

function groupJobsByTags(jobs: JobWithStatus[]): Record<string, number> {
  const result: Record<string, number> = {};
  jobs.forEach((j) => {
    (j.tags || []).forEach((t) => {
      result[t] = (result[t] || 0) + 1;
    });
  });
  return result;
}
