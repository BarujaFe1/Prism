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

const DOMAIN_OPTIONS = [
  { key: "data", label: "Dados" },
  { key: "bi_analytics", label: "BI e Analytics" },
  { key: "data_engineering", label: "Engenharia de Dados" },
  { key: "produto_dados", label: "Produto de Dados" },
  { key: "estatistica", label: "Estatística e Experimentos" },
  { key: "ia_aplicada", label: "IA Aplicada" },
  { key: "fullstack_dados", label: "Full-Stack com Dados" },
  { key: "fullstack_backend", label: "Backend / Fullstack Geral" },
  { key: "software_engineering", label: "Eng. de Software" },
  { key: "design", label: "Design" },
  { key: "legal", label: "Jurídico" },
  { key: "sales", label: "Vendas / Marketing" },
  { key: "finance_ops", label: "Finanças / Ops" },
  { key: "admin_support", label: "Suporte / Admin" },
  { key: "unknown", label: "Outros / Unknown" },
];

const STATUS_OPTIONS = [
  { key: "new", label: "Novas" },
  { key: "saved", label: "Salvas" },
  { key: "high_priority", label: "Prioritárias" },
  { key: "preparing", label: "Preparando" },
  { key: "applied", label: "Aplicadas" },
  { key: "reviewing", label: "Em Análise" },
  { key: "interview", label: "Entrevista" },
  { key: "offer", label: "Oferta" },
  { key: "rejected", label: "Recusadas" },
  { key: "ignored", label: "Ignoradas" },
  { key: "archived", label: "Arquivadas" },
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

  // Advanced Filters States
  const [selectedDomains, setSelectedDomains] = useState<string[]>(() => {
    const v = searchParams.get("dominio");
    return v ? v.split(",") : [];
  });
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(() => {
    const v = searchParams.get("status");
    return v ? v.split(",") : [];
  });
  const [selectedSources, setSelectedSources] = useState<string[]>(() => {
    const v = searchParams.get("fonte");
    return v ? v.split(",") : [];
  });
  const [warningFilter, setWarningFilter] = useState(searchParams.get("warnings") || "");
  const [showSuppressed, setShowSuppressed] = useState(searchParams.get("suppressed") === "true");
  const [dateType, setDateType] = useState(searchParams.get("date_type") || "fetched");

  // New Watchlist & Quality Filters States
  const [filterCompanyType, setFilterCompanyType] = useState(searchParams.get("comp_type") || "");
  const [filterCompanySector, setFilterCompanySector] = useState(searchParams.get("comp_sector") || "");
  const [filterCompanyPriority, setFilterCompanyPriority] = useState(searchParams.get("comp_priority") || "");
  const [filterAtsType, setFilterAtsType] = useState(searchParams.get("ats_type") || "");
  const [qualityFilter, setQualityFilter] = useState(searchParams.get("quality") || "");
  const [warningTypeFilter, setWarningTypeFilter] = useState(searchParams.get("warning_type") || "");

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
    
    // new ones
    if (selectedDomains.length) p.set("dominio", selectedDomains.join(","));
    if (selectedStatuses.length) p.set("status", selectedStatuses.join(","));
    if (selectedSources.length) p.set("fonte", selectedSources.join(","));
    if (warningFilter) p.set("warnings", warningFilter);
    if (showSuppressed) p.set("suppressed", "true");
    if (dateType !== "fetched") p.set("date_type", dateType);

    if (filterCompanyType) p.set("comp_type", filterCompanyType);
    if (filterCompanySector) p.set("comp_sector", filterCompanySector);
    if (filterCompanyPriority) p.set("comp_priority", filterCompanyPriority);
    if (filterAtsType) p.set("ats_type", filterAtsType);
    if (qualityFilter) p.set("quality", qualityFilter);
    if (warningTypeFilter) p.set("warning_type", warningTypeFilter);

    const qs = p.toString();
    router.replace(`/explore${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [
    search, selectedLocations, selectedContracts, selectedLevels, selectedAreas, 
    selectedTechs, selectedDate, minScore, internacional, sortBy, sortOrder, 
    selectedDomains, selectedStatuses, selectedSources, warningFilter, showSuppressed, dateType,
    filterCompanyType, filterCompanySector, filterCompanyPriority, filterAtsType, qualityFilter, warningTypeFilter, router
  ]);

  const { data: allJobs, isLoading } = useQuery({
    queryKey: ["explore-jobs"],
    queryFn: async () => {
      const res = await fetch("/api/jobs?limit=500");
      return res.json() as Promise<JobWithStatus[]>;
    },
    staleTime: 10000,
  });

  const { data: companies } = useQuery<any[]>({
    queryKey: ["target-companies"],
    queryFn: async () => {
      const res = await fetch("/api/companies");
      return res.json();
    },
    staleTime: 60000,
  });

  const companyMap = useMemo(() => {
    const map = new Map<string, any>();
    if (!companies) return map;
    companies.forEach((c) => {
      map.set(c.name.toLowerCase(), c);
      map.set(c.normalizedName, c);
    });
    return map;
  }, [companies]);

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

  const getCount = useMemo(() => {
    if (!allJobs) return (_: string, _key: string) => 0;
    return (value: string, key: "locationType" | "contractType" | "experienceLevel") => {
      return allJobs.filter((j) => j[key] === value).length;
    };
  }, [allJobs]);

  const domainCounts = useMemo(() => {
    if (!allJobs) return new Map<string, number>();
    const counts = new Map<string, number>();
    allJobs.forEach((job) => {
      let d = "unknown";
      try {
        const details = typeof job.scoreDetails === "string" ? JSON.parse(job.scoreDetails) : job.scoreDetails;
        d = details?.domain || "unknown";
      } catch {
        // fallback
      }
      counts.set(d, (counts.get(d) || 0) + 1);
    });
    return counts;
  }, [allJobs]);

  const statusCounts = useMemo(() => {
    if (!allJobs) return new Map<string, number>();
    const counts = new Map<string, number>();
    allJobs.forEach((job) => {
      counts.set(job.status, (counts.get(job.status) || 0) + 1);
    });
    return counts;
  }, [allJobs]);

  const allSources = useMemo(() => {
    if (!allJobs) return [];
    const counts = new Map<string, number>();
    allJobs.forEach((j) => {
      if (j.source) {
        counts.set(j.source, (counts.get(j.source) || 0) + 1);
      }
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([source, count]) => ({ source, count }));
  }, [allJobs]);

  const filtered = useMemo(() => {
    if (!allJobs) return [];
    const q = debouncedSearch.toLowerCase().trim();
    return allJobs.filter((job) => {
      const comp = companyMap.get(job.company.toLowerCase());

      if (q) {
        const words = q.split(/[\s,]+/).filter(Boolean);
        let matchAts: string | null = null;
        let matchPriority: string | null = null;
        let matchModality: string | null = null;
        let matchSeniority: string | null = null;
        let matchContract: string | null = null;
        let matchSector: string | null = null;
        const textKeywords: string[] = [];

        for (const w of words) {
          const wl = w.toLowerCase();
          
          if (["gupy", "greenhouse", "lever", "ashby", "workday"].includes(wl)) {
            matchAts = wl;
          } else if (["p0", "p1", "p2"].includes(wl)) {
            matchPriority = wl.toUpperCase();
          } else if (["remoto", "remote", "home office"].includes(wl)) {
            matchModality = "remote";
          } else if (["hibrido", "híbrido", "hybrid"].includes(wl)) {
            matchModality = "hybrid";
          } else if (["presencial", "onsite", "on-site", "office"].includes(wl)) {
            matchModality = "onsite";
          } else if (["estagio", "estágio", "intern", "estagiario", "estagiário"].includes(wl)) {
            matchSeniority = "internship";
          } else if (["trainee"].includes(wl)) {
            matchSeniority = "trainee";
          } else if (["junior", "júnior", "jr"].includes(wl)) {
            matchSeniority = "junior";
          } else if (["pleno", "mid", "middle"].includes(wl)) {
            matchSeniority = "mid";
          } else if (["senior", "sênior", "sr"].includes(wl)) {
            matchSeniority = "senior";
          } else if (["lead", "staff", "principal"].includes(wl)) {
            matchSeniority = "lead";
          } else if (["clt"].includes(wl)) {
            matchContract = "clt";
          } else if (["pj"].includes(wl)) {
            matchContract = "pj";
          } else if (["freelance", "freelancer"].includes(wl)) {
            matchContract = "freelancer";
          } else if (["temporario", "temporário"].includes(wl)) {
            matchContract = "temporary";
          } else if (["fintech", "fintechs", "banco", "bancos", "credito", "crédito", "pagamento", "pagamentos"].includes(wl)) {
            matchSector = "Fintech, bancos, crédito e pagamentos";
          } else if (["saas", "software", "consultoria", "consultorias"].includes(wl)) {
            matchSector = "Software, SaaS, dados e consultorias brasileiras";
          } else if (["varejo", "ecommerce", "e-commerce", "marketplace", "marketplaces", "loja", "lojas"].includes(wl)) {
            matchSector = "Varejo, e-commerce, marketplaces e consumer tech";
          } else if (["logistica", "logística", "mobilidade", "transporte", "delivery"].includes(wl)) {
            matchSector = "Logística, mobilidade, transporte e delivery";
          } else if (["industria", "indústria", "energia", "agro", "infraestrutura"].includes(wl)) {
            matchSector = "Indústria, energia, agro e infraestrutura";
          } else if (["saude", "saúde", "educacao", "educação", "hr", "hrtech", "hr tech", "escola", "hospital"].includes(wl)) {
            matchSector = "Saúde, educação e HR tech";
          } else if (["seguro", "seguros", "risco", "antifraude"].includes(wl)) {
            matchSector = "Seguros, risco e antifraude";
          } else if (["telecom", "midia", "mídia", "entretenimento", "conteudo", "conteúdo"].includes(wl)) {
            matchSector = "Telecom, mídia, entretenimento e conteúdo";
          } else if (["proptech", "construcao", "construção", "real estate"].includes(wl)) {
            matchSector = "Proptech, construção, real estate e serviços urbanos";
          } else if (["startup", "startups", "scaleup", "scaleups", "small"].includes(wl)) {
            matchSector = "Startups e scale-ups";
          } else {
            textKeywords.push(wl);
          }
        }

        if (matchAts) {
          const jobAts = comp?.detectedAts || (["greenhouse", "lever", "ashby", "gupy"].includes(job.source.toLowerCase()) ? job.source.toLowerCase() : "unknown");
          if (jobAts !== matchAts) return false;
        }
        if (matchPriority) {
          if (comp?.priority !== matchPriority) return false;
        }
        if (matchModality) {
          if (job.locationType !== matchModality) return false;
        }
        if (matchSeniority) {
          if (job.experienceLevel !== matchSeniority) return false;
        }
        if (matchContract) {
          if (job.contractType !== matchContract) return false;
        }
        if (matchSector) {
          if (comp?.sector !== matchSector) return false;
        }

        if (textKeywords.length > 0) {
          const text = `${job.title} ${job.company} ${job.description || ""} ${job.location || ""}`.toLowerCase();
          const matchesAll = textKeywords.every(kw => text.includes(kw));
          if (!matchesAll) return false;
        }
      }

      let details: any = {};
      try {
        details = typeof job.scoreDetails === "string" ? JSON.parse(job.scoreDetails) : job.scoreDetails || {};
      } catch {
        // fallback
      }

      // Suppressed filter
      const isSuppressed = details?.scoreLabel === "Fora do foco" || (job.score ?? 0) <= 0.30;
      if (isSuppressed && !showSuppressed) return false;

      // Base filters
      if (!matchesFilter(job.locationType, MODALITY_MAP, selectedLocations)) return false;
      if (!matchesFilter(job.contractType, CONTRACT_MAP, selectedContracts)) return false;
      if (!matchesFilter(job.experienceLevel, SENIORITY_MAP, selectedLevels)) return false;

      // Domain filter
      const domain = details?.domain || "unknown";
      if (selectedDomains.length > 0 && !selectedDomains.includes(domain)) return false;

      // Status filter
      if (selectedStatuses.length > 0) {
        if (!selectedStatuses.includes(job.status)) return false;
      } else {
        // Hide ignored/archived by default
        if (job.status === "ignored" || job.status === "archived") return false;
      }

      // Source filter
      if (selectedSources.length > 0 && !selectedSources.includes(job.source)) return false;

      // Warnings filter
      const hasWarnings = (details?.penalties && details?.penalties.length > 0) || (details?.warnings && details?.warnings.length > 0);
      if (warningFilter === "clean" && hasWarnings) return false;
      if (warningFilter === "warnings" && !hasWarnings) return false;

      // Date filter
      if (selectedDate) {
        const dateStr = dateType === "fetched" ? job.fetchedAt : job.postedAt;
        if (!dateStr) return false;
        const targetTime = new Date(dateStr).getTime();
        const now = Date.now();
        if (selectedDate === "today" && now - targetTime > 86400000) return false;
        if (selectedDate === "3d" && now - targetTime > 3 * 86400000) return false;
        if (selectedDate === "7d" && now - targetTime > 7 * 86400000) return false;
        if (selectedDate === "14d" && now - targetTime > 14 * 86400000) return false;
      }

      // Score filter
      if (minScore > 0 && (job.score ?? 0) < minScore / 100) return false;

      // Watchlist & Company Filters
      if (filterCompanyType === "monitored" && !comp) return false;
      if (filterCompanyType === "p0" && comp?.priority !== "P0") return false;
      if (filterCompanySector && comp?.sector !== filterCompanySector) return false;
      if (filterCompanyPriority && comp?.priority !== filterCompanyPriority) return false;

      // ATS Filter
      const atsType = comp?.detectedAts || (["greenhouse", "lever", "ashby", "gupy"].includes(job.source.toLowerCase()) ? job.source.toLowerCase() : "unknown");
      if (filterAtsType && atsType !== filterAtsType) return false;

      // Quality Filter
      if (qualityFilter) {
        if (qualityFilter === "salary" && !job.salaryMin && !job.salaryMax) return false;
        if (qualityFilter === "full_desc" && (!job.description || job.description.length < 500)) return false;
        if (qualityFilter === "official" && !["greenhouse", "lever", "ashby", "gupy", "jobposting"].includes(job.source.toLowerCase())) return false;
        if (qualityFilter === "weak_desc" && job.description && job.description.length >= 300) return false;
        if (qualityFilter === "no_apply" && !job.url) return false;
      }

      // Warning type filter
      if (warningTypeFilter) {
        const penalties = details?.penalties || [];
        if (warningTypeFilter === "seniority" && !penalties.some((p: string) => p.toLowerCase().includes("senioridade"))) return false;
        if (warningTypeFilter === "onsite" && !penalties.some((p: string) => p.toLowerCase().includes("presencial"))) return false;
        if (warningTypeFilter === "negative" && !penalties.some((p: string) => p.toLowerCase().includes("interesse") || p.toLowerCase().includes("tecnologia"))) return false;
        if (warningTypeFilter === "divergent" && !penalties.some((p: string) => p.toLowerCase().includes("incompatível") || p.toLowerCase().includes("domínio"))) return false;
      }

      // Area filter
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

      // Stack filter
      if (selectedTechs.length > 0) {
        const jobTechs = (job.technologies || []).map((t: string) => t.toLowerCase());
        const hasTech = selectedTechs.some((tech) => jobTechs.includes(tech.toLowerCase()));
        if (!hasTech) return false;
      }

      // Location Filter
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
      if (sortBy === "date") {
        const dateA = dateType === "fetched" ? a.fetchedAt : a.postedAt;
        const dateB = dateType === "fetched" ? b.fetchedAt : b.postedAt;
        return sortOrder === "desc" ? new Date(dateB || "").getTime() - new Date(dateA || "").getTime() : new Date(dateA || "").getTime() - new Date(dateB || "").getTime();
      }
      if (sortBy === "salary") return sortOrder === "desc" ? (b.salaryMax ?? 0) - (a.salaryMax ?? 0) : (a.salaryMax ?? 0) - (b.salaryMax ?? 0);
      return 0;
    });
  }, [allJobs, debouncedSearch, selectedLocations, selectedContracts, selectedLevels, selectedAreas, selectedTechs, selectedDate, minScore, internacional, sortBy, sortOrder, selectedDomains, selectedStatuses, selectedSources, warningFilter, showSuppressed, dateType, filterCompanyType, filterCompanySector, filterCompanyPriority, filterAtsType, qualityFilter, warningTypeFilter, companyMap]);

  const toggleFilter = (arr: string[], val: string, set: (v: string[]) => void) => {
    set(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  };

  const clearFilters = () => {
    setSelectedLocations([]);
    setSelectedContracts([]);
    setSelectedLevels([]);
    setSelectedAreas([]);
    setSelectedTechs([]);
    setSelectedDomains([]);
    setSelectedStatuses([]);
    setSelectedSources([]);
    setSelectedDate("");
    setMinScore(0);
    setInternacional("");
    setWarningFilter("");
    setShowSuppressed(false);
    setDateType("fetched");
    setSearch("");
    setDebouncedSearch("");
    setFilterCompanyType("");
    setFilterCompanySector("");
    setFilterCompanyPriority("");
    setFilterAtsType("");
    setQualityFilter("");
    setWarningTypeFilter("");
  };

  const hasFilters = selectedLocations.length > 0 || selectedContracts.length > 0 || selectedLevels.length > 0 ||
    selectedAreas.length > 0 || selectedTechs.length > 0 || selectedDomains.length > 0 || selectedStatuses.length > 0 ||
    selectedSources.length > 0 || selectedDate || minScore > 0 || internacional || warningFilter || showSuppressed ||
    filterCompanyType || filterCompanySector || filterCompanyPriority || filterAtsType || qualityFilter || warningTypeFilter;

  const activeFilterCount = [
    selectedLocations, selectedContracts, selectedLevels, selectedAreas, selectedTechs, selectedDomains, selectedStatuses, selectedSources
  ].reduce((acc, arr) => acc + arr.length, 0) + (selectedDate ? 1 : 0) + (minScore > 0 ? 1 : 0) + (internacional ? 1 : 0) + 
    (warningFilter ? 1 : 0) + (showSuppressed ? 1 : 0) + (filterCompanyType ? 1 : 0) + (filterCompanySector ? 1 : 0) + 
    (filterCompanyPriority ? 1 : 0) + (filterAtsType ? 1 : 0) + (qualityFilter ? 1 : 0) + (warningTypeFilter ? 1 : 0);

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
        <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-40">
          <option value="score">Aderência (Score)</option>
          <option value="date">Recência (Data)</option>
          <option value="salary">Remuneração</option>
        </Select>
        <Button variant="ghost" size="icon" onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")} className="text-text-tertiary">
          {sortOrder === "desc" ? "↓" : "↑"}
        </Button>
      </div>

      <div className="flex gap-6">
        {filtersOpen && (
          <div className="w-64 shrink-0 space-y-5 animate-fade-in pr-2 max-h-[80vh] overflow-y-auto">
            {/* Suppressed toggle */}
            <div>
              <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-2">Opções de Visibilidade</p>
              <label className="flex items-center gap-2 cursor-pointer bg-bg-elevated/20 p-2 rounded-lg border border-border/50 hover:bg-bg-elevated/40">
                <input
                  type="checkbox"
                  checked={showSuppressed}
                  onChange={(e) => setShowSuppressed(e.target.checked)}
                  className="rounded border-text-tertiary text-accent focus:ring-accent/40 h-3.5 w-3.5"
                />
                <span className="text-xs text-text-secondary flex-1">Ver Fora de Foco / suprimidas</span>
              </label>
            </div>

            {/* Watchlist & Empresas */}
            <div>
              <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">Watchlist Brasileira</p>
              <div className="space-y-2 bg-bg-elevated/10 p-2 rounded-lg border border-border/40">
                <div>
                  <label className="text-[10px] uppercase font-bold text-text-tertiary mb-1 block">Empresa</label>
                  <Select
                    value={filterCompanyType}
                    onChange={(e) => setFilterCompanyType(e.target.value)}
                    className="w-full text-xs h-8"
                  >
                    <option value="">Todas</option>
                    <option value="monitored">Apenas Monitoradas</option>
                    <option value="p0">Apenas P0</option>
                  </Select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-text-tertiary mb-1 block">Setor da Empresa</label>
                  <Select
                    value={filterCompanySector}
                    onChange={(e) => setFilterCompanySector(e.target.value)}
                    className="w-full text-xs h-8"
                  >
                    <option value="">Todos os Setores</option>
                    <option value="Fintech, bancos, crédito e pagamentos">Fintech, bancos e crédito</option>
                    <option value="Software, SaaS, dados e consultorias brasileiras">SaaS, Softwares e Dados</option>
                    <option value="Varejo, e-commerce, marketplaces e consumer tech">Varejo, E-commerce e Marketplaces</option>
                    <option value="Logística, mobilidade, transporte e delivery">Logística e Mobilidade</option>
                    <option value="Indústria, energia, agro e infraestrutura">Indústria, Agro e Infraestrutura</option>
                    <option value="Saúde, educação e HR tech">Saúde, Educação e HR Tech</option>
                    <option value="Seguros, risco e antifraude">Seguros, Risco e Antifraude</option>
                    <option value="Telecom, mídia, entretenimento e conteúdo">Telecom, Mídia e Entretenimento</option>
                    <option value="Proptech, construção, real estate e serviços urbanos">Proptech e Real Estate</option>
                    <option value="Multinacionais com operação forte no Brasil">Multinacionais no BR</option>
                    <option value="Startups e scale-ups">Startups e Scale-ups</option>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-text-tertiary mb-1 block">Prioridade</label>
                    <Select
                      value={filterCompanyPriority}
                      onChange={(e) => setFilterCompanyPriority(e.target.value)}
                      className="w-full text-xs h-8"
                    >
                      <option value="">Todas</option>
                      <option value="P0">P0</option>
                      <option value="P1">P1</option>
                      <option value="P2">P2</option>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-text-tertiary mb-1 block">ATS</label>
                    <Select
                      value={filterAtsType}
                      onChange={(e) => setFilterAtsType(e.target.value)}
                      className="w-full text-xs h-8"
                    >
                      <option value="">Todos</option>
                      <option value="greenhouse">Greenhouse</option>
                      <option value="lever">Lever</option>
                      <option value="ashby">AshbyHQ</option>
                      <option value="gupy">Gupy</option>
                      <option value="custom">Custom</option>
                      <option value="unknown">Outros</option>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Qualidade e Alertas */}
            <div>
              <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">Qualidade e Filtros</p>
              <div className="space-y-2 bg-bg-elevated/10 p-2 rounded-lg border border-border/40">
                <div>
                  <label className="text-[10px] uppercase font-bold text-text-tertiary mb-1 block">Sinais de Qualidade</label>
                  <Select
                    value={qualityFilter}
                    onChange={(e) => setQualityFilter(e.target.value)}
                    className="w-full text-xs h-8"
                  >
                    <option value="">Qualquer Qualidade</option>
                    <option value="salary">Com Salário Informado</option>
                    <option value="full_desc">Descrição Completa (+500 char)</option>
                    <option value="official">Fontes Oficiais / ATS</option>
                    <option value="weak_desc">Descrição Curta / Fraca</option>
                    <option value="no_apply">Com Link de Candidatura</option>
                  </Select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-text-tertiary mb-1 block">Filtrar por Alerta</label>
                  <Select
                    value={warningTypeFilter}
                    onChange={(e) => setWarningTypeFilter(e.target.value)}
                    className="w-full text-xs h-8"
                  >
                    <option value="">Sem filtro de alertas</option>
                    <option value="seniority">Senioridade acima do perfil</option>
                    <option value="onsite">Presencial Obrigatório Longe</option>
                    <option value="negative">Stack Fora de Interesse</option>
                    <option value="divergent">Domínio Incompatível</option>
                  </Select>
                </div>
              </div>
            </div>

            {/* Domains */}
            <div>
              <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-2">Domínio (Scoring)</p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {DOMAIN_OPTIONS.map((domain) => {
                  const count = domainCounts.get(domain.key) || 0;
                  return (
                    <label key={domain.key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedDomains.includes(domain.key)}
                        onChange={() => toggleFilter(selectedDomains, domain.key, setSelectedDomains)}
                        className="rounded border-text-tertiary text-accent focus:ring-accent/40 h-3.5 w-3.5"
                      />
                      <span className="text-sm text-text-secondary flex-1">{domain.label}</span>
                      {count > 0 && <span className="text-[10px] text-text-tertiary tabular-nums">({count})</span>}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Status */}
            <div>
              <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-2">Status (Pipeline)</p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {STATUS_OPTIONS.map((opt) => {
                  const count = statusCounts.get(opt.key) || 0;
                  return (
                    <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedStatuses.includes(opt.key)}
                        onChange={() => toggleFilter(selectedStatuses, opt.key, setSelectedStatuses)}
                        className="rounded border-text-tertiary text-accent focus:ring-accent/40 h-3.5 w-3.5"
                      />
                      <span className="text-sm text-text-secondary flex-1">{opt.label}</span>
                      {count > 0 && <span className="text-[10px] text-text-tertiary tabular-nums">({count})</span>}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Sources */}
            {allSources.length > 0 && (
              <div>
                <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-2">Fontes</p>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {allSources.map(({ source, count }) => (
                    <label key={source} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedSources.includes(source)}
                        onChange={() => toggleFilter(selectedSources, source, setSelectedSources)}
                        className="rounded border-text-tertiary text-accent focus:ring-accent/40 h-3.5 w-3.5"
                      />
                      <span className="text-sm text-text-secondary flex-1 text-ellipsis overflow-hidden whitespace-nowrap" title={source}>
                        {source}
                      </span>
                      <span className="text-[10px] text-text-tertiary tabular-nums">({count})</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings/Penalties */}
            <div>
              <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-2">Alertas e Penalidades</p>
              <div className="flex flex-col gap-1">
                {[
                  { key: "", label: "Todos" },
                  { key: "clean", label: "Sem Alertas (Limpo)" },
                  { key: "warnings", label: "Com Alertas" },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setWarningFilter(opt.key)}
                    className={`px-2 py-1 rounded-lg text-xs font-medium text-left transition-all ${
                      warningFilter === opt.key ? "bg-accent text-white" : "bg-bg-elevated text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Base and range */}
            <div>
              <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-2">Base Temporal</p>
              <div className="flex gap-1 mb-2">
                {[
                  { key: "fetched", label: "Coleta local" },
                  { key: "posted", label: "Publicação" },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setDateType(opt.key)}
                    className={`flex-1 px-1.5 py-1 rounded-md text-[10px] font-medium transition-all ${
                      dateType === opt.key ? "bg-accent text-white" : "bg-bg-elevated text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="space-y-1.5">
                {DATE_OPTIONS.map((opt) => (
                  <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="date"
                      checked={selectedDate === opt.key}
                      onChange={() => setSelectedDate(opt.key === selectedDate ? "" : opt.key)}
                      className="text-accent focus:ring-accent/40 h-3.5 w-3.5"
                    />
                    <span className="text-sm text-text-secondary">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Areas */}
            <div>
              <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-2">Área (Filtro por Palavras)</p>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {AREAS.map((area) => (
                  <label key={area.key} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={selectedAreas.includes(area.key)} onChange={() => toggleFilter(selectedAreas, area.key, setSelectedAreas)} className="rounded border-text-tertiary text-accent focus:ring-accent/40 h-3.5 w-3.5" />
                    <span className="text-sm text-text-secondary">{area.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Localization */}
            <div>
              <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-2">Localização</p>
              <div className="flex gap-1">
                {["", "br", "intl"].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setInternacional(opt === internacional ? "" : opt)}
                    className={`flex-1 py-1 rounded-lg text-xs font-medium transition-all ${
                      internacional === opt ? "bg-accent text-white" : "bg-bg-elevated text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {opt === "" ? "🌎 Ambos" : opt === "br" ? "🇧🇷 BR" : "🌍 Int'l"}
                  </button>
                ))}
              </div>
            </div>

            {/* Seniority */}
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

            {/* Modality */}
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

            {/* Contract */}
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

            {/* Tech/Stack */}
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

            {/* Score slider */}
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
                {selectedDomains.length > 0 && <span>• Domínios específicos selecionados. </span>}
                {selectedStatuses.length > 0 && <span>• Filtro de status ativo. </span>}
                {selectedSources.length > 0 && <span>• Fontes específicas selecionadas. </span>}
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
