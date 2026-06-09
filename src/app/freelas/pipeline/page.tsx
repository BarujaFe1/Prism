"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shell } from "@/components/layout/Shell";
import { GitPullRequestArrow, Send, MessageSquare, CheckCircle2, XCircle, FileText, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface Proposal {
  id: string;
  projectId: string;
  projectTitle: string;
  projectPlatform: string;
  projectUrl: string;
  projectBudget: string;
  coverLetter: string | null;
  proposedRate: number | null;
  outcome: string | null;
  proposedAt: string | null;
}

type ColumnId = "identified" | "analyzing" | "drafting" | "sent" | "negotiating" | "contracted" | "archived";

const COLUMNS: { id: ColumnId; label: string; icon: any }[] = [
  { id: "identified", label: "Identificados", icon: FileText },
  { id: "analyzing", label: "Em análise", icon: MessageSquare },
  { id: "drafting", label: "Rascunho", icon: FileText },
  { id: "sent", label: "Enviada", icon: Send },
  { id: "negotiating", label: "Negociação", icon: MessageSquare },
  { id: "contracted", label: "Contratado", icon: CheckCircle2 },
  { id: "archived", label: "Arquivo", icon: XCircle },
];

const PLATFORM_COLORS: Record<string, string> = {
  upwork: "text-emerald-400", contra: "text-violet-400", malt: "text-amber-400",
  weworkremotely: "text-blue-400", freelancer: "text-rose-400", peopleperhour: "text-cyan-400",
  remoteok: "text-orange-400", simplyhired: "text-blue-400",
};

export default function FreelancePipelinePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: projects, isLoading } = useQuery({
    queryKey: ["freelance-pipeline"],
    queryFn: async () => {
      const res = await fetch("/api/freelance/projects?limit=200");
      const data = await res.json();
      return data.projects || [];
    },
  });

  const updateStatus = async (projectId: string, status: string) => {
    try {
      await fetch(`/api/freelance/projects`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: projectId, status }),
      });
      queryClient.invalidateQueries({ queryKey: ["freelance-pipeline"] });
      toast("Status atualizado", "success");
    } catch {
      toast("Erro ao atualizar", "error");
    }
  };

  const grouped: Record<string, any[]> = {
    identified: [], analyzing: [], drafting: [], sent: [],
    negotiating: [], contracted: [], archived: [],
  };

  (projects || []).forEach((p: any) => {
    const status = p.status || "new";
    const col: ColumnId = status === "new" || status === "saved" ? "identified"
      : status === "priority" ? "analyzing"
        : status === "proposed" ? "drafting"
          : status === "interviewing" ? "sent"
            : status === "contracted" ? "contracted"
              : status === "rejected" || status === "ignored" ? "archived"
                : "identified";
    grouped[col].push(p);
  });

  return (
    <Shell>
    <div className="px-6 pt-4 pb-16">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <GitPullRequestArrow className="h-5 w-5 text-amber-400" />
            <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Pipeline Freelas</h1>
          </div>
          <p className="text-sm text-text-secondary mt-1">Acompanhe suas propostas do início ao contrato</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-text-tertiary" />
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => {
            const items = grouped[col.id] || [];
            return (
              <div key={col.id} className="flex-shrink-0 w-64">
                <div className="flex items-center gap-2 mb-3">
                  <col.icon className="h-4 w-4 text-text-tertiary" />
                  <span className="text-sm font-medium text-text-primary">{col.label}</span>
                  <Badge variant="accent" className="text-[10px]">{items.length}</Badge>
                </div>
                <div className="space-y-2 min-h-[200px]">
                  {items.length === 0 ? (
                    <div className="text-xs text-text-tertiary text-center py-8 border border-dashed border-border rounded-lg">
                      <p className="mb-1">Vazio</p>
                      <p className="text-[10px] text-text-tertiary/60">Arraste projetos aqui</p>
                    </div>
                  ) : items.slice(0, 10).map((item: any) => (
                    <Card key={item.id} className="hover:border-border-hover transition-colors">
                      <CardContent className="py-2.5 px-3">
                        <Link href={`/freelas/${item.id}`} className="block mb-1">
                          <p className="text-xs font-medium text-text-primary truncate leading-tight">{item.title}</p>
                        </Link>
                        <div className="flex items-center gap-2 text-[10px] text-text-tertiary">
                          <span className={PLATFORM_COLORS[item.platform] || ""}>{item.platform}</span>
                          {item.fitScore != null && (
                            <span className={`${item.fitScore >= 75 ? "text-green-400" : item.fitScore >= 50 ? "text-amber-400" : "text-red-400"}`}>
                              {item.fitScore}
                            </span>
                          )}
                          {item.hourlyRateMin && <span>${item.hourlyRateMin}/hr</span>}
                        </div>
                        {item.fitScore != null && (
                          <div className="mt-1.5 h-1 w-full bg-bg-elevated rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${item.fitScore >= 75 ? "bg-green-400" : item.fitScore >= 50 ? "bg-amber-400" : "bg-red-400"}`} style={{ width: `${item.fitScore}%` }} />
                          </div>
                        )}
                        <div className="flex gap-1 mt-1.5">
                          {col.id === "identified" && (
                            <button className="h-5 text-[10px] px-2 rounded text-text-secondary hover:text-text-primary hover:bg-bg-elevated" onClick={() => updateStatus(item.id, "priority")}>
                              Analisar
                            </button>
                          )}
                          {col.id === "analyzing" && (
                            <button className="h-5 text-[10px] px-2 rounded text-text-secondary hover:text-text-primary hover:bg-bg-elevated" onClick={() => updateStatus(item.id, "proposed")}>
                              Propor
                            </button>
                          )}
                          {col.id !== "contracted" && col.id !== "archived" && (
                            <button className="h-5 text-[10px] px-2 rounded text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={() => updateStatus(item.id, "ignored")}>
                              Arquivar
                            </button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
    </Shell>
  );
}
