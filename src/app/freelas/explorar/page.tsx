"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shell } from "@/components/layout/Shell";
import { Compass, Search, Filter, X, ChevronRight, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface FP {
  id: string; title: string; platform: string; clientName: string | null;
  clientRating: number | null; budgetMin: number | null; budgetMax: number | null;
  hourlyRateMin: number | null; hourlyRateMax: number | null;
  skills: string | null; proposalsCount: number | null;
  fitScore: number | null; status: string; postedAt: string | null; collectedAt: string;
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

function getGrade(score: number | null): string {
  if (!score) return "N/A";
  if (score >= 90) return "S"; if (score >= 75) return "A";
  if (score >= 60) return "B"; if (score >= 40) return "C"; return "D";
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default function FreelanceExplorarPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState<string[]>([]);
  const [platformFilter, setPlatformFilter] = useState<string[]>([]);
  const [proposalFilter, setProposalFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("score");
  const [showFilters, setShowFilters] = useState(true);

  const { data: projects, isLoading } = useQuery({
    queryKey: ["freelance-explore"],
    queryFn: async () => {
      const res = await fetch("/api/freelance/projects?limit=200");
      const data = await res.json();
      return (data.projects || []) as FP[];
    },
  });

  const filtered = (projects || []).filter((p) => {
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (gradeFilter.length > 0 && !gradeFilter.includes(getGrade(p.fitScore))) return false;
    if (platformFilter.length > 0 && !platformFilter.includes(p.platform)) return false;
    if (proposalFilter === "low" && (p.proposalsCount ?? 999) > 5) return false;
    if (proposalFilter === "medium" && ((p.proposalsCount ?? 0) < 5 || (p.proposalsCount ?? 0) > 20)) return false;
    if (proposalFilter === "high" && (p.proposalsCount ?? 0) < 20) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === "score") return (b.fitScore ?? 0) - (a.fitScore ?? 0);
    if (sortBy === "date") return new Date(b.postedAt || b.collectedAt).getTime() - new Date(a.postedAt || a.collectedAt).getTime();
    if (sortBy === "budget") return (b.hourlyRateMax ?? b.budgetMax ?? 0) - (a.hourlyRateMax ?? a.budgetMax ?? 0);
    if (sortBy === "proposals") return (a.proposalsCount ?? 0) - (b.proposalsCount ?? 0);
    return 0;
  });

  const updateStatus = async (id: string, status: string) => {
    await fetch("/api/freelance/projects", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    queryClient.invalidateQueries({ queryKey: ["freelance-explore"] });
    toast(status === "saved" ? "Salvo" : status === "ignored" ? "Ignorado" : "Atualizado", "success");
  };

  return (
    <Shell>
    <div className="px-6 pt-4 pb-16">
      <div className="flex items-center gap-2 mb-4">
        <Compass className="h-5 w-5 text-amber-400" />
        <h1 className="text-xl font-semibold tracking-tight text-text-primary">Explorar Freelas</h1>
        <Badge variant="accent" className="text-[10px]">{filtered.length} projetos</Badge>
        <button onClick={() => setShowFilters(!showFilters)} className="ml-auto text-text-tertiary hover:text-text-primary">
          <Filter className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar projetos..."
            className="w-full pl-9 pr-3 h-9 rounded-lg bg-bg-elevated border border-border text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="h-9 rounded-lg bg-bg-elevated border border-border text-xs text-text-secondary px-3 focus:outline-none focus:border-accent"
        >
          <option value="score">Score</option>
          <option value="date">Recentes</option>
          <option value="budget">Orçamento</option>
          <option value="proposals">Menos concorrido</option>
        </select>
      </div>

      <div className="flex gap-6">
        {showFilters && (
          <div className="w-56 shrink-0 space-y-4">
            <Card>
              <CardContent className="py-3 px-4 space-y-3">
                <p className="text-xs font-medium text-text-primary">Grade de fit</p>
                {["S", "A", "B", "C", "D"].map((g) => (
                  <label key={g} className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
                    <input type="checkbox" checked={gradeFilter.includes(g)} onChange={() => setGradeFilter(gradeFilter.includes(g) ? gradeFilter.filter((x) => x !== g) : [...gradeFilter, g])} className="rounded border-border" />
                    Grade {g}
                  </label>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3 px-4 space-y-3">
                <p className="text-xs font-medium text-text-primary">Plataforma</p>
                {["upwork", "contra", "malt", "weworkremotely", "freelancer", "peopleperhour", "remoteok", "simplyhired"].map((pl) => (
                  <label key={pl} className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
                    <input type="checkbox" checked={platformFilter.includes(pl)} onChange={() => setPlatformFilter(platformFilter.includes(pl) ? platformFilter.filter((x) => x !== pl) : [...platformFilter, pl])} className="rounded border-border" />
                    {pl}
                  </label>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3 px-4 space-y-3">
                <p className="text-xs font-medium text-text-primary">Competição</p>
                {[
                  { value: "", label: "Qualquer" },
                  { value: "low", label: "< 5 propostas" },
                  { value: "medium", label: "5-20 propostas" },
                  { value: "high", label: "20+ propostas" },
                ].map((o) => (
                  <label key={o.value} className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
                    <input type="radio" name="propFilter" checked={proposalFilter === o.value} onChange={() => setProposalFilter(o.value)} className="border-border" />
                    {o.label}
                  </label>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-text-tertiary" />
            </div>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Search className="h-8 w-8 text-text-tertiary mx-auto mb-3" />
                <p className="text-sm text-text-secondary">Nenhum projeto encontrado</p>
                <p className="text-xs text-text-tertiary mt-1">Tente ajustar os filtros ou sincronizar novas fontes</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filtered.map((p) => (
                <Card key={p.id} className="hover:border-border-hover transition-colors">
                  <CardContent className="py-3 px-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <Link href={`/freelas/${p.id}`} className="block">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-text-primary truncate">{p.title}</span>
                            <Badge className={`text-[10px] ${PLATFORM_COLORS[p.platform] || ""}`}>{p.platform}</Badge>
                            {p.fitScore != null && (
                              <Badge className={`text-[10px] ${p.fitScore >= 75 ? "bg-green-500/15 text-green-400 border-green-500/30" : p.fitScore >= 50 ? "bg-yellow-500/15 text-yellow-400" : "bg-red-500/15 text-red-400"}`}>
                                {getGrade(p.fitScore)}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-text-tertiary">
                            {p.clientName && <span>{p.clientName}</span>}
                            {p.clientRating != null && <span>⭐ {p.clientRating}</span>}
                            {p.proposalsCount != null && <span>👥 {p.proposalsCount}</span>}
                            {(p.hourlyRateMin || p.budgetMin) && (
                              <span className="font-medium text-text-secondary">
                                {p.hourlyRateMin ? `$${p.hourlyRateMin}/hr` : `$${p.budgetMin}`}
                              </span>
                            )}
                            <span>{timeAgo(p.postedAt || p.collectedAt)}</span>
                          </div>
                          {p.skills && (
                            <div className="flex gap-1.5 mt-1.5 flex-wrap">
                              {JSON.parse(p.skills).slice(0, 5).map((s: string) => (
                                <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-bg-elevated text-text-tertiary">{s}</span>
                              ))}
                            </div>
                          )}
                        </Link>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => updateStatus(p.id, "saved")}
                          className="h-7 px-2 rounded text-xs text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors"
                          title="Salvar"
                        >🔖</button>
                        <button
                          onClick={() => updateStatus(p.id, "priority")}
                          className="h-7 px-2 rounded text-xs text-text-secondary hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                          title="Propor"
                        >✍️</button>
                        <button
                          onClick={() => updateStatus(p.id, "ignored")}
                          className="h-7 px-2 rounded text-xs text-text-secondary hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Ignorar"
                        >✕</button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
    </Shell>
  );
}
