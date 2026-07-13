"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { JobCard } from "@/components/jobs/JobCard";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Search, Loader2, ChevronDown, ChevronUp,
  Compass, Filter,
} from "lucide-react";
import {
  locationTypeLabel, contractTypeLabel, experienceLevelLabel,
} from "@/lib/utils";
import type { JobWithStatus, ProfileData } from "@/types";

const SENIORITY_MAP: Record<string, string[]> = {
  internship: ["internship", "estagio", "estágio", "intern"],
  trainee: ["trainee"],
  junior: ["junior", "júnior", "jr", "entry", "entry-level", "jr."],
  mid: ["mid", "pleno", "middle", "intermediário", "mid-level"],
  senior: ["senior", "sênior", "sr", "senior+", "sr."],
  lead: ["lead", "staff", "principal", "tech lead", "head"],
};

const MODALITY_MAP: Record<string, string[]> = {
  remote: ["remote", "remoto", "remotely", "100% remoto"],
  hybrid: ["hybrid", "hibrido", "híbrido", "presencial+remoto"],
  onsite: ["onsite", "presencial", "on-site", "in-office"],
};

const CONTRACT_MAP: Record<string, string[]> = {
  clt: ["clt", "celetista", "efetivo", "permanente"],
  pj: ["pj", "pessoa jurídica", "contractor", "contract"],
  internship: ["internship", "estagio", "estágio", "intern", "trainee"],
  freelancer: ["freelance", "freelancer", "autônomo"],
  temporary: ["temporary", "temporário", "temp"],
  international: ["international", "internacional", "exterior"],
};

const AREAS = [
  { key: "data-science", label: "Ciência de Dados" },
  { key: "analytics", label: "Analytics/BI" },
  { key: "data-engineering", label: "Engenharia de Dados" },
  { key: "ml", label: "Machine Learning" },
  { key: "ai-engineering", label: "AI Engineering" },
  { key: "llm-dev", label: "LLM / Prompting" },
  { key: "ai-agents", label: "Agentes de IA" },
  { key: "mlops", label: "MLOps" },
  { key: "full-stack", label: "Full-Stack" },
  { key: "backend", label: "Backend" },
  { key: "frontend", label: "Frontend" },
];

const DATE_OPTIONS = [
  { key: "today", label: "Hoje" },
  { key: "3d", label: "Últimos 3 dias" },
  { key: "7d", label: "Última semana" },
  { key: "14d", label: "Últimas 2 semanas" },
];

export function ExploreClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get("q") || "");
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [selectedLocations, setSelectedLocations] = useState<string[]>(() => {
    const v = searchParams.get("modalidade");
    return v ? v.split(",") : [];
  });
  const [selectedContracts, setSelectedContracts] = useState<string[]>(() => {
    const v = searchParams.get("contrato");
    return v ? v.split(",") : [];
  });
  const [selectedLevels, setSelectedLevels] = useState<string[]>(() => {
    const v = searchParams.get("senioridade");
    return v ? v.split(",") : [];
  });
  const [selectedAreas, setSelectedAreas] = useState<string[]>(() => {
    const v = searchParams.get("area");
    return v ? v.split(",") : [];
  });
  const [selectedTechs, setSelectedTechs] = useState<string[]>(() => {
    const v = searchParams.get("stack");
    return v ? v.split(",") : [];
  });
  const [selectedDate, setSelectedDate] = useState(searchParams.get("data") || "");
  const [minScore, setMinScore] = useState(parseInt(searchParams.get("score") || "0"));
  const [internacional, setInternacional] = useState(searchParams.get("local") || "");
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "score");
  const [sortOrder, setSortOrder] = useState(searchParams.get("order") || "desc");
  const [timeoutReached, setTimeoutReached] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => setTimeoutReached(true), 4000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const p = new URLSearchParams();
    if (search) p.set("q", search);
    if (selectedLocations.length) p.set("modalidade", selectedLocations.join(","));
    if (selectedContracts.length) p.set("contrato", selectedContracts.join(","));
    if (selectedLevels.length) p.set("senioridade", selectedLevels.join(","));
    if (selectedAreas.length) p.set("area", selectedAreas.join(","));
    if (selectedTechs.length) p.set("stack", selectedTechs.join(","));
    if (selectedDate) p.set("data", selectedDate);
    if (minScore > 0) p.set("score", String(minScore));
    if (internacional) p.set("local", internacional);
    if (sortBy !== "score") p.set("sort", sortBy);
    if (sortOrder !== "desc") p.set("order", sortOrder);
    const qs = p.toString();
    router.replace(`/explore${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [search, selectedLocations, selectedContracts, selectedLevels, selectedAreas, selectedTechs, selectedDate, minScore, internacional, sortBy, sortOrder, router]);

  const { data: allJobs, isLoading } = useQuery({
    queryKey: ["explore-jobs"],
    queryFn: async () => {
      const res = await fetch("/api/jobs?limit=500");
      return res.json() as Promise<JobWithStatus[]>;
    },
    staleTime: 10000,
  });

  const { data: profile } = useQuery({
    queryKey: ["explore-profile"],
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

  const profileSkillsSet = useMemo(() => new Set(profileSkillsLower), [profileSkillsLower]);

  const allTechs = useMemo(() => {
    if (!allJobs) return [];
    const counts = new Map<string, number>();
    allJobs.forEach((j) => (j.technologies || []).forEach((t: string) => {
      counts.set(t, (counts.get(t) || 0) + 1);
    }));
    return [...counts.entries()]
      .sort((a, b) => {
        const aInProfile = profileSkillsSet.has(a[0].toLowerCase()) ? 1 : 0;
        const bInProfile = profileSkillsSet.has(b[0].toLowerCase()) ? 1 : 0;
        if (aInProfile !== bInProfile) return bInProfile - aInProfile;
        return b[1] - a[1];
      })
      .slice(0, 20)
      .map(([tech, count]) => ({ tech, count }));
  }, [allJobs, profileSkillsSet]);

  const matchesFilter = (value: string | null | undefined, filterMap: Record<string, string[]>, selectedKeys: string[]): boolean => {
    if (selectedKeys.length === 0) return true;
    if (!value) return false;
    const normalized = value.toLowerCase();
    return selectedKeys.some((key) => (filterMap[key] || [key]).some((alias) => alias === normalized));
  };

  const [nowMs] = useState(() => Date.now());

  const getCount = (value: string, key: "locationType" | "contractType" | "experienceLevel") => {
    if (!allJobs) return 0;
    return allJobs.filter((j) => j[key] === value).length;
  };

  const filtered = useMemo(() => {
    if (!allJobs) return [];
    const q = debouncedSearch.toLowerCase().trim();
    return allJobs.filter((job) => {
      if (q) {
        const text = `${job.title} ${job.company} ${job.description || ""} ${job.location || ""}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      if (!matchesFilter(job.locationType, MODALITY_MAP, selectedLocations)) return false;
      if (!matchesFilter(job.contractType, CONTRACT_MAP, selectedContracts)) return false;
      if (!matchesFilter(job.experienceLevel, SENIORITY_MAP, selectedLevels)) return false;
      if (selectedDate) {
        if (!job.postedAt) return false;
        const posted = new Date(job.postedAt).getTime();
        if (selectedDate === "today" && nowMs - posted > 86400000) return false;
        if (selectedDate === "3d" && nowMs - posted > 3 * 86400000) return false;
        if (selectedDate === "7d" && nowMs - posted > 7 * 86400000) return false;
        if (selectedDate === "14d" && nowMs - posted > 14 * 86400000) return false;
      }
      if (minScore > 0 && (job.score ?? 0) < minScore / 100) return false;

      if (selectedAreas.length > 0) {
        const t = (job.title + " " + (job.description || "")).toLowerCase();
        const areaMatch = selectedAreas.some((area) => {
          if (area === "data-science") return /data science|cientista de dados|machine learning|ml/.test(t);
          if (area === "analytics") return /analytics|analista de dados|bi |business intelligence|dashboard/.test(t);
          if (area === "data-engineering") return /engenharia de dados|data engineer|data pipeline|etl/.test(t);
          if (area === "ml") return /machine learning|ml |ai |artificial intelligence|deep learning/.test(t);
          if (area === "ai-engineering") return /ai engineer|ai developer|llm|large language model|gpt|claude|gemini|ai agent|agentic|prompt engineer|rag|vector database|langchain|llamaindex|ai-first|vibe coding|cursor|copilot|mcp|model context protocol|function calling|fine-tuning|rlhf|embeddings|semantic search/.test(t);
          if (area === "llm-dev") return /llm|large language model|gpt|claude|gemini|prompt engineer|rag|langchain|llamaindex|fine-tuning|rlhf/.test(t);
          if (area === "ai-agents") return /ai agent|agentic|function calling|mcp|model context protocol/.test(t);
          if (area === "mlops") return /mlops|ml pipeline|model deployment|model serving|feature store|model monitoring/.test(t);
          if (area === "full-stack") return /full stack|fullstack|full-stack/.test(t);
          if (area === "backend") return /backend|back end|desenvolvedor back/.test(t);
          if (area === "frontend") return /frontend|front end|front-end/.test(t);
          return false;
        });
        if (!areaMatch) return false;
      }

      if (selectedTechs.length > 0) {
        const jobTechs = (job.technologies || []).map((t: string) => t.toLowerCase());
        const hasTech = selectedTechs.some((tech) => jobTechs.includes(tech.toLowerCase()));
        if (!hasTech) return false;
      }

      if (internacional === "br") {
        const curr = job.currency || "";
        const loc = (job.location || "").toLowerCase();
        if (curr === "BRL" || loc.includes("sp") || loc.includes("rj") || loc.includes("brasil") || loc.includes("brazil") || loc.includes("são paulo") || loc.includes("rio de janeiro")) {
          return true;
        }
        return false;
      }
      if (internacional === "intl") {
        const curr = job.currency || "";
        const loc = (job.location || "").toLowerCase();
        if (curr !== "BRL" && curr !== "") return true;
        if (loc.includes("us") || loc.includes("uk") || loc.includes("worldwide") || loc.includes("global") || loc.includes("international") || loc.includes("remote worldwide")) return true;
        if (loc.includes("sp") || loc.includes("rj") || loc.includes("brasil") || loc.includes("brazil")) return false;
        if (curr === "" && !loc.includes("sp") && !loc.includes("rj") && !loc.includes("brasil")) return true;
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === "score") return sortOrder === "desc" ? (b.score ?? 0) - (a.score ?? 0) : (a.score ?? 0) - (b.score ?? 0);
      if (sortBy === "date") return sortOrder === "desc" ? new Date(b.postedAt || "").getTime() - new Date(a.postedAt || "").getTime() : new Date(a.postedAt || "").getTime() - new Date(b.postedAt || "").getTime();
      if (sortBy === "salary") return sortOrder === "desc" ? (b.salaryMax ?? 0) - (a.salaryMax ?? 0) : (a.salaryMax ?? 0) - (b.salaryMax ?? 0);
      return 0;
    });
  }, [allJobs, debouncedSearch, selectedLocations, selectedContracts, selectedLevels, selectedAreas, selectedTechs, selectedDate, minScore, internacional, sortBy, sortOrder, nowMs]);

  const toggleFilter = (arr: string[], val: string, set: (v: string[]) => void) => {
    set(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  };

  const clearFilters = () => {
    setSelectedLocations([]);
    setSelectedContracts([]);
    setSelectedLevels([]);
    setSelectedAreas([]);
    setSelectedTechs([]);
    setSelectedDate("");
    setMinScore(0);
    setInternacional("");
    setSearch("");
    setDebouncedSearch("");
  };

  const hasFilters = selectedLocations.length > 0 || selectedContracts.length > 0 || selectedLevels.length > 0 ||
    selectedAreas.length > 0 || selectedTechs.length > 0 || selectedDate || minScore > 0 || internacional;

  const activeFilterCount = [
    selectedLocations, selectedContracts, selectedLevels, selectedAreas, selectedTechs,
  ].reduce((acc, arr) => acc + arr.length, 0) + (selectedDate ? 1 : 0) + (minScore > 0 ? 1 : 0) + (internacional ? 1 : 0);

  const showEmpty = !isLoading && filtered.length === 0 && timeoutReached;
  const showNoData = !isLoading && !allJobs?.length && timeoutReached;

  const aiJobCount = useMemo(() => {
    if (!allJobs) return 0;
    return allJobs.filter((j) => (j.tags || []).some((t) => t === "ai-engineering" || t === "llm-dev")).length;
  }, [allJobs]);

  return (
    <div className="px-6 pt-4 pb-16 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Explorar</h1>
          <p className="text-sm text-text-secondary mt-1">
            {isLoading ? "Carregando..." : `${filtered.length} vagas encontradas`}
            {aiJobCount > 0 && !isLoading && <span className="ml-2 text-accent">· 🤖 {aiJobCount} IA</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setFiltersOpen(!filtersOpen)} className="gap-2">
            <Filter className="h-4 w-4" />
            Filtros
            {activeFilterCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-medium text-white">
                {activeFilterCount}
              </span>
            )}
            {filtersOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
          <Input
            placeholder="Buscar por cargo, empresa, stack..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-36">
          <option value="score">Aderência</option>
          <option value="date">Data</option>
          <option value="salary">Remuneração</option>
        </Select>
        <Button variant="ghost" size="icon" onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")} className="text-text-tertiary">
          {sortOrder === "desc" ? "↓" : "↑"}
        </Button>
      </div>

      <div className="flex gap-6">
        {filtersOpen && (
          <div className="w-64 shrink-0 space-y-5 animate-fade-in">
            <div>
              <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-2">Área</p>
              <div className="space-y-1.5">
                {AREAS.map((area) => (
                  <label key={area.key} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={selectedAreas.includes(area.key)} onChange={() => toggleFilter(selectedAreas, area.key, setSelectedAreas)} className="rounded border-text-tertiary text-accent focus:ring-accent/40 h-3.5 w-3.5" />
                    <span className="text-sm text-text-secondary">{area.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-2">Localização</p>
              <div className="flex gap-1">
                {["", "br", "intl"].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setInternacional(opt === internacional ? "" : opt)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      internacional === opt ? "bg-accent text-white" : "bg-bg-elevated text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {opt === "" ? "🌎 Ambos" : opt === "br" ? "🇧🇷 Brasil" : "🌍 Internacional"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-2">Senioridade</p>
              <div className="space-y-1.5">
                {["internship", "trainee", "junior", "mid", "senior", "lead"].map((t) => {
                  const c = getCount(t, "experienceLevel");
                  return (
                    <label key={t} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={selectedLevels.includes(t)} onChange={() => toggleFilter(selectedLevels, t, setSelectedLevels)} className="rounded border-text-tertiary text-accent focus:ring-accent/40 h-3.5 w-3.5" />
                      <span className="text-sm text-text-secondary flex-1">{experienceLevelLabel(t)}</span>
                      {c > 0 && <span className="text-[10px] text-text-tertiary tabular-nums">({c})</span>}
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-2">Modalidade</p>
              <div className="space-y-1.5">
                {["remote", "hybrid", "onsite"].map((t) => {
                  const c = getCount(t, "locationType");
                  return (
                    <label key={t} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={selectedLocations.includes(t)} onChange={() => toggleFilter(selectedLocations, t, setSelectedLocations)} className="rounded border-text-tertiary text-accent focus:ring-accent/40 h-3.5 w-3.5" />
                      <span className="text-sm text-text-secondary flex-1">{locationTypeLabel(t)}</span>
                      {c > 0 && <span className="text-[10px] text-text-tertiary tabular-nums">({c})</span>}
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-2">Contrato</p>
              <div className="space-y-1.5">
                {["clt", "pj", "internship", "freelancer", "temporary", "international"].map((t) => {
                  const c = getCount(t, "contractType");
                  return (
                    <label key={t} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={selectedContracts.includes(t)} onChange={() => toggleFilter(selectedContracts, t, setSelectedContracts)} className="rounded border-text-tertiary text-accent focus:ring-accent/40 h-3.5 w-3.5" />
                      <span className="text-sm text-text-secondary flex-1">{contractTypeLabel(t)}</span>
                      {c > 0 && <span className="text-[10px] text-text-tertiary tabular-nums">({c})</span>}
                    </label>
                  );
                })}
              </div>
            </div>

            {allTechs.length > 0 && (
              <div>
                <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-2">Stack</p>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {allTechs.map(({ tech, count }) => {
                    const isProfileMatch = profileSkillsSet.has(tech.toLowerCase());
                    return (
                      <label key={tech} className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={selectedTechs.includes(tech)} onChange={() => toggleFilter(selectedTechs, tech, setSelectedTechs)} className="rounded border-text-tertiary text-accent focus:ring-accent/40 h-3.5 w-3.5" />
                        <span className={`text-sm flex-1 ${isProfileMatch ? "text-accent font-medium" : "text-text-secondary"}`}>
                          {isProfileMatch ? "✓ " : ""}{tech}
                        </span>
                        <span className="text-[10px] text-text-tertiary tabular-nums">({count})</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-2">Data</p>
              <div className="space-y-1.5">
                {DATE_OPTIONS.map((opt) => (
                  <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="date" checked={selectedDate === opt.key} onChange={() => setSelectedDate(opt.key === selectedDate ? "" : opt.key)} className="text-accent focus:ring-accent/40 h-3.5 w-3.5" />
                    <span className="text-sm text-text-secondary">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-2">Score mínimo: {minScore}%</p>
              <input type="range" min={0} max={100} value={minScore} onChange={(e) => setMinScore(parseInt(e.target.value))} className="w-full accent-accent" />
              <div className="flex justify-between text-[10px] text-text-tertiary mt-1">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs w-full">
                Limpar todos os filtros
              </Button>
            )}
          </div>
        )}

        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-text-tertiary" />
            </div>
          ) : showNoData ? (
            <div className="rounded-xl border border-dashed p-16 text-center">
              <Compass className="h-8 w-8 mx-auto text-text-tertiary mb-3" />
              <p className="text-sm text-text-secondary">Nenhuma vaga importada ainda</p>
              <p className="text-xs text-text-tertiary mt-1 mb-4">Adicione vagas em Fontes ou aguarde a próxima coleta automática.</p>
              <Link href="/sources">
                <Button variant="primary"><Compass className="h-4 w-4" />Ir para Fontes</Button>
              </Link>
            </div>
          ) : showEmpty ? (
            <div className="rounded-xl border border-dashed p-16 text-center">
              <Search className="h-8 w-8 mx-auto text-text-tertiary mb-3" />
              <p className="text-sm text-text-secondary">Nenhuma vaga encontrada com esses filtros</p>
              <p className="text-xs text-text-tertiary mt-1">
                {selectedLevels.length > 0 && <span>• Senioridade muito restrita. </span>}
                {selectedContracts.length > 0 && <span>• Contratos muito específicos. </span>}
                {selectedLocations.length > 0 && <span>• Modalidade muito restrita. </span>}
                {internacional === "intl" && <span>• Mostrando só internacionais — há vagas nacionais. </span>}
                {internacional === "br" && <span>• Mostrando só nacionais — há vagas internacionais. </span>}
                {selectedAreas.length > 0 && <span>• Área muito específica. </span>}
                {selectedTechs.length > 0 && <span>• Stack muito específica. </span>}
                {minScore > 0 && <span>• Score mínimo alto. </span>}
              </p>
              <p className="text-[10px] text-text-tertiary mt-2">
                Se nenhuma sugestão acima resolver, tente limpar todos os filtros ou sincronizar novas vagas em Fontes.
              </p>
              {hasFilters && (
                <div className="flex gap-2 justify-center mt-3">
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Limpar filtros
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
