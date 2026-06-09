import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin, Building2, Clock, Bookmark, BookmarkCheck, X, Eye,
  Send, Sparkles, AlertTriangle, Archive, ArrowUpCircle, ExternalLink,
} from "lucide-react";
import { cn, timeAgo, fitLabelColor, fitLabelText, formatSalary, contractTypeLabel, locationTypeLabel, experienceLevelLabel, statusLabel } from "@/lib/utils";
import { countryCodeToFlag } from "@/lib/location";
import type { JobWithStatus, ProfileData } from "@/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

const statusColors: Record<string, string> = {
  new: "bg-accent",
  saved: "bg-blue-500",
  high_priority: "bg-warning",
  preparing: "bg-purple-500",
  applied: "bg-success",
  reviewing: "bg-purple-500",
  interview: "bg-accent",
  offer: "bg-success",
  rejected: "bg-danger",
  ignored: "bg-text-tertiary",
  archived: "bg-text-tertiary",
};

function statusAction(newStatus: string, label: string, icon: any) {
  return { newStatus, label, icon };
}

const STATUS_TRANSITIONS: Record<string, { newStatus: string; label: string; icon: any }[]> = {
  new: [
    { newStatus: "saved", label: "Salvar", icon: Bookmark },
    { newStatus: "high_priority", label: "Priorizar", icon: Sparkles },
    { newStatus: "applied", label: "Aplicar", icon: Send },
    { newStatus: "ignored", label: "Ignorar", icon: X },
  ],
  saved: [
    { newStatus: "high_priority", label: "Priorizar", icon: Sparkles },
    { newStatus: "preparing", label: "Preparar", icon: ArrowUpCircle },
    { newStatus: "applied", label: "Aplicar", icon: Send },
    { newStatus: "ignored", label: "Ignorar", icon: X },
  ],
  high_priority: [
    { newStatus: "preparing", label: "Preparar", icon: ArrowUpCircle },
    { newStatus: "applied", label: "Aplicar", icon: Send },
    { newStatus: "saved", label: "Despriorizar", icon: Bookmark },
  ],
  preparing: [
    { newStatus: "applied", label: "Aplicar", icon: Send },
    { newStatus: "saved", label: "Voltar a salvar", icon: Bookmark },
  ],
  applied: [
    { newStatus: "reviewing", label: "Em análise", icon: Eye },
    { newStatus: "interview", label: "Entrevista", icon: Sparkles },
    { newStatus: "rejected", label: "Recusada", icon: X },
  ],
  reviewing: [
    { newStatus: "interview", label: "Entrevista", icon: Sparkles },
    { newStatus: "offer", label: "Oferta", icon: BookmarkCheck },
    { newStatus: "rejected", label: "Recusada", icon: X },
  ],
  interview: [
    { newStatus: "offer", label: "Oferta", icon: BookmarkCheck },
    { newStatus: "rejected", label: "Recusada", icon: X },
  ],
  offer: [
    { newStatus: "rejected", label: "Recusar", icon: X },
  ],
};

export function JobCard({ job, isCompact }: { job: JobWithStatus; isCompact?: boolean }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await fetch("/api/profile");
      return res.json() as Promise<ProfileData>;
    },
    staleTime: 30000,
  });

  const profileSkillsLower = useMemo(
    () => (profile?.skills || []).map((s: string) => s.toLowerCase()),
    [profile]
  );

  const currencyEmoji = job.currency === "USD" ? "🌍" : job.currency === "EUR" ? "🌍" : "🇧🇷";

  const handleAction = async (e: React.MouseEvent, newStatus: string) => {
    e.preventDefault();
    e.stopPropagation();
    setActionLoading(newStatus);
    await fetch("/api/jobs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: job.id, status: newStatus }),
    });
    setActionLoading(null);
    queryClient.invalidateQueries({ queryKey: ["radar-jobs"] });
    queryClient.invalidateQueries({ queryKey: ["pipeline-jobs"] });
    queryClient.invalidateQueries({ queryKey: ["explore-jobs"] });
    router.refresh();
  };

  const transitions = STATUS_TRANSITIONS[job.status] || [];

  return (
    <Link href={`/jobs/${job.id}`}>
      <Card className={cn(
        "group cursor-pointer transition-all duration-200 hover:shadow-md hover:border-accent/30 relative",
        isCompact ? "py-3" : ""
      )}>
        <CardContent className={cn(isCompact ? "pb-3 pt-3" : "pb-4 pt-4")}>
          {/* Linha 1: Status + Fit + Score + Moeda + Tempo */}
          <div className="flex items-center gap-2 mb-1.5">
            <div className={cn("h-2 w-2 rounded-full shrink-0", statusColors[job.status] || "bg-text-tertiary")} />
            <span className="text-[10px] text-text-tertiary font-medium uppercase tracking-wider">{statusLabel(job.status)}</span>
            {job.fitLabel && (
              <Badge variant={job.fitLabel === "high" ? "success" : job.fitLabel === "good" ? "accent" : job.fitLabel === "partial" ? "warning" : "default"} className="text-[10px] py-0">
                {fitLabelText(job.fitLabel)}
              </Badge>
            )}
            <div className="flex-1" />
            {job.score !== null && (
              <span title={`Score: ${Math.round(job.score * 100)}%`}
                className={cn(
                  "text-xs font-bold tabular-nums",
                  job.score >= 0.80 ? "text-emerald-600 dark:text-emerald-400" :
                  job.score >= 0.60 ? "text-amber-600 dark:text-amber-400" : "text-text-tertiary"
                )}
              >
                {Math.round(job.score * 100)}%
              </span>
            )}
            {(job.salaryMin || job.salaryMax) && (
              <span className="text-[10px] text-text-tertiary flex items-center gap-0.5">
                <span>{currencyEmoji}</span>
                <span className="tabular-nums">{formatSalary(job.salaryMin, job.salaryMax, job.currency, job.salaryPeriod)}</span>
              </span>
            )}
            <span className="text-[10px] text-text-tertiary flex items-center gap-0.5 whitespace-nowrap">
              <Clock className="h-2.5 w-2.5" />
              {job.postedAt ? timeAgo(job.postedAt) : "—"}
            </span>
          </div>

          {/* Linha 2: Título */}
          <h3 className="text-[15px] font-semibold text-text-primary leading-snug group-hover:text-accent transition-colors">
            {job.title}
          </h3>

          {/* Linha 3: Empresa */}
          <div className="flex items-center gap-1.5 mt-0.5">
            <Building2 className="h-3.5 w-3.5 text-text-tertiary shrink-0" />
            <span className="text-sm text-text-secondary">{job.company}</span>
          </div>

          {/* Linha 4: Localização + Badges */}
          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-text-tertiary">
            {job.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {job.countryCode && <span>{countryCodeToFlag(job.countryCode)}</span>}
                {job.city || job.location}
              </span>
            )}
            {job.locationType && <Badge className="text-[10px]">{locationTypeLabel(job.locationType)}</Badge>}
            {job.contractType && <Badge className="text-[10px]">{contractTypeLabel(job.contractType)}</Badge>}
            {job.experienceLevel && <Badge className="text-[10px]">{experienceLevelLabel(job.experienceLevel)}</Badge>}
            {job.isInternational && <Badge variant="warning" className="text-[10px]">🌍 Internacional</Badge>}
            {job.tags?.some((t) => t === "ai-engineering" || t === "llm-dev") && (
              <Badge variant="accent" className="text-[10px]">🤖 IA</Badge>
            )}
            {/* Next action indicator */}
            {job.nextActionType && job.nextActionDate && new Date(job.nextActionDate) <= new Date() && (
              <Badge variant="warning" className="text-[10px] flex items-center gap-0.5">
                <AlertTriangle className="h-2.5 w-2.5" />Ação
              </Badge>
            )}
          </div>

          {/* Motivo do score */}
          {/* Motivo do score e Penalidades */}
          {!isCompact && job.scoreDetails && (() => {
            try {
              const d = typeof job.scoreDetails === "string" ? JSON.parse(job.scoreDetails) : job.scoreDetails;
              const explanation = d.explanation || `${Math.round((job.score ?? 0) * 100)}% de correspondência`;
              const penalties = d.penalties || [];
              return (
                <div className="space-y-1.5 mt-2.5">
                  <div className="text-xs text-text-secondary flex items-center gap-1.5 bg-bg-elevated/40 px-2.5 py-1.5 rounded-lg border border-border/50">
                    <Sparkles className="h-3.5 w-3.5 text-accent shrink-0" />
                    <span className="truncate">{explanation}</span>
                  </div>
                  {penalties.length > 0 && (
                    <div className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5 bg-amber-500/10 px-2.5 py-1.5 rounded-lg border border-amber-500/25">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      <span className="truncate">Alerta: {penalties.join(", ")}</span>
                    </div>
                  )}
                </div>
              );
            } catch {
              return (
                <div className="text-xs text-text-secondary mt-2.5 flex items-center gap-1.5 bg-bg-elevated/40 px-2.5 py-1.5 rounded-lg border border-border/50">
                  <Sparkles className="h-3.5 w-3.5 text-accent shrink-0" />
                  <span className="truncate">{Math.round((job.score ?? 0) * 100)}% de correspondência</span>
                </div>
              );
            }
          })()}

          {/* Linha 5: Chips de tecnologia */}
          {!isCompact && job.technologies && job.technologies.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {job.technologies.slice(0, 6).map((tech) => {
                const isMatch = profileSkillsLower.includes(tech.toLowerCase());
                return (
                  <Badge key={tech} variant={isMatch ? "accent" : "default"}
                    className={cn("text-[11px]", isMatch && "bg-accent/10 text-accent dark:bg-accent/20", !isMatch && "text-text-muted bg-bg-elevated")}>
                    {tech}
                  </Badge>
                );
              })}
              {job.technologies.length > 6 && <Badge className="text-[11px]">+{job.technologies.length - 6}</Badge>}
            </div>
          )}

          {/* Quick actions */}
          {!isCompact && (
            <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-border opacity-70 group-hover:opacity-100 transition-opacity flex-wrap">
              {transitions.map((action) => {
                const Icon = action.icon;
                const loading = actionLoading === action.newStatus;
                return (
                  <Button key={action.newStatus} variant="ghost" size="sm"
                    className={cn(
                      "text-[11px] gap-1 h-7 px-2",
                      action.newStatus === "saved" && "text-blue-500 hover:bg-blue-500/10",
                      action.newStatus === "high_priority" && "text-amber-500 hover:bg-amber-500/10",
                      action.newStatus === "applied" && "text-emerald-500 hover:bg-emerald-500/10",
                      action.newStatus === "ignored" && "text-red-500 hover:bg-red-500/10"
                    )}
                    onClick={(e) => handleAction(e, action.newStatus)}
                    disabled={loading}>
                    <Icon className="h-3 w-3" />
                    {loading ? "..." : action.label}
                  </Button>
                );
              })}
              {job.url && (
                <Button variant="ghost" size="sm"
                  className="text-[11px] gap-1 h-7 px-2 text-text-secondary hover:text-text-primary"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.open(job.url || "", "_blank", "noopener,noreferrer");
                  }}>
                  <ExternalLink className="h-3 w-3" />
                  Abrir original
                </Button>
              )}
              {job.status !== "archived" && job.status !== "ignored" && (
                <Button variant="ghost" size="sm"
                  className="text-[11px] gap-1 h-7 text-text-tertiary ml-auto px-2"
                  onClick={(e) => handleAction(e, "archived")}>
                  <Archive className="h-3 w-3" />Arquivar
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
