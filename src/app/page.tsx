"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Shell } from "@/components/layout/Shell";
import { RadarList } from "./radar-list";
import { Loader2, Compass, RefreshCw, User, Bell, Calendar, AlertTriangle, Sparkles, Send, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { JobWithStatus, SettingsData, ProfileData } from "@/types";
import { locationTypeLabel, experienceLevelLabel, timeAgo } from "@/lib/utils";
import { selectTopOpportunities } from "@/lib/focus/daily-actions";

const MODALIDADE_FILTERS = ["remote", "hybrid", "onsite"];
const SENIORITY_FILTERS = ["internship", "trainee", "junior", "mid", "senior", "lead"];

const PROJECT_SUGGESTIONS: Record<string, string> = {
  sql: "Prism, OpsLedger ou SignalHub",
  postgresql: "Maestro (Supabase)",
  python: "DataFlow, OpsLedger ou SignalHub",
  "data quality": "DataFlow",
  pandas: "DataFlow ou OpsLedger",
  fastapi: "DataFlow, OpsLedger ou SignalHub",
  "next.js": "Prism, DataFlow ou OpsLedger",
  nextjs: "Prism, DataFlow ou OpsLedger",
  react: "Prism ou DataFlow",
  typescript: "Prism, DataFlow ou LançaEnsaio",
  "node.js": "Prism",
  nodejs: "Prism",
  "react native": "Maestro ou LançaEnsaio",
  expo: "Maestro ou LançaEnsaio",
  supabase: "Maestro ou LançaEnsaio",
  sqlite: "Prism ou OpsLedger",
  drizzle: "Prism",
  etl: "DataFlow",
  automação: "LançaEnsaio ou SignalHub",
  "github actions": "Prism (meta de CI completa)",
};

const BR_CATEGORIES = [
  { id: "novas_p0", label: "Novas P0", icon: "🔥" },
  { id: "estagio_junior", label: "Estágio / Júnior", icon: "🎓" },
  { id: "dev", label: "Vertente Dev", icon: "🧩" },
  { id: "dados", label: "Vertente Dados", icon: "📊" },
  { id: "fullstack", label: "Full-Stack / Product", icon: "💻" },
  { id: "frontend", label: "Frontend React/Next", icon: "🖥️" },
  { id: "backend", label: "Backend / APIs", icon: "⚙️" },
  { id: "fintechs", label: "Fintechs e Bancos", icon: "💳" },
  { id: "saas", label: "SaaS / Softwares", icon: "🌐" },
  { id: "ecommerce", label: "E-commerce", icon: "🛒" },
  { id: "logistica", label: "Logística / Mobilidade", icon: "🚚" },
  { id: "startups", label: "Startups / Scale-ups", icon: "🚀" },
  { id: "oficiais", label: "Fontes Oficiais", icon: "💼" },
  { id: "hoje", label: "Aplicar Hoje", icon: "✨" },
];

export default function RadarPage() {
  const [modalidadeFilters, setModalidadeFilters] = useState<string[]>([]);
  const [seniorityFilters, setSeniorityFilters] = useState<string[]>([]);
  const [searchFocus, setSearchFocus] = useState<string>("");

  const applyInternshipFocus = () => {
    setModalidadeFilters(["remote", "hybrid"]);
    setSeniorityFilters(["internship", "junior", "trainee"]);
    setSearchFocus("");
  };

  const applyDevFocus = () => {
    setModalidadeFilters(["remote", "hybrid"]);
    setSeniorityFilters(["internship", "junior"]);
    setSearchFocus(
      "full stack|fullstack|product engineer|software engineer|desenvolvedor|frontend|front-end|backend|back-end|next.js|typescript|react"
    );
  };

  const applyFullStackFocus = () => {
    setModalidadeFilters(["remote", "hybrid"]);
    setSeniorityFilters(["internship", "junior"]);
    setSearchFocus("full stack|fullstack|product engineer|next.js|typescript");
  };

  const applyFrontendFocus = () => {
    setModalidadeFilters(["remote", "hybrid"]);
    setSeniorityFilters(["internship", "junior"]);
    setSearchFocus("frontend|front-end|react|next.js");
  };

  const applyDataFocus = () => {
    setModalidadeFilters(["remote", "hybrid"]);
    setSeniorityFilters(["internship", "junior", "trainee"]);
    setSearchFocus(
      "data analyst|analista de dados|analytics|qualidade de dados|etl|estatística|estatistica|ciência de dados|cientista de dados|business intelligence|bi "
    );
  };

  const clearFocusPresets = () => {
    setModalidadeFilters([]);
    setSeniorityFilters([]);
    setSearchFocus("");
  };

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

  const { data: profile } = useQuery<ProfileData>({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await fetch("/api/profile");
      return res.json();
    },
    staleTime: 30000,
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

  const topThreeJobs = useMemo(() => {
    if (!allJobs) return [];
    return selectTopOpportunities(allJobs, 3);
  }, [allJobs]);

  const topThreeIds = useMemo(() => new Set(topThreeJobs.map(j => j.id)), [topThreeJobs]);

  const filteredNewJobs = useMemo(() => {
    if (!allJobs) return [];
    return allJobs.filter((j) => {
      if (j.status !== "new") return false;
      if (topThreeIds.has(j.id)) return false;

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
      if (searchFocus) {
        const hay = `${j.title} ${j.company} ${(j.technologies || []).join(" ")} ${j.description || ""}`.toLowerCase();
        const parts = searchFocus.toLowerCase().split("|").map((p) => p.trim()).filter(Boolean);
        if (parts.length && !parts.some((p) => hay.includes(p))) return false;
      }
      return true;
    });
  }, [allJobs, modalidadeFilters, seniorityFilters, topThreeIds, searchFocus]);

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

  // Load target companies for sector / priority lookup
  const { data: targetCompanies } = useQuery<any[]>({
    queryKey: ["target-companies"],
    queryFn: async () => {
      const res = await fetch("/api/companies");
      return res.json();
    },
    staleTime: 60000,
  });

  const companyMap = useMemo(() => {
    const map = new Map<string, any>();
    if (!targetCompanies) return map;
    targetCompanies.forEach((c) => {
      map.set(c.name.toLowerCase(), c);
      map.set(c.normalizedName, c);
    });
    return map;
  }, [targetCompanies]);

  const [selectedBrCategory, setSelectedBrCategory] = useState("novas_p0");

  const brCategoryJobs = useMemo(() => {
    const categories: Record<string, JobWithStatus[]> = {
      novas_p0: [],
      estagio_junior: [],
      dev: [],
      dados: [],
      fullstack: [],
      frontend: [],
      backend: [],
      fintechs: [],
      saas: [],
      ecommerce: [],
      logistica: [],
      startups: [],
      oficiais: [],
      hoje: [],
    };

    if (!allJobs) return categories;

    const fortyEightHoursAgo = Date.now() - 48 * 60 * 60 * 1000;

    allJobs.forEach((j) => {
      if (topThreeIds.has(j.id)) return; // Exclude Top 3 recommendations from categories
      let details: any = {};
      try {
        details = typeof j.scoreDetails === "string" ? JSON.parse(j.scoreDetails) : j.scoreDetails || {};
      } catch {}
      
      // Hide suppressed / low-fit jobs
      if (details?.scoreLabel === "Fora do foco" || (j.score ?? 0) <= 0.30) {
        return;
      }

      const comp = companyMap.get(j.company.toLowerCase());

      // 1. Novas P0
      const collected = j.fetchedAt ? new Date(j.fetchedAt).getTime() : 0;
      const isRecent = collected > fortyEightHoursAgo;
      if (j.status === "new" && isRecent && comp?.priority === "P0") {
        categories.novas_p0.push(j);
      }

      // 2. Estágio / Júnior
      const titleLower = j.title.toLowerCase();
      const isJuniorOrIntern =
        j.contractType === "internship" ||
        j.experienceLevel === "internship" ||
        j.experienceLevel === "trainee" ||
        j.experienceLevel === "junior" ||
        titleLower.includes("estagio") ||
        titleLower.includes("estágio") ||
        titleLower.includes("estagiário") ||
        titleLower.includes("junior") ||
        titleLower.includes("júnior") ||
        titleLower.includes("trainee") ||
        titleLower.includes("intern");
      if (j.status === "new" && isJuniorOrIntern) {
        categories.estagio_junior.push(j);
      }

      const techHay = `${titleLower} ${(j.technologies || []).join(" ").toLowerCase()} ${(j.description || "").toLowerCase()}`;
      const vertical =
        details?.vertical === "dev" || details?.vertical === "dados"
          ? details.vertical
          : null;

      if (j.status === "new" && (vertical === "dev" || (!vertical && /full[\s-]?stack|product engineer|software engineer|desenvolvedor|developer|front[\s-]?end|back[\s-]?end|next\.?js|typescript|react|node/.test(techHay) && !/data analyst|analista de dados|cientista de dados|estat[ií]stic/.test(techHay)))) {
        categories.dev.push(j);
      }
      if (
        j.status === "new" &&
        /full[\s-]?stack|product engineer|engenheiro de produto|next\.?js|typescript/.test(techHay)
      ) {
        categories.fullstack.push(j);
      }
      if (
        j.status === "new" &&
        /front[\s-]?end|react|ui engineer|interface/.test(techHay) &&
        !/back[\s-]?end only/.test(techHay)
      ) {
        categories.frontend.push(j);
      }
      if (
        j.status === "new" &&
        /back[\s-]?end|node\.?js|api|fastapi|postgresql|sql/.test(techHay)
      ) {
        categories.backend.push(j);
      }
      if (
        j.status === "new" &&
        (vertical === "dados" ||
          /data analyst|analista de dados|analytics|ciência de dados|cientista de dados|etl|pandas|bi\b|estat[ií]stic|qualidade de dados|business intelligence/.test(
            techHay
          ))
      ) {
        categories.dados.push(j);
      }

      // 3. Fintechs
      if (j.status === "new" && comp?.sector === "Fintech, bancos, crédito e pagamentos") {
        categories.fintechs.push(j);
      }

      // 4. SaaS
      if (j.status === "new" && comp?.sector === "Software, SaaS, dados e consultorias brasileiras") {
        categories.saas.push(j);
      }

      // 5. E-commerce
      if (j.status === "new" && comp?.sector === "Varejo, e-commerce, marketplaces e consumer tech") {
        categories.ecommerce.push(j);
      }

      // 6. Logística
      if (j.status === "new" && comp?.sector === "Logística, mobilidade, transporte e delivery") {
        categories.logistica.push(j);
      }

      // 7. Startups
      if (j.status === "new" && comp?.sector === "Startups e scale-ups") {
        categories.startups.push(j);
      }

      // 8. Fontes Oficiais
      const isOfficialSource = ["greenhouse", "lever", "ashby", "gupy", "jobposting"].includes(j.source.toLowerCase());
      if (j.status === "new" && isOfficialSource) {
        categories.oficiais.push(j);
      }

      // 9. Aplicar Hoje
      const isHighFit = j.fitLabel === "high" || (j.score ?? 0) >= 0.75;
      if (isHighFit && ["new", "saved"].includes(j.status)) {
        categories.hoje.push(j);
      }
    });

    // Sort all buckets by score descending
    Object.keys(categories).forEach((k) => {
      categories[k].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    });

    return categories;
  }, [allJobs, companyMap, topThreeIds]);

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

        {/* Planos + presets de foco para a busca pessoal */}
        <div className="mb-6 rounded-xl border border-border bg-bg p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div>
              <p className="text-sm font-semibold text-text-primary">Duas vertentes · esforço igual</p>
              <p className="text-xs text-text-tertiary">
                Dev (software) e Dados (analista · USP) separados — planos no{" "}
                <Link href="/profile#application-plans-card" className="text-accent underline">
                  perfil
                </Link>
                {" · "}
                <Link href="/today" className="text-accent underline">
                  Hoje
                </Link>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="primary" onClick={applyDevFocus} className="text-xs">
                Vertente Dev
              </Button>
              <Button size="sm" variant="primary" onClick={applyDataFocus} className="text-xs">
                Vertente Dados
              </Button>
              <Button size="sm" variant="secondary" onClick={applyInternshipFocus} className="text-xs">
                Estágio / Júnior
              </Button>
              <Button size="sm" variant="ghost" onClick={applyFullStackFocus} className="text-xs">
                Só Full-Stack
              </Button>
              <Button size="sm" variant="ghost" onClick={applyFrontendFocus} className="text-xs">
                Só Frontend
              </Button>
              <Button size="sm" variant="ghost" onClick={clearFocusPresets} className="text-xs">
                Limpar
              </Button>
            </div>
          </div>
          {Array.isArray((profile as { applicationPlans?: unknown })?.applicationPlans) &&
            ((profile as { applicationPlans: { id: string; title: string; weeklyTarget: number; active: boolean }[] })
              .applicationPlans || []
            ).filter((p) => p.active).length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                {(
                  profile as {
                    applicationPlans: {
                      id: string;
                      title: string;
                      weeklyTarget: number;
                      roleFocus?: string[];
                      active: boolean;
                    }[];
                  }
                ).applicationPlans
                  .filter((p) => p.active)
                  .map((plan) => (
                    <div
                      key={plan.id}
                      className="rounded-lg border border-border/70 bg-bg-elevated/20 px-3 py-2 text-left"
                    >
                      <p className="text-[11px] font-semibold text-text-primary line-clamp-2">{plan.title}</p>
                      <p className="text-[10px] text-text-tertiary mt-1">
                        Meta {plan.weeklyTarget}/sem · {(plan.roleFocus || []).slice(0, 2).join(", ")}
                      </p>
                    </div>
                  ))}
              </div>
            )}
        </div>

        {/* Urgent follow-ups warning if any exist */}
        {briefing?.followUpsOverdue && briefing.followUpsOverdue.length > 0 && (
          <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 animate-bounce" />
              <div className="text-xs">
                <span className="font-semibold">{briefing.followUpsOverdue.length} follow-ups pendentes há mais de 5 dias!</span>
                <span className="ml-2 opacity-80">Não deixe contatos esfriarem. Entre em contato hoje.</span>
              </div>
            </div>
            <Link href="/pipeline">
              <Button size="sm" variant="ghost" className="text-xs hover:bg-amber-500/20 text-amber-400">
                Ver Pipeline <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </div>
        )}

        {/* Top 3 do dia */}
        {topThreeJobs.length > 0 ? (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-4 w-4 text-accent animate-pulse" />
              <h2 className="text-sm font-semibold text-text-primary">3 Ações Recomendadas para Hoje</h2>
              <span className="text-xs text-text-tertiary">· Vagas de alto aproveitamento calibradas para você</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topThreeJobs.map((j) => {
                let details: any = {};
                try {
                  details = typeof j.scoreDetails === "string" ? JSON.parse(j.scoreDetails) : j.scoreDetails || {};
                } catch {}
                const warning = details.warnings?.[0] || details.penalties?.[0];
                const decision = details.scoreLabel || "Revisar";
                const isHigh = (j.score ?? 0) >= 0.75;
                const scoreColor = isHigh ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" : "text-amber-400 border-amber-500/20 bg-amber-500/5";

                const matchedWithEvidence = details.matchedEvidences || [];
                const missingGaps = details.missingGaps || [];
                const profileSkills = profile?.skills || [];
                const hasProjects = profile?.skillsEvidence && profile.skillsEvidence.length > 0;
                
                const matchedWithoutEvidence = (j.technologies || []).filter((t: string) => 
                  profileSkills.some((ps: string) => ps.toLowerCase().trim() === t.toLowerCase().trim()) &&
                  !matchedWithEvidence.some((me: string) => me.toLowerCase().trim() === t.toLowerCase().trim())
                );

                let evidenceText = "";
                let evidenceLink = "/profile#evidence-matrix-card";
                let gapText = "";
                let gapLink = "/profile#learning-backlog-card";

                if (!hasProjects) {
                  evidenceText = "Cadastre DataFlow como evidência de Python/Data Quality para ativar este match.";
                  evidenceLink = "/profile?preselect=Python#evidence-matrix-card";
                } else if (matchedWithEvidence.length > 0) {
                  const skill = matchedWithEvidence[0];
                  const projects = profile?.skillsEvidence
                    ? profile.skillsEvidence
                        .filter((ev: any) => ev.associatedSkills?.map((s: string) => s.toLowerCase().trim()).includes(skill.toLowerCase()))
                        .map((ev: any) => ev.projectName)
                    : [];
                    
                  if (projects.length > 0) {
                    evidenceText = `${skill} comprovado por ${projects.join(" e ")}`;
                  } else {
                    const suggestion = PROJECT_SUGGESTIONS[skill.toLowerCase()] || "projeto no perfil";
                    evidenceText = `${skill} comprovado por ${suggestion}`;
                  }
                } else if (matchedWithoutEvidence.length > 0) {
                  const skill = matchedWithoutEvidence[0];
                  const suggestion = PROJECT_SUGGESTIONS[skill.toLowerCase()] || "projeto no perfil";
                  evidenceText = `${skill} sem evidência — associe ${suggestion}`;
                  evidenceLink = `/profile?preselect=${encodeURIComponent(skill)}#evidence-matrix-card`;
                } else {
                  evidenceText = "Adicionar evidências no perfil";
                }

                if (missingGaps.length > 0) {
                  const skill = missingGaps[0];
                  const isHard = ["rag", "airflow", "dbt", "kubernetes", "aws", "gcp"].includes(skill.toLowerCase());
                  if (isHard) {
                    gapText = `${skill} é gap duro — criar Learning Task`;
                  } else {
                    gapText = `${skill} aprendível`;
                  }
                  gapLink = `/profile?preselect=${encodeURIComponent(skill)}#learning-backlog-card`;
                } else {
                  gapText = "Sem gaps";
                }

                return (
                  <div key={j.id} className="relative rounded-xl border border-border bg-bg-elevated/20 p-4 flex flex-col justify-between hover:border-accent/40 hover:bg-bg-elevated/40 transition-all group duration-200">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold tracking-wide uppercase ${scoreColor}`}>
                          {decision} ({Math.round((j.score ?? 0) * 100)}%)
                        </span>
                        <span className="text-[10px] text-text-tertiary font-medium">
                          {experienceLevelLabel(j.experienceLevel || "junior")}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-text-primary leading-snug line-clamp-2 mb-0.5 group-hover:text-accent transition-colors">
                        {j.title}
                      </h3>
                      <p className="text-xs text-text-secondary font-medium mb-3">{j.company}</p>
                      
                      <div className="space-y-2 border-t border-border/60 pt-2.5 mb-4 text-[11px]">
                        <div className="flex items-start gap-1.5 text-text-secondary">
                          <span className="text-emerald-400 shrink-0 mt-0.5">✓</span>
                          <span className="leading-snug">
                            Evidência:{" "}
                            <Link href={evidenceLink} className="text-text-primary font-medium hover:text-accent hover:underline">
                              {evidenceText}
                            </Link>
                          </span>
                        </div>
                        <div className="flex items-start gap-1.5 text-text-secondary">
                          <span className="text-amber-400 shrink-0 mt-0.5">⟳</span>
                          <span className="leading-snug">
                            Gap:{" "}
                            <Link href={gapLink} className="text-text-primary font-medium hover:text-accent hover:underline">
                              {gapText}
                            </Link>
                          </span>
                        </div>
                        {warning && (
                          <div className="flex items-start gap-1.5 text-text-secondary">
                            <span className="text-red-400 shrink-0 mt-0.5">🚩</span>
                            <span className="text-text-tertiary leading-snug">{warning}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Link href={`/jobs/${j.id}`} className="w-full mt-auto">
                      <Button variant="primary" size="sm" className="w-full text-xs py-1.5 h-8">
                        Preparar Candidatura
                      </Button>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mb-8 rounded-xl border border-dashed p-6 text-center bg-bg-elevated/5">
            <Sparkles className="h-6 w-6 mx-auto text-text-tertiary mb-2" />
            <p className="text-xs text-text-secondary font-medium">Sem recomendações de alto aproveitamento hoje</p>
            <p className="text-[11px] text-text-tertiary mt-0.5">Tente sincronizar novas fontes ou revisar as evidências de habilidades do seu perfil.</p>
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
            {/* OPORTUNIDADES BRASIL */}
            <div className="mb-10 bg-bg-elevated/20 border border-border p-6 rounded-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 border-b border-border/60 pb-3 gap-2">
                <div>
                  <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
                    <span>🇧🇷 Oportunidades Brasil</span>
                    <Badge variant="accent" className="text-[10px] px-1.5 py-0">Watchlist</Badge>
                  </h2>
                  <p className="text-xs text-text-tertiary mt-0.5">Vagas segmentadas em empresas com forte atuação no Brasil</p>
                </div>
              </div>
              
              {/* Horizontal scrollable pills */}
              <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-border">
                {BR_CATEGORIES.map((cat) => {
                  const count = brCategoryJobs[cat.id]?.length || 0;
                  const isActive = selectedBrCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedBrCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap border ${
                        isActive
                          ? "bg-accent text-white border-accent shadow-sm"
                          : "bg-bg-elevated/40 border-border/80 text-text-secondary hover:text-text-primary hover:bg-bg-elevated/80"
                      }`}
                    >
                      <span>{cat.icon} {cat.label}</span>
                      <span className={`text-[10px] rounded px-1.5 font-bold ${
                        isActive ? "bg-white/20 text-white" : "bg-bg-elevated text-text-tertiary"
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
              
              {/* Opportunities list inside section */}
              <div className="max-h-[500px] overflow-y-auto pr-1 space-y-2">
                <RadarList jobs={brCategoryJobs[selectedBrCategory] || []} />
              </div>
            </div>

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
