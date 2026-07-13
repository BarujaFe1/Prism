"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shell } from "@/components/layout/Shell";
import { ArrowLeft, ExternalLink, Users, Clock, TrendingUp, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { ViabilidadeFinanceira } from "@/components/freelance/ViabilidadeFinanceira";

interface FreelanceProjectDetail {
  id: string;
  title: string;
  clientName: string | null;
  clientRating: number | null;
  clientTotalSpent: number | null;
  clientHireRate: number | null;
  clientTotalHires: number | null;
  description: string | null;
  url: string;
  platform: string;
  projectType: string | null;
  duration: string | null;
  engagementType: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  budgetCurrency: string | null;
  hourlyRateMin: number | null;
  hourlyRateMax: number | null;
  skills: string | null;
  proposalsCount: number | null;
  fitScore: number | null;
  fitBreakdown: string | null;
  redFlags: string | null;
  opportunities: string | null;
  status: string;
  postedAt: string | null;
  collectedAt: string;
}

const PLATFORM_BG: Record<string, string> = {
  upwork: "bg-emerald-500/10 text-emerald-400",
  contra: "bg-violet-500/10 text-violet-400",
  malt: "bg-amber-500/10 text-amber-400",
  weworkremotely: "bg-blue-500/10 text-blue-400",
  freelancer: "bg-rose-500/10 text-rose-400",
  peopleperhour: "bg-cyan-500/10 text-cyan-400",
  remoteok: "bg-orange-500/10 text-orange-400",
  simplyhired: "bg-blue-500/10 text-blue-400",
};

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-text-tertiary">{label}</span>
        <span className="text-text-secondary font-medium">{value}/100</span>
      </div>
      <div className="h-1.5 bg-bg-elevated rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{
          width: `${value}%`,
          background: value >= 75 ? "linear-gradient(90deg, #22c55e, #16a34a)" : value >= 50 ? "#eab308" : "#ef4444",
        }} />
      </div>
    </div>
  );
}

export default function FreelanceDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: project, isLoading } = useQuery({
    queryKey: ["freelance-project", id],
    queryFn: async () => {
      const res = await fetch(`/api/freelance/projects?id=${id}`);
      const data = await res.json();
      return data.project as FreelanceProjectDetail;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-text-tertiary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="px-6 pt-4 pb-16 max-w-4xl mx-auto">
        <p className="text-text-secondary">Projeto não encontrado.</p>
        <Link href="/freelas" className="inline-flex mt-4 items-center justify-center rounded-lg text-xs font-medium h-8 px-3 gap-1.5 bg-bg-elevated text-text-primary hover:bg-border transition-all duration-200"><ArrowLeft className="h-3.5 w-3.5" /> Voltar</Link>
      </div>
    );
  }

  const breakdown = project.fitBreakdown ? JSON.parse(project.fitBreakdown) : null;
  const redFlags = project.redFlags ? JSON.parse(project.redFlags) : [];
  const greenFlags = project.opportunities ? JSON.parse(project.opportunities) : [];
  const skillsArray = project.skills ? JSON.parse(project.skills) : [];
  const openRate = project.proposalsCount != null && project.proposalsCount <= 5;

  return (
    <Shell>
    <div className="px-6 pt-4 pb-16 max-w-4xl mx-auto">
      <Link href="/freelas" className="inline-flex mb-4 items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-all duration-200"><ArrowLeft className="h-3.5 w-3.5" /> Voltar</Link>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          <Card>
            <CardContent className="py-4 px-5">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={PLATFORM_BG[project.platform] || "bg-gray-500/10 text-gray-400"}>{project.platform}</Badge>
                {project.projectType && <Badge className="border border-border">{project.projectType}</Badge>}
                {openRate && <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">Janela aberta</Badge>}
              </div>
              <h1 className="text-xl font-semibold text-text-primary mb-1">{project.title}</h1>
              {project.clientName && (
                <p className="text-sm text-text-secondary">{project.clientName}</p>
              )}
              {project.description && (
                <div className="mt-4 text-sm text-text-secondary leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
                  {project.description}
                </div>
              )}
            </CardContent>
          </Card>

          {skillsArray.length > 0 && (
            <Card>
              <CardHeader><h2 className="text-sm font-semibold text-text-primary">Skills Requeridas</h2></CardHeader>
              <CardContent className="pt-0 px-5 pb-4">
                <div className="flex gap-1.5 flex-wrap">
                  {skillsArray.map((s: string) => (
                    <span key={s} className="text-xs px-2 py-1 rounded-md bg-bg-elevated text-text-secondary border border-border">{s}</span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {redFlags.length > 0 && (
            <Card className="border-red-500/30">
              <CardHeader><h2 className="text-sm font-semibold text-red-400 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Red Flags</h2></CardHeader>
              <CardContent className="pt-0 px-5 pb-4 space-y-2">
                {redFlags.map((f: any, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-red-400 mt-0.5">⚠</span>
                    <span className="text-text-secondary">{f.message || f.label}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {greenFlags.length > 0 && (
            <Card className="border-green-500/30">
              <CardHeader><h2 className="text-sm font-semibold text-green-400 flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Oportunidades</h2></CardHeader>
              <CardContent className="pt-0 px-5 pb-4 space-y-2">
                {greenFlags.map((f: any, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span className="text-text-secondary">{f.message || f.label}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="py-4 px-5 space-y-3">
              {project.hourlyRateMin && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-amber-400">${project.hourlyRateMin}{project.hourlyRateMax ? `-${project.hourlyRateMax}` : ""}<span className="text-sm text-text-tertiary font-normal">/hr</span></p>
                </div>
              )}
              {project.budgetMin && (
                <div className="text-center">
                  <p className="text-xl font-semibold text-text-primary">{project.budgetCurrency || "$"}{project.budgetMin}{project.budgetMax ? ` - ${project.budgetMax}` : ""}</p>
                  <p className="text-xs text-text-tertiary">Orçamento</p>
                </div>
              )}
              {project.duration && (
                <div className="flex items-center gap-2 text-xs text-text-tertiary justify-center">
                  <Clock className="h-3 w-3" /> {project.duration}
                </div>
              )}
              {project.postedAt && (
                <div className="flex items-center gap-2 text-xs text-text-tertiary justify-center">
                  <Clock className="h-3 w-3" /> Publicado {new Date(project.postedAt).toLocaleDateString("pt-BR")}
                </div>
              )}
            </CardContent>
          </Card>

          {breakdown && (
            <Card>
              <CardHeader><h2 className="text-sm font-semibold text-text-primary">Score Breakdown</h2></CardHeader>
              <CardContent className="pt-0 px-5 pb-4 space-y-2">
                <ScoreBar label="Skill Fit" value={breakdown.skillFit || 0} />
                <ScoreBar label="Cliente" value={breakdown.clientQuality || 0} />
                <ScoreBar label="Financeiro" value={breakdown.financialFit || 0} />
                <ScoreBar label="Competição" value={breakdown.competition || 0} />
                <ScoreBar label="Clareza" value={breakdown.projectClarity || 0} />
                <div className="pt-2 border-t border-border">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-text-primary">Total</span>
                    <span className="font-bold text-amber-400">{project.fitScore}/100</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {project.clientName && (
            <Card>
              <CardHeader><h2 className="text-sm font-semibold text-text-primary flex items-center gap-2"><Users className="h-4 w-4 text-text-tertiary" /> Cliente</h2></CardHeader>
              <CardContent className="pt-0 px-5 pb-4 space-y-2 text-xs">
                <p><span className="text-text-tertiary">Nome:</span> <span className="text-text-secondary">{project.clientName}</span></p>
                {project.clientRating != null && (
                  <p><span className="text-text-tertiary">Rating:</span> <span className="text-text-secondary">{project.clientRating} / 5</span></p>
                )}
                {project.clientTotalHires != null && (
                  <p><span className="text-text-tertiary">Contratações:</span> <span className="text-text-secondary">{project.clientTotalHires}</span></p>
                )}
                {project.clientTotalSpent != null && (
                  <p><span className="text-text-tertiary">Total gasto:</span> <span className="text-text-secondary">${project.clientTotalSpent.toLocaleString()}</span></p>
                )}
                {project.clientHireRate != null && (
                  <p><span className="text-text-tertiary">Hire rate:</span> <span className="text-text-secondary">{project.clientHireRate}%</span></p>
                )}
              </CardContent>
            </Card>
          )}

          {project.proposalsCount != null && (
            <Card>
              <CardHeader><h2 className="text-sm font-semibold text-text-primary flex items-center gap-2"><TrendingUp className="h-4 w-4 text-text-tertiary" /> Competitividade</h2></CardHeader>
              <CardContent className="pt-0 px-5 pb-4">
                <p className="text-xs"><span className="text-text-tertiary">Propostas:</span> <span className="text-text-secondary">{project.proposalsCount}</span></p>
                {project.proposalsCount <= 5 && (
                  <p className="text-xs text-amber-400 mt-1">⬅ Janela de oportunidade — pouca concorrência</p>
                )}
                {project.proposalsCount > 20 && (
                  <p className="text-xs text-red-400 mt-1">⬅ Alta concorrência — diferencie sua proposta</p>
                )}
              </CardContent>
            </Card>
          )}

          <ViabilidadeFinanceira
            budgetMin={project.budgetMin}
            budgetMax={project.budgetMax}
            hourlyRateMin={project.hourlyRateMin}
            hourlyRateMax={project.hourlyRateMax}
            duration={project.duration}
            platform={project.platform}
          />

          <a href={project.url} target="_blank" rel="noopener noreferrer" className="inline-flex w-full items-center justify-center rounded-lg text-sm font-medium h-9 px-4 gap-2 bg-accent text-white hover:bg-accent/90 shadow-sm transition-all duration-200">
            <ExternalLink className="h-4 w-4" /> Abrir no {project.platform}
          </a>

          <Link href={`/freelas/pipeline?projectId=${project.id}`} className="inline-flex w-full items-center justify-center rounded-lg text-sm font-medium h-9 px-4 gap-2 bg-bg-elevated text-text-primary hover:bg-border transition-all duration-200">
            Adicionar ao Pipeline
          </Link>
        </div>
      </div>
    </div>
    </Shell>
  );
}
