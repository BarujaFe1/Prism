"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import Link from "next/link";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, TrendingUp, Zap, RefreshCw, Loader2, ChevronRight } from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface FreelanceProject {
  id: string;
  title: string;
  platform: string;
  clientName: string | null;
  clientRating: number | null;
  budgetMin: number | null;
  budgetMax: number | null;
  budgetCurrency: string | null;
  hourlyRateMin: number | null;
  hourlyRateMax: number | null;
  skills: string | null;
  proposalsCount: number | null;
  fitScore: number | null;
  status: string;
  postedAt: string | null;
  collectedAt: string;
}

interface Stats {
  totalProjects: number;
  byPlatform: Record<string, number>;
  opportunityWindows: number;
}

const PLATFORM_COLORS: Record<string, string> = {
  upwork: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  contra: "bg-violet-500/10 text-violet-400 border-violet-500/30",
  malt: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  weworkremotely: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  freelancer: "bg-rose-500/10 text-rose-400 border-rose-500/30",
  peopleperhour: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
  remoteok: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  simplyhired: "bg-blue-500/10 text-blue-400 border-blue-500/30",
};

const GRADE_COLORS: Record<string, string> = {
  S: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  A: "bg-green-500/15 text-green-400 border-green-500/30",
  B: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  C: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  D: "bg-red-500/15 text-red-400 border-red-500/30",
};

function getGrade(score: number | null): string {
  if (!score) return "N/A";
  if (score >= 90) return "S";
  if (score >= 75) return "A";
  if (score >= 60) return "B";
  if (score >= 40) return "C";
  return "D";
}

function getGradeColor(score: number | null): string {
  return GRADE_COLORS[getGrade(score)] || "";
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function formatRate(p: FreelanceProject): string {
  if (p.hourlyRateMin) return `$${p.hourlyRateMin}/hr`;
  if (p.budgetMin) return `$${p.budgetMin}`;
  return "";
}


export default function FreelanceRadarPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["freelance-radar"],
    queryFn: async () => {
      const [projectsRes, statsRes] = await Promise.all([
        fetch("/api/freelance/projects?limit=50&status=new"),
        fetch("/api/freelance/sync"),
      ]);
      const projects = await projectsRes.json();
      const stats = await statsRes.json();
      return { projects: projects.projects || [], stats: stats as Stats };
    },
    refetchInterval: 60000,
  });

  const quickAction = async (id: string, status: string) => {
    try {
      await fetch("/api/freelance/projects", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      queryClient.invalidateQueries({ queryKey: ["freelance-radar"] });
      toast(status === "saved" ? "💾 Projeto salvo" : status === "priority" ? "✍️ Marcado para propor" : "🗑️ Ignorado", "success");
    } catch {
      toast("Erro ao atualizar", "error");
    }
  };

  const syncAll = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/freelance/sync", { method: "POST" });
      const data = await res.json();
      const totalNew = Object.values(data.results || {}).reduce((a: any, r: any) => a + (r?.new || 0), 0);
      toast(`Sincronização concluída — ${totalNew} novos projetos`, "success");
      queryClient.invalidateQueries({ queryKey: ["freelance-radar"] });
    } catch {
      toast("Erro ao sincronizar", "error");
    }
    setSyncing(false);
  };

  const projects = data?.projects || [];
  const stats = data?.stats || { totalProjects: 0, byPlatform: {}, opportunityWindows: 0 };
  const opportunities = projects.filter((p: FreelanceProject) => (p.proposalsCount ?? 999) <= 5 && (p.fitScore ?? 0) >= 75);
  const highFit = projects.filter((p: FreelanceProject) => (p.fitScore ?? 0) >= 75);

  return (
    <Shell>
    <div className="px-6 pt-4 pb-16 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-amber-400" />
            <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Freelas</h1>
            {stats.opportunityWindows > 0 && (
              <Badge variant="accent" className="bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse">
                {stats.opportunityWindows} janelas abertas
              </Badge>
            )}
            {stats.opportunityWindows === 0 && stats.totalProjects > 0 && (
              <Badge variant="accent" className="bg-text-tertiary/10 text-text-tertiary border-border">
                Nenhuma janela no momento
              </Badge>
            )}
          </div>
          <p className="text-sm text-text-secondary mt-1">Projetos e contratos para trabalho independente</p>
        </div>
        <div className="flex gap-2">
          <Link href="/freelas/explorar" className="inline-flex items-center justify-center rounded-lg text-xs font-medium h-8 px-3 gap-1.5 bg-bg-elevated text-text-primary hover:bg-border transition-all duration-200">Explorar</Link>
          <Button variant="primary" size="sm" onClick={syncAll} disabled={syncing}>
            {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {syncing ? "Buscando..." : "Sincronizar"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        <Card>
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-3 w-3 text-text-tertiary" />
              <p className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider">Recentes (48h)</p>
            </div>
            <p className="text-xl font-semibold text-text-primary">{projects.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-3 w-3 text-green-400" />
              <p className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider">Alto fit (A/S)</p>
            </div>
            <p className="text-xl font-semibold text-green-400">{highFit.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <Briefcase className="h-3 w-3 text-amber-400" />
              <p className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider">Janelas Abertas</p>
            </div>
            <p className="text-xl font-semibold text-amber-400">{opportunities.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <RefreshCw className="h-3 w-3 text-text-tertiary" />
              <p className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider">Total Coletado</p>
            </div>
            <p className="text-xl font-semibold text-text-primary">{stats.totalProjects}</p>
          </CardContent>
        </Card>
      </div>

      {opportunities.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-400" /> Janelas de Oportunidade
          </h2>
          <div className="space-y-2">
            {opportunities.slice(0, 5).map((p: FreelanceProject) => (
              <Card key={p.id} className="border-amber-500/30 hover:border-amber-500/50 transition-colors">
                <CardContent className="py-3 px-4">
                  <div className="flex items-start justify-between gap-3">
                    <Link href={`/freelas/${p.id}`} className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-text-primary truncate">{p.title}</span>
                        <Badge className={`text-[10px] ${PLATFORM_COLORS[p.platform] || ""}`}>{p.platform}</Badge>
                        <Badge className={`text-[10px] ${getGradeColor(p.fitScore)}`}>{getGrade(p.fitScore)}</Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-text-tertiary">
                        {p.clientName && <span>{p.clientName}</span>}
                        {p.proposalsCount != null && <span>👥 {p.proposalsCount} propostas</span>}
                        {formatRate(p) && <span>{formatRate(p)}</span>}
                        <span>{timeAgo(p.collectedAt)}</span>
                      </div>
                    </Link>
                    <div className="flex gap-1 shrink-0 pt-1">
                      <button className="h-6 w-6 rounded flex items-center justify-center text-xs text-text-secondary hover:text-amber-400 hover:bg-amber-500/10 transition-colors" title="Propor agora" onClick={(e) => { e.preventDefault(); quickAction(p.id, "priority"); }}>✍️</button>
                      <button className="h-6 w-6 rounded flex items-center justify-center text-xs text-text-secondary hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Ignorar" onClick={(e) => { e.preventDefault(); quickAction(p.id, "ignored"); }}>✕</button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <h2 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-text-secondary" /> Projetos Recentes
      </h2>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-text-tertiary" />
        </div>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Briefcase className="h-8 w-8 text-text-tertiary mx-auto mb-3" />
            <p className="text-sm text-text-secondary">Nenhum projeto encontrado</p>
            <p className="text-xs text-text-tertiary mt-1">Sincronize as fontes de freelas para começar</p>
            <Button variant="primary" size="sm" className="mt-4" onClick={syncAll} disabled={syncing}>
              Sincronizar agora
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {projects.slice(0, 20).map((p: FreelanceProject) => (
            <Card key={p.id} className="hover:border-border-hover transition-colors">
              <CardContent className="py-3 px-4">
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/freelas/${p.id}`} className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-primary truncate">{p.title}</span>
                      <Badge className={`text-[10px] ${PLATFORM_COLORS[p.platform] || ""}`}>{p.platform}</Badge>
                      {p.fitScore != null && (
                        <Badge className={`text-[10px] ${getGradeColor(p.fitScore)}`}>{getGrade(p.fitScore)}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-text-tertiary">
                      {p.clientName && <span>{p.clientName}</span>}
                      {p.clientRating != null && <span>⭐ {p.clientRating}</span>}
                      {p.proposalsCount != null && <span>👥 {p.proposalsCount}</span>}
                      {formatRate(p) && <span className="font-medium text-text-secondary">{formatRate(p)}</span>}
                      <span>{timeAgo(p.postedAt || p.collectedAt)}</span>
                    </div>
                    {p.skills && (
                      <div className="flex gap-1.5 mt-1.5 flex-wrap">
                        {JSON.parse(p.skills).slice(0, 4).map((s: string) => (
                          <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-bg-elevated text-text-tertiary">{s}</span>
                        ))}
                      </div>
                    )}
                    {p.fitScore != null && (
                      <div className="mt-2 h-1 w-full bg-bg-elevated rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${p.fitScore >= 75 ? "bg-green-400" : p.fitScore >= 50 ? "bg-amber-400" : "bg-red-400"}`} style={{ width: `${p.fitScore}%` }} />
                      </div>
                    )}
                  </Link>
                  <div className="flex gap-1 shrink-0 pt-1">
                    <button className="h-6 w-6 rounded flex items-center justify-center text-xs text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors" title="Salvar" onClick={(e) => { e.preventDefault(); quickAction(p.id, "saved"); }}>🔖</button>
                    <button className="h-6 w-6 rounded flex items-center justify-center text-xs text-text-secondary hover:text-amber-400 hover:bg-amber-500/10 transition-colors" title="Propor" onClick={(e) => { e.preventDefault(); quickAction(p.id, "priority"); }}>✍️</button>
                    <button className="h-6 w-6 rounded flex items-center justify-center text-xs text-text-secondary hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Ignorar" onClick={(e) => { e.preventDefault(); quickAction(p.id, "ignored"); }}>✕</button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex justify-center mt-6">
        <Link href="/freelas/explorar" className="inline-flex items-center justify-center rounded-lg text-xs font-medium h-8 px-3 gap-1.5 bg-bg-elevated text-text-primary hover:bg-border transition-all duration-200">
          Ver todos os projetos <ChevronRight className="h-3 w-3 ml-1" />
        </Link>
      </div>
    </div>
    </Shell>
  );
}
