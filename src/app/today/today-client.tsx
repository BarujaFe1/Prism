"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Sun,
  ArrowRight,
  AlertTriangle,
  Bell,
  BookOpen,
  Ban,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type TodayPayload = {
  actions: {
    id: string;
    kind: string;
    title: string;
    reason: string;
    href: string;
    score?: number;
  }[];
  followUpsOverdue: { id: string; title: string; company: string }[];
  wip: {
    preparing: number;
    learningTodo: number;
    maxPreparing: number;
    maxLearning: number;
    preparingOver: boolean;
    learningOver: boolean;
  };
  wipWarning: string | null;
  dontDoNow: string[];
  learningFocus: { title: string; skill: string; reason: string } | null;
  topJobs: { id: string; title: string; company: string; score: number | null }[];
};

export function TodayClient() {
  const qc = useQueryClient();
  const [idea, setIdea] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["today-focus"],
    queryFn: async () => {
      const res = await fetch("/api/today");
      return res.json() as Promise<TodayPayload>;
    },
    refetchInterval: 60000,
  });

  const pushDontDoNow = async () => {
    if (!idea.trim()) return;
    const next = [...(data?.dontDoNow || []), idea.trim()];
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dontDoNow: next }),
    });
    setIdea("");
    qc.invalidateQueries({ queryKey: ["today-focus"] });
  };

  const removeDont = async (item: string) => {
    const next = (data?.dontDoNow || []).filter((x) => x !== item);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dontDoNow: next }),
    });
    qc.invalidateQueries({ queryKey: ["today-focus"] });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary flex items-center gap-2">
          <Sun className="h-5 w-5 text-accent" />
          Hoje
        </h1>
        <p className="text-sm text-text-tertiary mt-1">
          O que fazer agora para aumentar chance de conversa/entrevista — no máximo 3 prioridades.
        </p>
      </div>

      {data?.wipWarning && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200 text-sm flex gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Focus Guard</p>
            <p className="text-xs opacity-90 mt-1">{data.wipWarning}</p>
          </div>
        </div>
      )}

      {data?.wip && (
        <div className="flex flex-wrap gap-2 text-[11px]">
          <Badge variant={data.wip.preparingOver ? "warning" : "default"}>
            Preparando {data.wip.preparing}/{data.wip.maxPreparing}
          </Badge>
          <Badge variant={data.wip.learningOver ? "warning" : "default"}>
            Estudos {data.wip.learningTodo}/{data.wip.maxLearning}
          </Badge>
        </div>
      )}

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-text-primary">Top 3 ações do dia</h2>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading && <p className="text-sm text-text-tertiary">Carregando…</p>}
          {!isLoading && (!data?.actions || data.actions.length === 0) && (
            <p className="text-sm text-text-tertiary">
              Nenhuma ação prioritária. Sincronize fontes ou revise o{" "}
              <Link href="/" className="text-accent underline">
                Radar
              </Link>
              .
            </p>
          )}
          {data?.actions.map((a, i) => (
            <Link
              key={a.id}
              href={a.href}
              className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-bg-elevated/20 px-4 py-3 hover:border-accent/40 transition-colors"
            >
              <div className="text-left">
                <p className="text-[10px] uppercase tracking-wide text-text-tertiary">
                  {i + 1}. {a.kind}
                </p>
                <p className="text-sm font-medium text-text-primary mt-0.5">{a.title}</p>
                <p className="text-[11px] text-text-tertiary mt-1">{a.reason}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-accent shrink-0" />
            </Link>
          ))}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Bell className="h-4 w-4" /> Follow-ups
            </h2>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data?.followUpsOverdue || []).length === 0 && (
              <p className="text-xs text-text-tertiary">Nenhum follow-up atrasado.</p>
            )}
            {(data?.followUpsOverdue || []).slice(0, 5).map((j) => (
              <Link
                key={j.id}
                href={`/jobs/${j.id}`}
                className="block text-xs text-text-secondary hover:text-accent"
              >
                {j.title} · {j.company}
              </Link>
            ))}
            <Link href="/pipeline">
              <Button size="sm" variant="ghost" className="text-xs mt-2 px-0">
                Abrir pipeline
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <BookOpen className="h-4 w-4" /> Aprendizado de alto ROI
            </h2>
          </CardHeader>
          <CardContent>
            {data?.learningFocus ? (
              <div>
                <p className="text-sm font-medium text-text-primary">{data.learningFocus.title}</p>
                <p className="text-[11px] text-text-tertiary mt-1">
                  {data.learningFocus.skill} — {data.learningFocus.reason}
                </p>
                <Link href="/profile#learning-backlog-card" className="text-[11px] text-accent mt-2 inline-block">
                  Ver backlog
                </Link>
              </div>
            ) : (
              <p className="text-xs text-text-tertiary">Nenhuma meta de estudo ativa.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Ban className="h-4 w-4" /> Não fazer agora
          </h2>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="Ideia / distração a adiar…"
              className="text-sm"
            />
            <Button size="sm" variant="secondary" onClick={pushDontDoNow} className="shrink-0">
              Adiar
            </Button>
          </div>
          <ul className="space-y-1">
            {(data?.dontDoNow || []).map((item) => (
              <li
                key={item}
                className="flex items-center justify-between text-xs text-text-secondary rounded-md bg-bg-elevated/30 px-2 py-1.5"
              >
                <span>{item}</span>
                <button
                  type="button"
                  className="text-text-tertiary hover:text-accent"
                  onClick={() => removeDont(item)}
                >
                  remover
                </button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {(data?.topJobs || []).length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-text-primary">Mais oportunidades (além do Top 3)</h2>
          </CardHeader>
          <CardContent className="space-y-1">
            {data!.topJobs.slice(3).map((j) => (
              <Link
                key={j.id}
                href={`/jobs/${j.id}`}
                className="flex justify-between text-xs text-text-secondary hover:text-accent py-1"
              >
                <span>
                  {j.title} · {j.company}
                </span>
                <span>{(j.score ?? 0).toFixed(2)}</span>
              </Link>
            ))}
            {(data!.topJobs.length <= 3) && (
              <p className="text-[11px] text-text-tertiary">Top oportunidades já estão nas 3 ações.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
