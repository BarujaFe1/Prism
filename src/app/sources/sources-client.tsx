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
  domain: string;
  careersUrl: string | null;
  atsType: "greenhouse" | "lever" | "ashby" | "workday" | "custom";
  lastCrawledAt: string | null;
  lastError: string | null;
  isActive: boolean;
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
  const [addingCompany, setAddingCompany] = useState(false);
  const [syncingCompanies, setSyncingCompanies] = useState(false);

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

  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName || !newCompanyDomain) {
      toast("Nome e Domínio/Slug são obrigatórios", "error");
      return;
    }
    setAddingCompany(true);
    try {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCompanyName,
          domain: newCompanyDomain,
          careersUrl: newCompanyCareersUrl || (newCompanyAtsType === "greenhouse" 
            ? `https://boards.greenhouse.io/${newCompanyDomain}` 
            : newCompanyAtsType === "lever"
            ? `https://jobs.lever.co/${newCompanyDomain}`
            : `https://jobs.ashbyhq.com/${newCompanyDomain}`),
          atsType: newCompanyAtsType,
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
          {/* Actions & Summary */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-bg p-4 rounded-lg border border-border">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Crawl de Carreiras de Empresas</h3>
              <p className="text-xs text-text-tertiary mt-0.5">Visita os portais oficiais Greenhouse/Lever/Ashby cadastrados</p>
            </div>
            <Button variant="primary" size="sm" onClick={syncCompanies} disabled={syncingCompanies}>
              {syncingCompanies ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              {syncingCompanies ? "Sincronizando..." : "Sincronizar todas as empresas"}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Add Target Company */}
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <h3 className="text-sm font-semibold text-text-primary">Adicionar Empresa</h3>
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
                        className="w-full"
                      >
                        <option value="greenhouse">Greenhouse</option>
                        <option value="lever">Lever</option>
                        <option value="ashby">AshbyHQ</option>
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
                    <Button variant="primary" type="submit" disabled={addingCompany} className="w-full mt-2">
                      {addingCompany ? "Adicionando..." : <Plus className="h-3.5 w-3.5" />}
                      Adicionar Empresa
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Target Companies List */}
            <div className="md:col-span-2 space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-3">Empresas Monitoradas</h3>
              
              {(!companies || companies.length === 0) ? (
                <div className="rounded-xl border border-dashed p-12 text-center">
                  <Building2 className="h-8 w-8 mx-auto text-text-tertiary mb-2" />
                  <p className="text-sm text-text-secondary font-medium">Watchlist vazia</p>
                  <p className="text-xs text-text-tertiary mt-1">
                    Adicione empresas ao lado para monitorar portais de carreiras.
                  </p>
                </div>
              ) : (
                companies.map((company) => {
                  const hasError = !!company.lastError;
                  return (
                    <Card key={company.id} className={company.isActive ? "" : "opacity-50"}>
                      <CardContent className="py-3 px-4 flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-semibold text-text-primary truncate">{company.name}</h4>
                            <Badge className="text-[9px] uppercase">{company.atsType}</Badge>
                            {company.isActive ? (
                              <Badge variant="success" className="text-[9px] px-1 py-0">Ativo</Badge>
                            ) : (
                              <Badge variant="default" className="text-[9px] px-1 py-0">Pausado</Badge>
                            )}
                            {company.lastCrawledAt && !hasError && (
                              <span title="Sincronizado">
                                <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                              </span>
                            )}
                            {hasError && (
                              <span title={company.lastError || "Erro de Sync"}>
                                <AlertTriangle className="h-3.5 w-3.5 text-danger shrink-0" />
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-[10px] text-text-tertiary mt-1">
                            <span>Slug: <code>{company.domain}</code></span>
                            {company.careersUrl && (
                              <a href={company.careersUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline inline-flex items-center gap-0.5">
                                Ver portal <ExternalLink className="h-2 w-2" />
                              </a>
                            )}
                            {company.lastCrawledAt && (
                              <span>• Sync: {new Date(company.lastCrawledAt).toLocaleString("pt-BR")}</span>
                            )}
                          </div>
                          {hasError && (
                            <p className="text-[9px] text-danger mt-1 bg-danger/5 px-2 py-1 rounded border border-danger/10 truncate font-mono">
                              Erro: {company.lastError}
                            </p>
                          )}
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => toggleCompanyActive(company.id, company.isActive)}
                            className={`px-2 py-1 rounded-md text-xs font-semibold border ${
                              company.isActive
                                ? "bg-bg text-text-secondary border-border hover:bg-bg-elevated"
                                : "bg-accent/10 text-accent border-accent/20 hover:bg-accent/20"
                            }`}
                          >
                            {company.isActive ? "Pausar" : "Ativar"}
                          </button>
                        </div>
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
