"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import {
  Cable, Globe, Loader2, RefreshCw, CheckCircle2, XCircle,
  AlertTriangle, History, Upload, Link2, FileSpreadsheet, Bot,
  Database, Terminal, Search, ExternalLink, Plus, Building2,
  Eye, Settings2, Activity, Briefcase, Trash2, TrendingUp, FilterX
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import type { JobWithStatus } from "@/types";

interface ConnectorInfo {
  id: string;
  name: string;
  jobCount: number;
}

interface ConnectorLog {
  connectorName: string;
  runAt: string;
  jobsNew: number;
  jobsDuplicate: number;
  errorMessage?: string;
  durationMs?: number;
}

interface TargetCompany {
  id: string;
  name: string;
  normalizedName: string;
  sector: string | null;
  priority: string | null;
  countryFocus: string | null;
  targetRoles: string | null;
  whyMonitor: string | null;
  searchQueryPt: string | null;
  searchQueryEn: string | null;
  atsHint: string | null;
  careerUrl: string | null;
  detectedAts: string | null;
  status: "active" | "error" | "needs_review" | "never_synced";
  lastSyncAttemptAt: string | null;
  lastSuccessfulSyncAt: string | null;
  lastError: string | null;
  totalJobsFound: number;
  totalRelevantJobs: number;
  totalSavedJobs: number;
  totalAppliedJobs: number;
  usefulnessRate: number;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  notes: string | null;
}

const ICON_MAP: Record<string, any> = {
  remoteok: Globe, weworkremotely: Globe, greenhouse: Cable,
  lever: Cable, remotive: Database, hackernews: Terminal,
  arbeitnow: Search, "linkedin-rss": ExternalLink,
  wellfound: Bot, jobicy: Globe,
  "remote-co": Globe, "google-jobs": Search, "4dayweek": Globe,
  nodesk: Globe, revelo: Database, himalayas: Globe,
  stackoverflow: Terminal, gupy: Database,
};

const DESC_MAP: Record<string, string> = {
  remoteok: "API pública com vagas remotas de tecnologia (18 tags em paralelo)",
  weworkremotely: "Maior comunidade de vagas remotas (6 feeds RSS de categoria)",
  greenhouse: "ATS integrado — Nubank, Mercado Livre, iFood e +",
  lever: "ATS integrado — Stripe, Linear, Notion, Anthropic e +",
  remotive: "API pública com 5 categorias (dev, data, devops, product, design)",
  hackernews: "Thread mensal 'Who is Hiring' do Hacker News — vagas de alto nível",
  arbeitnow: "API pública com foco em vagas europeias e remotas",
  "linkedin-rss": "Busca por 10 queries diferentes no LinkedIn",
  wellfound: "Vagas de startups (AngelList/Wellfound)",
  jobicy: "Feeds RSS com categorias de tech + design + marketing",
  "remote-co": "Feed RSS do Remote.co — vagas tech-agnostic",
  "google-jobs": "Busca no Google Jobs por 10 queries de tecnologia",
  "4dayweek": "API de empresas com semana de 4 dias de trabalho",
  nodesk: "Feed RSS do Nodesk — vagas remotas em tecnologia",
  revelo: "Plataforma brasileira de vagas tech (busca por 10 termos)",
  himalayas: "API pública do Himalayas — vagas remotas globais",
  stackoverflow: "Feeds RSS do Stack Overflow Jobs (10 queries)",
  gupy: "API pública da Gupy — vagas brasileiras de tecnologia",
};

export function SourcesClient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"channels" | "companies">("channels");
  const [syncing, setSyncing] = useState<string | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);

  // New Company form states
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyDomain, setNewCompanyDomain] = useState("");
  const [newCompanyCareersUrl, setNewCompanyCareersUrl] = useState("");
  const [newCompanyAtsType, setNewCompanyAtsType] = useState<any>("greenhouse");
  const [newCompanySector, setNewCompanySector] = useState("Software, SaaS, dados e consultorias brasileiras");
  const [newCompanyPriority, setNewCompanyPriority] = useState("P1");
  const [addingCompany, setAddingCompany] = useState(false);
  const [syncingCompanies, setSyncingCompanies] = useState(false);
  const [runningDetectAll, setRunningDetectAll] = useState(false);
  
  // Single company load IDs
  const [syncingCompanyId, setSyncingCompanyId] = useState<string | null>(null);
  const [detectingCompanyId, setDetectingCompanyId] = useState<string | null>(null);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSector, setFilterSector] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterAts, setFilterAts] = useState("");

  // Edit states
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [editCareerUrl, setEditCareerUrl] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editPriority, setEditPriority] = useState("");
  const [editSector, setEditSector] = useState("");
  const [editAtsType, setEditAtsType] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  
  const [importingWatchlist, setImportingWatchlist] = useState(false);

  const startEditCompany = (company: TargetCompany) => {
    setEditingCompanyId(company.id);
    setEditCareerUrl(company.careerUrl || "");
    setEditNotes(company.notes || "");
    setEditPriority(company.priority || "P1");
    setEditSector(company.sector || "Software, SaaS, dados e consultorias brasileiras");
    setEditAtsType(company.detectedAts || "unknown");
    setEditIsActive(company.isActive);
  };

  const handleImportWatchlist = async () => {
    setImportingWatchlist(true);
    try {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "import-watchlist" }),
      });
      const data = await res.json();
      if (data.ok) {
        toast(`Watchlist importada com sucesso! Importadas: ${data.summary.imported}, Atualizadas: ${data.summary.updated}, Ignoradas: ${data.summary.duplicates}`, "success");
        queryClient.invalidateQueries({ queryKey: ["target-companies"] });
      } else {
        toast(data.error || "Erro ao importar watchlist", "error");
      }
    } catch {
      toast("Erro de conexão", "error");
    }
    setImportingWatchlist(false);
  };

  const syncFilteredCompanies = async (params: { priority?: string; sector?: string }) => {
    setSyncingCompanies(true);
    try {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync", ...params }),
      });
      const data = await res.json();
      if (data.ok) {
        const totalNew = data.results?.new ?? 0;
        toast(`Sincronização concluída! Novas vagas: ${totalNew}`, "success");
        queryClient.invalidateQueries({ queryKey: ["target-companies"] });
        queryClient.invalidateQueries({ queryKey: ["sources-jobs"] });
      } else {
        toast(data.error || "Erro ao sincronizar", "error");
      }
    } catch {
      toast("Erro de conexão", "error");
    }
    setSyncingCompanies(false);
  };

  const handleSaveCompanyEdit = async (companyId: string) => {
    try {
      const res = await fetch("/api/companies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: companyId,
          careersUrl: editCareerUrl,
          notes: editNotes,
          priority: editPriority,
          sector: editSector,
          atsType: editAtsType,
          isActive: editIsActive,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        toast("Empresa atualizada com sucesso", "success");
        setEditingCompanyId(null);
        queryClient.invalidateQueries({ queryKey: ["target-companies"] });
      } else {
        toast(data.error || "Erro ao atualizar", "error");
      }
    } catch {
      toast("Erro de conexão", "error");
    }
  };

  // Stats queries
  const { data: apiData } = useQuery({
    queryKey: ["sources-stats"],
    queryFn: async () => {
      const res = await fetch("/api/connectors");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json() as Promise<{ logs: ConnectorLog[]; connectors: ConnectorInfo[] }>;
    },
    staleTime: 15000,
  });

  const { data: allJobs } = useQuery({
    queryKey: ["sources-jobs"],
    queryFn: async () => {
      const res = await fetch("/api/jobs?limit=2000");
      return res.json() as Promise<JobWithStatus[]>;
    },
    staleTime: 30000,
  });

  const { data: companies } = useQuery({
    queryKey: ["target-companies"],
    queryFn: async () => {
      const res = await fetch("/api/companies");
      if (!res.ok) throw new Error("Failed to fetch companies");
      return res.json() as Promise<TargetCompany[]>;
    },
    staleTime: 15000,
  });

  // Calculate stats for connectors
  const connectorStats = useMemo(() => {
    const map = new Map<string, { total: number; relevant: number; pipeline: number; applied: number }>();
    if (!allJobs) return map;
    allJobs.forEach((j) => {
      const sourceKey = j.source;
      const stats = map.get(sourceKey) || { total: 0, relevant: 0, pipeline: 0, applied: 0 };
      stats.total++;
      
      const isPipeline = ["saved", "high_priority", "preparing", "applied", "reviewing", "interview", "offer", "rejected"].includes(j.status);
      const isApplied = ["applied", "reviewing", "interview", "offer"].includes(j.status);
      const isRelevant = j.fitLabel === "high" || j.fitLabel === "good" || (j.score ?? 0) >= 0.70;

      if (isPipeline) stats.pipeline++;
      if (isApplied) stats.applied++;
      if (isRelevant) stats.relevant++;

      map.set(sourceKey, stats);
    });
    return map;
  }, [allJobs]);
 
  // Target Companies stats
  const companyStats = useMemo(() => {
    if (!companies) return {
      total: 0,
      byAts: {} as Record<string, number>,
      bySector: {} as Record<string, number>,
      withRelevant: 0,
      withError: 0,
      neverSynced: 0,
      topUsefulness: [] as TargetCompany[],
    };
 
    const byAts: Record<string, number> = {};
    const bySector: Record<string, number> = {};
    let withRelevant = 0;
    let withError = 0;
    let neverSynced = 0;
 
    companies.forEach((c) => {
      const ats = c.detectedAts || "unknown";
      byAts[ats] = (byAts[ats] || 0) + 1;
 
      const sector = c.sector || "Outros";
      bySector[sector] = (bySector[sector] || 0) + 1;
 
      if (c.totalRelevantJobs > 0) withRelevant++;
      if (c.status === "error" || c.lastError) withError++;
      if (c.status === "never_synced") neverSynced++;
    });
 
    const topUsefulness = [...companies]
      .filter((c) => c.totalJobsFound > 0)
      .sort((a, b) => b.usefulnessRate - a.usefulnessRate)
      .slice(0, 5);
 
    return {
      total: companies.length,
      byAts,
      bySector,
      withRelevant,
      withError,
      neverSynced,
      topUsefulness,
    };
  }, [companies]);
 
  // Filtered target companies for list
  const filteredCompanies = useMemo(() => {
    if (!companies) return [];
    return companies.filter((c) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = c.name.toLowerCase().includes(query) || c.normalizedName.includes(query);
        const matchesNotes = c.notes?.toLowerCase().includes(query);
        if (!matchesName && !matchesNotes) return false;
      }
      if (filterSector && c.sector !== filterSector) return false;
      if (filterPriority && c.priority !== filterPriority) return false;
      if (filterStatus) {
        if (filterStatus === "active" && !c.isActive) return false;
        if (filterStatus === "paused" && c.isActive) return false;
        if (filterStatus === "error" && !c.lastError) return false;
        if (filterStatus === "never_synced" && c.status !== "never_synced") return false;
      }
      if (filterAts && c.detectedAts !== filterAts) return false;
      return true;
    });
  }, [companies, searchQuery, filterSector, filterPriority, filterStatus, filterAts]);

  const health = (name: string) => {
    const logs = (apiData?.logs || []).filter((l) => l.connectorName === name);
    if (logs.length === 0) return { status: "inactive" as const, label: "Nunca sincronizado", lastLog: null as ConnectorLog | null };
    const last = logs[logs.length - 1];
    if (last.errorMessage) return { status: "error" as const, label: "Com falhas", lastLog: last };
    const days = (Date.now() - new Date(last.runAt).getTime()) / 86400000;
    if (days > 7) return { status: "warning" as const, label: "Desatualizado", lastLog: last };
    return { status: "healthy" as const, label: "Saudável", lastLog: last };
  };

  const syncOne = async (id: string) => {
    setSyncing(id);
    try {
      const res = await fetch("/api/connectors", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectors: [id] }),
      });
      const data = await res.json();
      const r = data.results?.[id];
      if (data.ok) toast(`${r?.new || 0} novas, ${r?.duplicate || 0} duplicadas`, "success");
      else toast("Erro ao sincronizar", "error");
      queryClient.invalidateQueries({ queryKey: ["sources-stats"] });
      queryClient.invalidateQueries({ queryKey: ["sources-jobs"] });
    } catch { toast("Erro de conexão", "error"); }
    setSyncing(null);
  };

  const syncAll = async () => {
    setSyncingAll(true);
    try {
      const res = await fetch("/api/connectors", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const data = await res.json();
      if (data.ok) {
        const total = Object.values(data.results || {}).reduce((a: number, r: any) => a + (r?.new || 0), 0);
        toast(`Sincronização concluída — ${total} novas vagas`, "success");
      }
      queryClient.invalidateQueries({ queryKey: ["sources-stats"] });
      queryClient.invalidateQueries({ queryKey: ["sources-jobs"] });
    } catch { toast("Erro de conexão", "error"); }
    setSyncingAll(false);
  };

  // Companies Sync
  const syncCompanies = async () => {
    setSyncingCompanies(true);
    try {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.ok) {
        toast(`Sincronização de empresas concluída: ${data.results?.new || 0} novas vagas`, "success");
      } else {
        toast("Erro ao sincronizar empresas", "error");
      }
      queryClient.invalidateQueries({ queryKey: ["target-companies"] });
      queryClient.invalidateQueries({ queryKey: ["sources-jobs"] });
    } catch {
      toast("Erro de conexão", "error");
    }
    setSyncingCompanies(false);
  };

  // Sync Single Company
  const syncOneCompany = async (companyId: string, companyName: string) => {
    setSyncingCompanyId(companyId);
    try {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync", companyId }),
      });
      const data = await res.json();
      if (data.ok) {
        toast(`Sincronização de ${companyName} concluída! Novas: ${data.result?.new || 0}`, "success");
        queryClient.invalidateQueries({ queryKey: ["target-companies"] });
        queryClient.invalidateQueries({ queryKey: ["sources-jobs"] });
      } else {
        toast(data.error || "Erro ao sincronizar empresa", "error");
      }
    } catch {
      toast("Erro de conexão", "error");
    }
    setSyncingCompanyId(null);
  };

  // Detect Single Company ATS
  const detectOneCompany = async (companyId: string, companyName: string) => {
    setDetectingCompanyId(companyId);
    try {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "detect", companyId }),
      });
      const data = await res.json();
      if (data.ok) {
        toast(`Detecção de ${companyName} concluída: ${data.result?.detectedAts || "desconhecido"}`, "success");
        queryClient.invalidateQueries({ queryKey: ["target-companies"] });
      } else {
        toast(data.error || "Erro ao detectar ATS", "error");
      }
    } catch {
      toast("Erro de conexão", "error");
    }
    setDetectingCompanyId(null);
  };

  // Detect ATS for all unknown companies (Batch of 15)
  const detectAllCompanies = async () => {
    setRunningDetectAll(true);
    try {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "detect" }),
      });
      const data = await res.json();
      if (data.ok) {
        toast(`Varredura concluída: ${data.detected || 0} novas plataformas identificadas de ${data.scanned || 0} escaneadas.`, "success");
        queryClient.invalidateQueries({ queryKey: ["target-companies"] });
      } else {
        toast("Erro ao varrer empresas", "error");
      }
    } catch {
      toast("Erro de conexão", "error");
    }
    setRunningDetectAll(false);
  };

  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName) {
      toast("Nome da empresa é obrigatório", "error");
      return;
    }
    setAddingCompany(true);
    try {
      const finalCareersUrl = newCompanyCareersUrl || (newCompanyAtsType === "greenhouse" 
        ? `https://boards.greenhouse.io/${newCompanyDomain || newCompanyName.toLowerCase()}` 
        : newCompanyAtsType === "lever"
        ? `https://jobs.lever.co/${newCompanyDomain || newCompanyName.toLowerCase()}`
        : newCompanyAtsType === "ashby"
        ? `https://jobs.ashbyhq.com/${newCompanyDomain || newCompanyName.toLowerCase()}`
        : newCompanyAtsType === "gupy"
        ? `https://${newCompanyDomain || newCompanyName.toLowerCase()}.gupy.io`
        : "");

      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCompanyName,
          careersUrl: finalCareersUrl,
          atsType: newCompanyAtsType,
          sector: newCompanySector,
          priority: newCompanyPriority,
          isActive: true,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        toast(`Empresa ${newCompanyName} adicionada!`, "success");
        setNewCompanyName("");
        setNewCompanyDomain("");
        setNewCompanyCareersUrl("");
        queryClient.invalidateQueries({ queryKey: ["target-companies"] });
      } else {
        toast("Erro ao adicionar empresa", "error");
      }
    } catch {
      toast("Erro de conexão", "error");
    }
    setAddingCompany(false);
  };

  const toggleCompanyActive = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch("/api/companies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !currentActive }),
      });
      const data = await res.json();
      if (data.ok) {
        toast("Configuração atualizada", "success");
        queryClient.invalidateQueries({ queryKey: ["target-companies"] });
      } else {
        toast("Erro ao atualizar", "error");
      }
    } catch {
      toast("Erro de conexão", "error");
    }
  };

  const healthIcon: Record<string, any> = { healthy: CheckCircle2, warning: AlertTriangle, inactive: XCircle, error: XCircle };
  const healthColor: Record<string, string> = { healthy: "text-success", warning: "text-warning", inactive: "text-text-tertiary", error: "text-danger" };

  return (
    <div className="px-6 pt-4 pb-16 max-w-4xl mx-auto">
      {/* Title */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Fontes</h1>
          <p className="text-sm text-text-secondary mt-1">
            Gerencie conectores de vagas e watchlist de empresas-alvo
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-4 mb-6">
        <button
          onClick={() => setActiveTab("channels")}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === "channels"
              ? "bg-bg-elevated text-text-primary shadow-sm border border-border/80"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          🔌 Conectores Gerais
        </button>
        <button
          onClick={() => setActiveTab("companies")}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === "companies"
              ? "bg-bg-elevated text-text-primary shadow-sm border border-border/80"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          🏢 Empresas Monitoradas ({companies?.length || 0})
        </button>
      </div>

      {activeTab === "channels" && (
        <>
          {/* Sincronizar Tudo */}
          <div className="flex justify-between items-center mb-4 bg-bg p-3 rounded-lg border border-border">
            <span className="text-xs text-text-secondary">Sincronizar todos os conectores de vagas em background</span>
            <Button variant="primary" size="sm" onClick={syncAll} disabled={syncingAll}>
              {syncingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              {syncingAll ? "Sincronizando..." : "Sincronizar tudo"}
            </Button>
          </div>

          {/* Connectors List */}
          <div className="space-y-2 mb-8">
            {(apiData?.connectors || []).map((c) => {
              const h = health(c.name);
              const HI = healthIcon[h.status];
              const Icon = ICON_MAP[c.id] || Cable;
              const stats = connectorStats.get(c.id) || { total: 0, relevant: 0, pipeline: 0, applied: 0 };
              const conversion = stats.total > 0 ? Math.round((stats.pipeline / stats.total) * 100) : 0;

              return (
                <Card key={c.id}>
                  <CardContent className="py-3.5 px-4">
                    <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-bg-elevated">
                          <Icon className="h-4 w-4 text-text-secondary" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-text-primary truncate">{c.name}</span>
                            {c.jobCount > 0 && <Badge variant="accent" className="text-[10px] shrink-0">{c.jobCount} vagas</Badge>}
                            <HI className={`h-3 w-3 shrink-0 ${healthColor[h.status]}`} title={h.label} />
                            <span className="text-[10px] text-text-tertiary">
                              • Fit: <span className="text-emerald-500 font-semibold">{stats.relevant}</span> relevantes
                              • Conv: <span className="text-accent font-bold">{conversion}%</span>
                            </span>
                          </div>
                          <p className="text-[11px] text-text-secondary truncate mt-0.5">{DESC_MAP[c.id] || ""}</p>
                          {h.lastLog && (
                            <p className="text-[10px] text-text-tertiary mt-1">
                              Sincronizado: {new Date(h.lastLog.runAt).toLocaleString("pt-BR")} — {h.lastLog.jobsNew || 0} novas, {h.lastLog.jobsDuplicate || 0} dup. {h.lastLog.durationMs ? `(${(h.lastLog.durationMs / 1000).toFixed(1)}s)` : ""}
                            </p>
                          )}
                          {!h.lastLog && <p className="text-[10px] text-text-tertiary mt-1">Nunca sincronizado</p>}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" disabled={syncing === c.id || syncingAll} onClick={() => syncOne(c.id)} className="shrink-0 h-8">
                        <RefreshCw className={`h-3.5 w-3.5 ${syncing === c.id ? "animate-spin" : ""}`} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Import Manual */}
          <Card className="mb-6">
            <CardHeader><h2 className="text-sm font-semibold text-text-primary">Importação Manual</h2></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 rounded-lg border border-dashed p-3">
                <Link2 className="h-4 w-4 text-text-tertiary" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary">Importar por link</p>
                  <p className="text-xs text-text-tertiary">Cole a URL da vaga (LinkedIn, Gupy, etc.)</p>
                </div>
                <Button variant="secondary" size="sm"><Upload className="h-3 w-3" />Importar</Button>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-dashed p-3">
                <FileSpreadsheet className="h-4 w-4 text-text-tertiary" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary">Importar planilha CSV</p>
                  <p className="text-xs text-text-tertiary">Envie um arquivo estruturado com vagas</p>
                </div>
                <Button variant="secondary" size="sm"><Upload className="h-3 w-3" />Upload CSV</Button>
              </div>
            </CardContent>
          </Card>

          {/* History */}
          {apiData?.logs && apiData.logs.length > 0 && (
            <Card>
              <CardHeader><h2 className="text-sm font-semibold text-text-primary flex items-center gap-2"><History className="h-4 w-4 text-text-tertiary" />Histórico de Sincronizações</h2></CardHeader>
              <CardContent>
                <div className="space-y-1 max-h-48 overflow-y-auto text-xs">
                  {apiData.logs.slice().reverse().slice(0, 25).map((log, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 py-1 border-b border-border last:border-0 text-text-secondary">
                      <span className="font-semibold truncate w-28 text-text-primary">{log.connectorName}</span>
                      <span className="shrink-0">{new Date(log.runAt).toLocaleString("pt-BR")}</span>
                      <span className="shrink-0 font-medium text-accent">{log.jobsNew || 0} novas</span>
                      {log.durationMs && <span className="text-text-tertiary shrink-0">{(log.durationMs / 1000).toFixed(1)}s</span>}
                      {log.errorMessage && <span className="text-danger font-semibold shrink-0" title={log.errorMessage}>Falhou</span>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {activeTab === "companies" && (
        <>
          {/* COBERTURA BRASIL DASHBOARD */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
              <Activity className="h-5 w-5 text-accent" />
              Cobertura Brasil
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {/* Stat 1: Geral */}
              <Card className="bg-bg-elevated/40 border-border/80">
                <CardContent className="p-4">
                  <span className="text-[10px] uppercase font-bold text-text-tertiary">Monitoramento</span>
                  <div className="text-2xl font-bold mt-1 text-text-primary">
                    {companyStats.total} <span className="text-xs font-normal text-text-secondary">empresas</span>
                  </div>
                  <div className="flex gap-2 mt-2 text-[10px] text-text-secondary">
                    <span className="text-warning font-medium">{companyStats.neverSynced} pendentes</span>
                    <span>•</span>
                    <span className="text-danger font-medium">{companyStats.withError} com erro</span>
                  </div>
                </CardContent>
              </Card>

              {/* Stat 2: ATS */}
              <Card className="bg-bg-elevated/40 border-border/80">
                <CardContent className="p-4">
                  <span className="text-[10px] uppercase font-bold text-text-tertiary">Plataformas ATS</span>
                  <div className="grid grid-cols-3 gap-1 mt-1 text-[11px] font-semibold text-text-primary">
                    <div>Gupy: <span className="text-accent">{companyStats.byAts.gupy || 0}</span></div>
                    <div>Green: <span className="text-emerald-500">{companyStats.byAts.greenhouse || 0}</span></div>
                    <div>Lever: <span className="text-purple-500">{companyStats.byAts.lever || 0}</span></div>
                    <div>Ashby: <span className="text-pink-500">{companyStats.byAts.ashby || 0}</span></div>
                    <div>Custom: <span className="text-blue-500">{companyStats.byAts.custom || 0}</span></div>
                    <div>Outro: <span className="text-text-tertiary">{companyStats.byAts.unknown || 0}</span></div>
                  </div>
                </CardContent>
              </Card>

              {/* Stat 3: Eficiência */}
              <Card className="bg-bg-elevated/40 border-border/80">
                <CardContent className="p-4">
                  <span className="text-[10px] uppercase font-bold text-text-tertiary">Aproveitamento</span>
                  <div className="text-2xl font-bold mt-1 text-emerald-500">
                    {companyStats.withRelevant} <span className="text-xs font-normal text-text-secondary">fontes ativas</span>
                  </div>
                  <div className="text-[10px] text-text-tertiary mt-2">
                    Empresas que trouxeram vagas compatíveis com o perfil do Felipe
                  </div>
                </CardContent>
              </Card>

              {/* Stat 4: Top Fontes */}
              <Card className="bg-bg-elevated/40 border-border/80">
                <CardContent className="p-4">
                  <span className="text-[10px] uppercase font-bold text-text-tertiary flex items-center gap-1">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-500" /> Melhores Fontes
                  </span>
                  <div className="mt-1 space-y-1 max-h-[50px] overflow-y-auto text-[10px] text-text-secondary">
                    {companyStats.topUsefulness.length === 0 ? (
                      <span className="text-text-tertiary">Nenhum dado de aproveitamento</span>
                    ) : (
                      companyStats.topUsefulness.map((c) => (
                        <div key={c.id} className="flex justify-between">
                          <span className="truncate pr-1 font-medium">{c.name}</span>
                          <span className="text-accent font-bold shrink-0">{(c.usefulnessRate * 100).toFixed(0)}% fit</span>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* ACTION BUTTONS & ACTIONS PANEL */}
          <div className="mb-6 bg-bg-elevated/30 border border-border p-4 rounded-xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-text-primary">Ações de Sincronização Lote</h3>
                <p className="text-xs text-text-tertiary">Controle granular da fila de rastreamento local</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={handleImportWatchlist}
                  disabled={importingWatchlist}
                >
                  {importingWatchlist ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                  Importar Watchlist (JSON)
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={detectAllCompanies}
                  disabled={runningDetectAll}
                >
                  {runningDetectAll ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bot className="h-3.5 w-3.5" />}
                  Detectar ATS em Lote
                </Button>
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={() => syncFilteredCompanies({ priority: "P0" })} 
                  disabled={syncingCompanies}
                  className="bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20"
                >
                  Sync P0
                </Button>
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={() => syncFilteredCompanies({ priority: "P1" })} 
                  disabled={syncingCompanies}
                  className="bg-purple-500/10 text-purple-500 border border-purple-500/20 hover:bg-purple-500/20"
                >
                  Sync P1
                </Button>
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={() => syncFilteredCompanies({ priority: "P2" })} 
                  disabled={syncingCompanies}
                  className="bg-blue-500/10 text-blue-500 border border-blue-500/20 hover:bg-blue-500/20"
                >
                  Sync P2
                </Button>
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={syncCompanies} 
                  disabled={syncingCompanies}
                >
                  {syncingCompanies ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                  Sincronizar Todas
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* COLUMN 1: FILTERS & ADD COMPANY FORM */}
            <div className="lg:col-span-1 space-y-6">
              {/* FILTROS E BUSCA */}
              <Card>
                <CardHeader className="pb-3">
                  <h3 className="text-sm font-semibold text-text-primary flex items-center justify-between">
                    <span>Filtros da Watchlist</span>
                    {(searchQuery || filterSector || filterPriority || filterStatus || filterAts) && (
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setFilterSector("");
                          setFilterPriority("");
                          setFilterStatus("");
                          setFilterAts("");
                        }}
                        className="text-[10px] text-accent hover:underline flex items-center gap-0.5"
                      >
                        <FilterX className="h-3 w-3" /> Limpar
                      </button>
                    )}
                  </h3>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-text-tertiary mb-1 block">Buscar por Nome</label>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-text-tertiary" />
                      <Input
                        placeholder="Ex: Nubank, PicPay..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-text-tertiary mb-1 block">Setor</label>
                    <Select
                      value={filterSector}
                      onChange={(e) => setFilterSector(e.target.value)}
                      className="w-full text-xs"
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
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-text-tertiary mb-1 block">Prioridade</label>
                      <Select
                        value={filterPriority}
                        onChange={(e) => setFilterPriority(e.target.value)}
                        className="w-full text-xs"
                      >
                        <option value="">Todas</option>
                        <option value="P0">P0 (Alta)</option>
                        <option value="P1">P1 (Média)</option>
                        <option value="P2">P2 (Baixa)</option>
                      </Select>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-text-tertiary mb-1 block">Status Sync</label>
                      <Select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full text-xs"
                      >
                        <option value="">Todos</option>
                        <option value="active">Ativo</option>
                        <option value="paused">Pausado</option>
                        <option value="error">Com Erro</option>
                        <option value="never_synced">Pendente</option>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-text-tertiary mb-1 block">Plataforma ATS</label>
                    <Select
                      value={filterAts}
                      onChange={(e) => setFilterAts(e.target.value)}
                      className="w-full text-xs"
                    >
                      <option value="">Todas</option>
                      <option value="greenhouse">Greenhouse</option>
                      <option value="lever">Lever</option>
                      <option value="ashby">AshbyHQ</option>
                      <option value="gupy">Gupy</option>
                      <option value="custom">Custom (JobPosting)</option>
                      <option value="unknown">Desconhecido</option>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* ADICIONAR EMPRESA MANUAL */}
              <Card>
                <CardHeader className="pb-3">
                  <h3 className="text-sm font-semibold text-text-primary">Adicionar Empresa Manual</h3>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddCompany} className="space-y-3">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-text-tertiary mb-1 block">Nome da Empresa</label>
                      <Input
                        placeholder="Ex: Nubank, iFood"
                        value={newCompanyName}
                        onChange={(e) => setNewCompanyName(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-text-tertiary mb-1 block">Slug / Domínio ATS</label>
                      <Input
                        placeholder="Ex: nubank, ifood"
                        value={newCompanyDomain}
                        onChange={(e) => setNewCompanyDomain(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-text-tertiary mb-1 block">ATS (Plataforma)</label>
                      <Select
                        value={newCompanyAtsType}
                        onChange={(e) => setNewCompanyAtsType(e.target.value as any)}
                        className="w-full text-xs"
                      >
                        <option value="greenhouse">Greenhouse</option>
                        <option value="lever">Lever</option>
                        <option value="ashby">AshbyHQ</option>
                        <option value="gupy">Gupy</option>
                        <option value="custom">Custom (JobPosting)</option>
                        <option value="unknown">Desconhecido</option>
                      </Select>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-text-tertiary mb-1 block">URL de Carreiras (Opcional)</label>
                      <Input
                        placeholder="Ex: https://jobs.lever.co/..."
                        value={newCompanyCareersUrl}
                        onChange={(e) => setNewCompanyCareersUrl(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-text-tertiary mb-1 block">Setor</label>
                      <Select
                        value={newCompanySector}
                        onChange={(e) => setNewCompanySector(e.target.value)}
                        className="w-full text-xs"
                      >
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
                    <div>
                      <label className="text-[10px] uppercase font-bold text-text-tertiary mb-1 block">Prioridade</label>
                      <Select
                        value={newCompanyPriority}
                        onChange={(e) => setNewCompanyPriority(e.target.value)}
                        className="w-full text-xs"
                      >
                        <option value="P0">P0 (Rastreamento diário)</option>
                        <option value="P1">P1 (Rastreamento 48h)</option>
                        <option value="P2">P2 (Rastreamento semanal)</option>
                      </Select>
                    </div>
                    <Button variant="primary" type="submit" disabled={addingCompany} className="w-full mt-2">
                      {addingCompany ? "Adicionando..." : <Plus className="h-3.5 w-3.5 font-bold" />}
                      Adicionar Empresa
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* COLUMN 2: MONITORED COMPANIES LISTING */}
            <div className="lg:col-span-2 space-y-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-tertiary">
                  Empresas na Fila ({filteredCompanies.length})
                </h3>
              </div>

              {filteredCompanies.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/80 p-12 text-center bg-bg-elevated/20">
                  <Building2 className="h-8 w-8 mx-auto text-text-tertiary mb-2" />
                  <p className="text-sm text-text-secondary font-medium">Nenhuma empresa encontrada</p>
                  <p className="text-xs text-text-tertiary mt-1">
                    Revise os filtros acima ou importe a watchlist brasileira para começar.
                  </p>
                </div>
              ) : (
                filteredCompanies.map((company) => {
                  const hasError = !!company.lastError;
                  const isEditing = editingCompanyId === company.id;
                  
                  // Style colors based on priority
                  let priorityBadgeColor = "bg-bg-elevated text-text-secondary border-border/80";
                  if (company.priority === "P0") priorityBadgeColor = "bg-red-500/10 text-red-500 border-red-500/20";
                  else if (company.priority === "P1") priorityBadgeColor = "bg-purple-500/10 text-purple-500 border-purple-500/20";
                  else if (company.priority === "P2") priorityBadgeColor = "bg-blue-500/10 text-blue-500 border-blue-500/20";

                  // Color indicator dot for status
                  let statusDotColor = "bg-text-tertiary";
                  let statusLabel = "Pausado";
                  if (company.isActive) {
                    if (company.status === "never_synced") {
                      statusDotColor = "bg-warning";
                      statusLabel = "Pendente Sync";
                    } else if (hasError) {
                      statusDotColor = "bg-danger";
                      statusLabel = "Erro de Sincronização";
                    } else {
                      statusDotColor = "bg-success";
                      statusLabel = "Sincronizado";
                    }
                  }

                  return (
                    <Card key={company.id} className={company.isActive ? "border-border/80" : "opacity-55 border-border/40"}>
                      <CardContent className="p-4">
                        {isEditing ? (
                          /* EDITING PANEL */
                          <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-border pb-2 mb-2">
                              <h4 className="text-sm font-bold text-text-primary">Editar {company.name}</h4>
                              <span className="text-[10px] text-text-tertiary">ID: {company.id}</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="text-[10px] uppercase font-bold text-text-tertiary mb-1 block">URL de Carreiras</label>
                                <Input
                                  value={editCareerUrl}
                                  onChange={(e) => setEditCareerUrl(e.target.value)}
                                  placeholder="https://..."
                                  className="text-xs"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] uppercase font-bold text-text-tertiary mb-1 block">Plataforma ATS</label>
                                <Select
                                  value={editAtsType}
                                  onChange={(e) => setEditAtsType(e.target.value)}
                                  className="w-full text-xs"
                                >
                                  <option value="greenhouse">Greenhouse</option>
                                  <option value="lever">Lever</option>
                                  <option value="ashby">AshbyHQ</option>
                                  <option value="gupy">Gupy</option>
                                  <option value="custom">Custom (JobPosting)</option>
                                  <option value="unknown">Desconhecido</option>
                                </Select>
                              </div>
                              <div>
                                <label className="text-[10px] uppercase font-bold text-text-tertiary mb-1 block">Prioridade</label>
                                <Select
                                  value={editPriority}
                                  onChange={(e) => setEditPriority(e.target.value)}
                                  className="w-full text-xs"
                                >
                                  <option value="P0">P0 (Rastreamento diário)</option>
                                  <option value="P1">P1 (Rastreamento 48h)</option>
                                  <option value="P2">P2 (Rastreamento semanal)</option>
                                </Select>
                              </div>
                              <div>
                                <label className="text-[10px] uppercase font-bold text-text-tertiary mb-1 block">Setor</label>
                                <Select
                                  value={editSector}
                                  onChange={(e) => setEditSector(e.target.value)}
                                  className="w-full text-xs"
                                >
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
                            </div>
                            <div>
                              <label className="text-[10px] uppercase font-bold text-text-tertiary mb-1 block">Notas do Monitoramento</label>
                              <Input
                                value={editNotes}
                                onChange={(e) => setEditNotes(e.target.value)}
                                placeholder="Por que monitorar essa empresa, vaga desejada, dicas..."
                                className="text-xs"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id={`edit-active-${company.id}`}
                                checked={editIsActive}
                                onChange={(e) => setEditIsActive(e.target.checked)}
                                className="rounded border-border text-accent focus:ring-accent bg-bg h-4 w-4"
                              />
                              <label htmlFor={`edit-active-${company.id}`} className="text-xs font-semibold text-text-primary cursor-pointer select-none">
                                Rastreamento Ativo
                              </label>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                              <Button variant="secondary" size="sm" onClick={() => setEditingCompanyId(null)}>
                                Cancelar
                              </Button>
                              <Button variant="primary" size="sm" onClick={() => handleSaveCompanyEdit(company.id)}>
                                Salvar Alterações
                              </Button>
                            </div>
                          </div>
                        ) : (
                          /* STANDARD DISPLAY PANEL */
                          <div className="space-y-2.5">
                            {/* Line 1: Name, Badges, Status Dot */}
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2 flex-wrap min-w-0">
                                <h4 className="text-sm font-semibold text-text-primary truncate">{company.name}</h4>
                                <Badge className={`text-[9px] font-bold uppercase ${priorityBadgeColor}`}>
                                  {company.priority || "P2"}
                                </Badge>
                                <Badge className="text-[9px] bg-bg-elevated border-border text-text-secondary uppercase">
                                  {company.detectedAts || "desconhecido"}
                                </Badge>
                                <div className="flex items-center gap-1 text-[10px] text-text-secondary shrink-0">
                                  <span className={`h-2 w-2 rounded-full ${statusDotColor}`} title={statusLabel} />
                                  <span className="text-[9px] text-text-tertiary">{statusLabel}</span>
                                </div>
                              </div>
                              
                              {/* Main Toggle / Actions */}
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => toggleCompanyActive(company.id, company.isActive)}
                                  className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-all ${
                                    company.isActive
                                      ? "bg-bg text-text-secondary border-border hover:bg-bg-elevated"
                                      : "bg-accent/10 text-accent border-accent/20 hover:bg-accent/20"
                                  }`}
                                >
                                  {company.isActive ? "Pausar" : "Ativar"}
                                </button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => startEditCompany(company)}
                                  className="h-6 w-6 p-0"
                                  title="Editar configurações"
                                >
                                  <Settings2 className="h-3 w-3 text-text-secondary hover:text-text-primary" />
                                </Button>
                              </div>
                            </div>

                            {/* Line 2: Sector and Notes */}
                            <div className="text-[11px] text-text-secondary">
                              <p className="font-medium text-text-tertiary">{company.sector || "Setor não especificado"}</p>
                              {company.notes && (
                                <p className="text-[10px] text-text-secondary mt-1 bg-bg/50 px-2.5 py-1 rounded border border-border/40 font-serif italic">
                                  "{company.notes}"
                                </p>
                              )}
                            </div>

                            {/* Line 3: Stats Row & Career Links */}
                            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-border/40 text-[10px] text-text-tertiary">
                              <div className="flex items-center gap-3">
                                <span>Coletadas: <strong className="text-text-primary">{company.totalJobsFound || 0}</strong></span>
                                <span>Fit: <strong className="text-emerald-500">{company.totalRelevantJobs || 0}</strong></span>
                                <span>Salvas: <strong className="text-accent">{company.totalSavedJobs || 0}</strong></span>
                                <span>Aplicadas: <strong className="text-text-primary">{company.totalAppliedJobs || 0}</strong></span>
                                {company.totalJobsFound > 0 && (
                                  <span>Fit Rate: <strong className="text-text-primary">{(company.usefulnessRate * 100).toFixed(0)}%</strong></span>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2">
                                {company.careerUrl && (
                                  <a
                                    href={company.careerUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-accent hover:underline flex items-center gap-0.5"
                                  >
                                    Portal oficial <ExternalLink className="h-2 w-2" />
                                  </a>
                                )}
                                <a
                                  href={`/explore?query=${encodeURIComponent(company.name)}`}
                                  className="text-text-secondary hover:text-text-primary flex items-center gap-0.5 hover:underline ml-1"
                                >
                                  Ver Vagas <Eye className="h-2.5 w-2.5" />
                                </a>
                              </div>
                            </div>

                            {/* Error Message display */}
                            {hasError && company.isActive && (
                              <div className="text-[9px] text-danger bg-danger/5 px-2.5 py-1.5 rounded border border-danger/10 font-mono mt-1 whitespace-pre-wrap">
                                Erro: {company.lastError}
                              </div>
                            )}

                            {/* Action Buttons: Sync & Detect Inline */}
                            {company.isActive && (
                              <div className="flex justify-end gap-1.5 pt-1.5">
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  className="h-6 text-[10px] px-2"
                                  onClick={() => detectOneCompany(company.id, company.name)}
                                  disabled={detectingCompanyId === company.id}
                                >
                                  {detectingCompanyId === company.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Bot className="h-3 w-3 mr-1" />}
                                  Detectar ATS
                                </Button>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  className="h-6 text-[10px] px-2"
                                  onClick={() => syncOneCompany(company.id, company.name)}
                                  disabled={syncingCompanyId === company.id}
                                >
                                  {syncingCompanyId === company.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <RefreshCw className="h-3 w-3 mr-1" />}
                                  Sync Agora
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
