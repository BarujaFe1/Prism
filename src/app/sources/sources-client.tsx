"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Cable, Globe, Loader2, RefreshCw, CheckCircle2, XCircle,
  AlertTriangle, History, Upload, Link2, FileSpreadsheet, Bot,
  Database, Terminal, Search, ExternalLink,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";

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
  const [syncing, setSyncing] = useState<string | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);

  const { data: apiData } = useQuery({
    queryKey: ["sources-stats"],
    queryFn: async () => {
      const res = await fetch("/api/connectors");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json() as Promise<{ logs: ConnectorLog[]; connectors: ConnectorInfo[] }>;
    },
    staleTime: 15000,
  });

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
    } catch { toast("Erro de conexão", "error"); }
    setSyncingAll(false);
  };

  const healthIcon: Record<string, any> = { healthy: CheckCircle2, warning: AlertTriangle, inactive: XCircle, error: XCircle };
  const healthColor: Record<string, string> = { healthy: "text-success", warning: "text-warning", inactive: "text-text-tertiary", error: "text-danger" };

  return (
    <div className="px-6 pt-4 pb-16 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Fontes</h1>
          <p className="text-sm text-text-secondary mt-1">
            {apiData ? `${apiData.connectors.length} conectores · ${apiData.connectors.reduce((a, c) => a + c.jobCount, 0)} vagas no total` : "Carregando..."}
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={syncAll} disabled={syncingAll}>
          {syncingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {syncingAll ? "Sincronizando..." : "Sincronizar tudo"}
        </Button>
      </div>

      <div className="space-y-2 mb-8">
        {(apiData?.connectors || []).map((c) => {
          const h = health(c.name);
          const HI = healthIcon[h.status];
          const Icon = ICON_MAP[c.id] || Cable;
          return (
            <Card key={c.id}>
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-bg-elevated">
                      <Icon className="h-4 w-4 text-text-secondary" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-text-primary truncate">{c.name}</span>
                        {c.jobCount > 0 && <Badge variant="accent" className="text-[10px] shrink-0">{c.jobCount}</Badge>}
                        <HI className={`h-3 w-3 shrink-0 ${healthColor[h.status]}`} title={h.label} />
                      </div>
                      <p className="text-[11px] text-text-tertiary truncate">{DESC_MAP[c.id] || ""}</p>
                      {h.lastLog && (
                        <p className="text-[10px] text-text-tertiary mt-0.5">
                          {new Date(h.lastLog.runAt).toLocaleString("pt-BR")} — {h.lastLog.jobsNew || 0} novas, {h.lastLog.jobsDuplicate || 0} dup. {h.lastLog.durationMs ? `(${(h.lastLog.durationMs / 1000).toFixed(1)}s)` : ""}
                        </p>
                      )}
                      {!h.lastLog && <p className="text-[10px] text-text-tertiary mt-0.5">Nunca sincronizado</p>}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" disabled={syncing === c.id || syncingAll} onClick={() => syncOne(c.id)} className="shrink-0">
                    <RefreshCw className={`h-3.5 w-3.5 ${syncing === c.id ? "animate-spin" : ""}`} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader><h2 className="text-sm font-semibold text-text-primary">Importar manualmente</h2></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 rounded-lg border border-dashed p-3">
            <Link2 className="h-4 w-4 text-text-tertiary" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text-primary">Importar por link</p>
              <p className="text-xs text-text-tertiary">Cole a URL da vaga</p>
            </div>
            <Button variant="secondary" size="sm"><Upload className="h-3 w-3" />Importar</Button>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-dashed p-3">
            <FileSpreadsheet className="h-4 w-4 text-text-tertiary" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text-primary">Importar CSV</p>
              <p className="text-xs text-text-tertiary">Upload de planilha com vagas</p>
            </div>
            <Button variant="secondary" size="sm"><Upload className="h-3 w-3" />Upload</Button>
          </div>
        </CardContent>
      </Card>

      {apiData?.logs && apiData.logs.length > 0 && (
        <Card className="mt-6">
          <CardHeader><h2 className="text-sm font-semibold text-text-primary flex items-center gap-2"><History className="h-4 w-4 text-text-tertiary" />Histórico</h2></CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-48 overflow-y-auto text-xs">
              {apiData.logs.slice().reverse().slice(0, 30).map((log, i) => (
                <div key={i} className="flex items-center justify-between gap-2 py-1 border-b border-border last:border-0 text-text-secondary">
                  <span className="font-medium truncate w-24">{log.connectorName}</span>
                  <span className="shrink-0">{new Date(log.runAt).toLocaleString("pt-BR")}</span>
                  <span className="shrink-0">{log.jobsNew || 0} novas</span>
                  {log.durationMs && <span className="text-text-tertiary shrink-0">{(log.durationMs / 1000).toFixed(1)}s</span>}
                  {log.errorMessage && <span className="text-danger shrink-0" title={log.errorMessage}>Erro</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
