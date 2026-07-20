"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FolderKanban, RefreshCw, ExternalLink } from "lucide-react";
import Link from "next/link";

type Evidence = {
  id: string;
  projectName: string;
  projectUrl: string | null;
  description: string | null;
  metrics: string | null;
  metricKind: string | null;
  confidence: string;
  associatedSkills: string[];
  approvedResumeBullet: string | null;
  verifiedByUser: boolean | null;
};

type CoverageResponse = {
  source: string;
  evidenceCount: number;
  heatmap: {
    strong: { skill: string; label: string; jobDemand: number }[];
    partial: { skill: string; label: string; jobDemand: number }[];
    pending: { skill: string; label: string; jobDemand: number }[];
    unregistered: { skill: string; label: string; jobDemand: number }[];
    realGaps: { skill: string; label: string; jobDemand: number }[];
    inLearning: { skill: string; label: string; jobDemand: number }[];
  };
};

export function EvidenceClient() {
  const qc = useQueryClient();
  const { data: evidences, isLoading } = useQuery({
    queryKey: ["evidences"],
    queryFn: async () => {
      const res = await fetch("/api/evidences");
      return res.json() as Promise<Evidence[]>;
    },
  });

  const { data: coverage, isFetching: coverageLoading } = useQuery({
    queryKey: ["coverage"],
    queryFn: async () => {
      const res = await fetch("/api/coverage");
      return res.json() as Promise<CoverageResponse>;
    },
  });

  const recalc = () => {
    qc.invalidateQueries({ queryKey: ["coverage"] });
    qc.invalidateQueries({ queryKey: ["evidences"] });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary flex items-center gap-2">
            <FolderKanban className="h-5 w-5 text-accent" />
            Evidence Vault
          </h1>
          <p className="text-sm text-text-tertiary mt-1">
            Projetos e claims defendíveis. O heatmap distingue gap real de evidência não cadastrada.
          </p>
        </div>
        <Button size="sm" variant="secondary" onClick={recalc} className="text-xs gap-1.5">
          <RefreshCw className={`h-3.5 w-3.5 ${coverageLoading ? "animate-spin" : ""}`} />
          Recalcular cobertura a partir das evidências
        </Button>
      </div>

      {coverage && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { key: "strong", title: "Forte", items: coverage.heatmap.strong, variant: "success" as const },
            { key: "partial", title: "Parcial", items: coverage.heatmap.partial, variant: "warning" as const },
            {
              key: "unregistered",
              title: "Evidência não cadastrada",
              items: coverage.heatmap.unregistered,
              variant: "accent" as const,
            },
            { key: "realGaps", title: "Gap real", items: coverage.heatmap.realGaps, variant: "danger" as const },
            { key: "pending", title: "Pendente", items: coverage.heatmap.pending, variant: "default" as const },
            {
              key: "inLearning",
              title: "Em estudo",
              items: coverage.heatmap.inLearning,
              variant: "default" as const,
            },
          ].map((bucket) => (
            <Card key={bucket.key}>
              <CardHeader className="pb-2">
                <h2 className="text-xs font-semibold text-text-primary">
                  {bucket.title} · {bucket.items.length}
                </h2>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-1">
                {bucket.items.length === 0 ? (
                  <span className="text-[11px] text-text-tertiary">—</span>
                ) : (
                  bucket.items.slice(0, 12).map((s) => (
                    <Badge key={s.skill} variant={bucket.variant} className="text-[10px]">
                      {s.skill}
                      {s.jobDemand >= 2 ? ` ·${s.jobDemand}` : ""}
                    </Badge>
                  ))
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-text-primary">
            Projetos ({evidences?.length ?? 0})
            {coverage && (
              <span className="text-[10px] font-normal text-text-tertiary ml-2">
                fonte: {coverage.source}
              </span>
            )}
          </h2>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading && <p className="text-sm text-text-tertiary">Carregando…</p>}
          {!isLoading && (!evidences || evidences.length === 0) && (
            <p className="text-sm text-text-tertiary">
              Nenhuma evidência na vault. Rode <code className="text-xs">npm run career:seed</code> ou
              cadastre no{" "}
              <Link href="/profile" className="text-accent underline">
                perfil
              </Link>
              .
            </p>
          )}
          {evidences?.map((ev) => (
            <div
              key={ev.id}
              className="rounded-lg border border-border/60 bg-bg-elevated/20 p-4 text-left"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-text-primary">{ev.projectName}</p>
                  <p className="text-[11px] text-text-tertiary mt-1 line-clamp-2">
                    {ev.description || "Sem descrição"}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Badge variant={ev.confidence === "high" ? "success" : "warning"} className="text-[10px]">
                    {ev.confidence}
                  </Badge>
                  {ev.metricKind && (
                    <Badge className="text-[10px]">{ev.metricKind}</Badge>
                  )}
                </div>
              </div>
              {ev.metrics && (
                <p className="text-[11px] text-text-secondary mt-2 border-l-2 border-accent/40 pl-2">
                  {ev.metrics}
                </p>
              )}
              {ev.approvedResumeBullet && (
                <p className="text-[11px] text-text-secondary mt-2 italic">
                  “{ev.approvedResumeBullet}”
                </p>
              )}
              <div className="flex flex-wrap gap-1 mt-3">
                {(ev.associatedSkills || []).map((s) => (
                  <Badge key={s} className="text-[10px]">
                    {s}
                  </Badge>
                ))}
              </div>
              {ev.projectUrl && (
                <a
                  href={ev.projectUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-accent mt-3"
                >
                  Repositório <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
