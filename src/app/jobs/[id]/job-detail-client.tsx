"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import type { ProfileData } from "@/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  ExternalLink,
  Building2,
  MapPin,
  Clock,
  DollarSign,
  Briefcase,
  Sparkles,
  MessageSquare,
  Plus,
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
} from "lucide-react";
import {
  timeAgo,
  formatSalary,
  fitLabelText,
  locationTypeLabel,
  contractTypeLabel,
  experienceLevelLabel,
  statusLabel,
  generateId,
} from "@/lib/utils";
import type { JobWithStatus } from "@/types";
import { countryCodeToFlag } from "@/lib/location";
import { translateText } from "@/lib/translation";
import { detectJobRedFlags, calculateJobGap } from "@/engine/red-flags";
import type { RedFlag } from "@/engine/red-flags";

const statusOptions = [
  "new", "saved", "high_priority", "applied", "reviewing",
  "interview", "offer", "rejected", "ignored",
];

export function JobDetailClient({
  job: initialJob,
  events: initialEvents,
  followups: initialFollowups,
  tasks: initialTasks,
}: {
  job: JobWithStatus;
  events: any[];
  followups: any[];
  tasks: any[];
}) {
  const router = useRouter();
  const [job, setJob] = useState(initialJob);
  const [events, setEvents] = useState(initialEvents || []);
  const [followups, setFollowups] = useState(initialFollowups || []);
  const [tasks, setTasks] = useState(initialTasks || []);
  const [noteText, setNoteText] = useState("");
  const [followupTitle, setFollowupTitle] = useState("");
  const [followupDue, setFollowupDue] = useState("");
  const [showCover, setShowCover] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [translatedDescription, setTranslatedDescription] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);

  const needsTranslation = job.detectedLanguage && job.detectedLanguage !== "pt" && job.description;

  const handleTranslate = async () => {
    if (translatedDescription) {
      setShowTranslation(!showTranslation);
      return;
    }
    setTranslating(true);
    const result = await translateText(job.description || "");
    if (result) {
      setTranslatedDescription(result);
      setShowTranslation(true);
    }
    setTranslating(false);
  };

  const updateStatus = async (status: string) => {
    setUpdating(true);
    await fetch(`/api/jobs/${job.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, updatedAt: new Date().toISOString() }),
    });
    const newEvent = {
      id: generateId(),
      jobId: job.id,
      eventType: "status_change",
      description: `Status alterado para ${statusLabel(status)}`,
      metadata: null,
      occurredAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    setEvents((prev) => [...prev, newEvent]);
    setJob((prev) => ({ ...prev, status }));
    setUpdating(false);
    router.refresh();
    if (status === "preparing") {
      const res = await fetch(`/api/jobs/${job.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.tasks) setTasks(data.tasks);
      }
    }
  };

  const addNote = async () => {
    if (!noteText.trim()) return;
    const newEvent = {
      id: generateId(),
      jobId: job.id,
      eventType: "note",
      description: noteText.trim(),
      metadata: null,
      occurredAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    setEvents((prev) => [...prev, newEvent]);
    setNoteText("");
    router.refresh();
  };

  const addFollowup = async () => {
    if (!followupTitle.trim() || !followupDue) return;
    const f = {
      id: generateId(),
      jobId: job.id,
      title: followupTitle.trim(),
      note: "",
      dueAt: new Date(followupDue).toISOString(),
      done: false,
      doneAt: null,
      createdAt: new Date().toISOString(),
    };
    setFollowups((prev) => [...prev, f]);
    setFollowupTitle("");
    setFollowupDue("");
    router.refresh();
  };

  const toggleFollowup = (id: string) => {
    setFollowups((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, done: !f.done, doneAt: !f.done ? new Date().toISOString() : null } : f
      )
    );
  };

  const toggleTask = async (taskId: string, isDone: boolean) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, isDone, completedAt: isDone ? new Date().toISOString() : null } : t
      )
    );
    await fetch(`/api/jobs/${job.id}/tasks`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, isDone }),
    });
  };

  const scoreDetails = job.scoreDetails ? (typeof job.scoreDetails === "string" ? JSON.parse(job.scoreDetails) : job.scoreDetails) : null;

  const { data: profile } = useQuery<ProfileData>({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await fetch("/api/profile");
      if (!res.ok) throw new Error("Failed to fetch profile");
      return res.json();
    },
  });

  const profileSkills = profile?.skills ?? [];

  const redFlags = job.description ? detectJobRedFlags({
    title: job.title,
    description: job.description,
    company: job.company,
    location: job.location,
    locationType: job.locationType,
    contractType: job.contractType,
    experienceLevel: job.experienceLevel,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    currency: job.currency,
    salaryPeriod: job.salaryPeriod,
    technologies: job.technologies,
  }) : [];

  const gap = job.description ? calculateJobGap({
    title: job.title,
    description: job.description,
    company: job.company,
    location: job.location,
    locationType: job.locationType,
    contractType: job.contractType,
    experienceLevel: job.experienceLevel,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    currency: job.currency,
    salaryPeriod: job.salaryPeriod,
    technologies: job.technologies,
  }, profileSkills) : { strongMatches: [], missingButLearnable: [], hardGaps: [] };

  const criticalFlags = redFlags.filter((f) => f.type === "critical");
  const warningFlags = redFlags.filter((f) => f.type === "warning");
  const infoFlags = redFlags.filter((f) => f.type === "info");

  return (
    <div className="px-6 pt-4 pb-16 max-w-4xl mx-auto">
      <Link
        href="/explore"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Link>

      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2 space-y-5">
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl font-semibold text-text-primary leading-snug">
                    {job.title}
                  </h1>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Building2 className="h-4 w-4 text-text-tertiary" />
                    <span className="text-base text-text-secondary">{job.company}</span>
                  </div>
                </div>
                {job.score !== null && (
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-full text-sm font-bold ${
                        job.score >= 0.65
                          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                          : job.score >= 0.35
                            ? "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400"
                            : "bg-bg-elevated text-text-tertiary"
                      }`}
                    >
                      {Math.round(job.score * 100)}%
                    </div>
                    <span className="text-[10px] text-text-tertiary mt-1 font-medium uppercase tracking-wider">
                      Fit
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-4 mt-5 text-sm text-text-secondary">
                {job.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-text-tertiary" />
                    {job.countryCode && <span className="text-base">{countryCodeToFlag(job.countryCode)}</span>}
                    {job.city || job.location}
                  </span>
                )}
                {job.country && job.countryCode !== "BR" && (
                  <Badge variant="warning" className="text-[11px]">🌍 Internacional</Badge>
                )}
                {job.tags?.some((t: string) => t === "ai-engineering" || t === "llm-dev") && (
                  <Badge variant="accent" className="text-[11px]">🤖 IA</Badge>
                )}
                {job.locationType && (
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="h-4 w-4 text-text-tertiary" />
                    {locationTypeLabel(job.locationType)}
                  </span>
                )}
                {(job.salaryMin || job.salaryMax) && (
                  <span className="flex items-center gap-1.5 font-medium text-text-primary">
                    <DollarSign className="h-4 w-4 text-text-tertiary" />
                    {formatSalary(job.salaryMin, job.salaryMax, job.currency, job.salaryPeriod)}
                  </span>
                )}
                {job.postedAt && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-text-tertiary" />
                    {timeAgo(job.postedAt)}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                {job.contractType && (
                  <Badge>{contractTypeLabel(job.contractType)}</Badge>
                )}
                {job.experienceLevel && (
                  <Badge>{experienceLevelLabel(job.experienceLevel)}</Badge>
                )}
                {job.fitLabel && (
                  <Badge
                    variant={
                      job.fitLabel === "high"
                        ? "success"
                        : job.fitLabel === "good"
                          ? "accent"
                          : job.fitLabel === "partial"
                            ? "warning"
                            : "default"
                    }
                  >
                    {fitLabelText(job.fitLabel)}
                  </Badge>
                )}
              </div>

              {(job.technologies ?? []).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {(job.technologies ?? []).map((tech: string) => (
                    <Badge key={tech} variant="accent">
                      {tech}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {job.description && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                    <FileText className="h-4 w-4 text-text-tertiary" />
                    Descrição
                  </h2>
                  {needsTranslation && (
                    <button
                      onClick={handleTranslate}
                      className="text-xs text-accent hover:text-accent/80 transition-colors"
                      disabled={translating}
                    >
                      {translating ? "Traduzindo..." : showTranslation ? "Ver original" : "Ver tradução"}
                    </button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
                  {showTranslation && translatedDescription ? translatedDescription : job.description}
                </p>
              </CardContent>
            </Card>
          )}

          {scoreDetails && (
            <Card>
              <CardHeader>
                <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-text-tertiary" />
                  Breakdown do Score
                </h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { label: "Cargo", value: scoreDetails.title, weight: "30%" },
                    { label: "Habilidades", value: scoreDetails.skills, weight: "35%" },
                    { label: "Experiência", value: scoreDetails.experience, weight: "15%" },
                    { label: "Localização", value: scoreDetails.location, weight: "10%" },
                    { label: "Salário", value: scoreDetails.salary, weight: "5%" },
                    { label: "Contrato", value: scoreDetails.contract, weight: "5%" },
                  ].map((s) => (
                    <div key={s.label} className="flex items-center gap-3">
                      <span className="text-xs text-text-secondary w-24">{s.label}</span>
                      <div className="flex-1 h-2 rounded-full bg-bg-elevated overflow-hidden">
                        <div
                          className="h-full rounded-full bg-accent/70 transition-all"
                          style={{ width: `${Math.min(s.value * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-text-tertiary tabular-nums w-10 text-right">
                        {Math.round(s.value * 100)}%
                      </span>
                      <span className="text-[10px] text-text-tertiary w-8">{s.weight}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {(criticalFlags.length > 0 || warningFlags.length > 0 || infoFlags.length > 0) && (
            <Card>
              <CardHeader>
                <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                  <span className="text-lg">🚩</span>
                  Red Flags
                </h2>
              </CardHeader>
              <CardContent className="space-y-2">
                {criticalFlags.map((f, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <span className="mt-0.5 text-red-500 shrink-0">●</span>
                    <div>
                      <span className="font-medium text-text-primary">{f.label}</span>
                      <span className="text-text-tertiary ml-1">— {f.evidence}</span>
                    </div>
                  </div>
                ))}
                {warningFlags.map((f, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <span className="mt-0.5 text-amber-500 shrink-0">●</span>
                    <div>
                      <span className="font-medium text-text-primary">{f.label}</span>
                      <span className="text-text-tertiary ml-1">— {f.evidence}</span>
                    </div>
                  </div>
                ))}
                {infoFlags.map((f, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <span className="mt-0.5 text-text-tertiary shrink-0">●</span>
                    <div>
                      <span className="font-medium text-text-primary">{f.label}</span>
                      <span className="text-text-tertiary ml-1">— {f.evidence}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {gap && (gap.strongMatches.length > 0 || gap.missingButLearnable.length > 0 || gap.hardGaps.length > 0) && (
            <Card>
              <CardHeader>
                <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                  <span className="text-lg">📊</span>
                  Gap Analysis
                </h2>
              </CardHeader>
              <CardContent className="space-y-4">
                {gap.strongMatches.length > 0 && (
                  <div>
                    <h3 className="text-xs font-medium text-emerald-500 mb-1.5 flex items-center gap-1.5">
                      <span>✓</span> Match forte
                    </h3>
                    <div className="flex flex-wrap gap-1">
                      {gap.strongMatches.map((s, i) => (
                        <Badge key={i} variant="success" className="text-[10px]">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {gap.missingButLearnable.length > 0 && (
                  <div>
                    <h3 className="text-xs font-medium text-amber-500 mb-1.5 flex items-center gap-1.5">
                      <span>⟳</span> Aprendível
                    </h3>
                    <div className="flex flex-wrap gap-1">
                      {gap.missingButLearnable.map((s, i) => (
                        <Badge key={i} variant="warning" className="text-[10px]">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {gap.hardGaps.length > 0 && (
                  <div>
                    <h3 className="text-xs font-medium text-red-400 mb-1.5 flex items-center gap-1.5">
                      <span>✗</span> Gap duro
                    </h3>
                    <div className="flex flex-wrap gap-1">
                      {gap.hardGaps.map((s, i) => (
                        <Badge key={i} variant="default" className="text-[10px]">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {(tasks.length > 0 || job.coverSuggestion) && (
            <Card>
              <CardHeader>
                <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                  <span className="text-lg">📋</span>
                  Workspace de candidatura
                </h2>
              </CardHeader>
              <CardContent className="space-y-4">
                {tasks.length > 0 && (
                  <div>
                    <h3 className="text-xs font-medium text-text-secondary mb-2">Checklist</h3>
                    <div className="space-y-1">
                      {tasks.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => toggleTask(t.id, !t.isDone)}
                          className="flex items-center gap-2.5 w-full text-left py-1.5 px-2 rounded-lg hover:bg-bg-elevated transition-colors"
                        >
                          <div
                            className={`h-4 w-4 rounded border shrink-0 flex items-center justify-center transition-colors ${
                              t.isDone
                                ? "bg-accent border-accent"
                                : "border-text-tertiary"
                            }`}
                          >
                            {t.isDone && <Check className="h-3 w-3 text-white" />}
                          </div>
                          <span
                            className={`text-xs ${
                              t.isDone
                                ? "text-text-tertiary line-through"
                                : "text-text-secondary"
                            }`}
                          >
                            {t.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {job.coverSuggestion && (
                  <div>
                    <button
                      onClick={() => setShowCover(!showCover)}
                      className="flex items-center justify-between w-full text-left"
                    >
                      <h3 className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
                        <MessageSquare className="h-3.5 w-3.5 text-text-tertiary" />
                        Pitch / Cover letter
                      </h3>
                      {showCover ? <ChevronUp className="h-3.5 w-3.5 text-text-tertiary" /> : <ChevronDown className="h-3.5 w-3.5 text-text-tertiary" />}
                    </button>
                    {showCover && (
                      <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-line mt-2">
                        {job.coverSuggestion}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-text-primary">Seus links</h2>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-[10px] text-text-tertiary">Copie seus links ao se candidatar:</p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-text-tertiary w-16">GitHub</span>
                  <code className="flex-1 truncate bg-bg-elevated px-2 py-0.5 rounded text-text-secondary text-[10px]">github.com/seu-usuario</code>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-text-tertiary w-16">LinkedIn</span>
                  <code className="flex-1 truncate bg-bg-elevated px-2 py-0.5 rounded text-text-secondary text-[10px]">linkedin.com/in/seu-perfil</code>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-text-tertiary w-16">Email</span>
                  <code className="flex-1 truncate bg-bg-elevated px-2 py-0.5 rounded text-text-secondary text-[10px]">seu@email.com</code>
                </div>
              </div>
              <p className="text-[10px] text-text-tertiary mt-1">
                Edite no <Link href="/profile" className="text-accent hover:underline">Perfil</Link>
              </p>
            </CardContent>
          </Card>

          {job.url && (
            <div>
              <Button
                variant="primary"
                size="md"
                onClick={() => { const u = job.url; if (u) window.open(u, "_blank"); }}
                className="w-full"
              >
                <ExternalLink className="h-4 w-4" />
                Abrir vaga original
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-text-primary">Status</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {statusOptions.map((s) => (
                  <button
                    key={s}
                    onClick={() => updateStatus(s)}
                    disabled={updating}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                      job.status === s
                        ? "bg-accent-subtle text-accent font-medium"
                        : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
                    }`}
                  >
                    {statusLabel(s)}
                    {job.status === s && <Check className="h-3.5 w-3.5 inline ml-2" />}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-text-primary">Lembretes</h2>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Título..."
                  value={followupTitle}
                  onChange={(e) => setFollowupTitle(e.target.value)}
                  className="text-xs"
                />
              </div>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={followupDue}
                  onChange={(e) => setFollowupDue(e.target.value)}
                  className="text-xs"
                />
                <Button variant="primary" size="sm" onClick={addFollowup}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              {followups.length > 0 && (
                <div className="space-y-1.5 mt-3 pt-3 border-t">
                  {followups.map((f) => (
                    <div
                      key={f.id}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs ${
                        f.done ? "text-text-tertiary line-through" : "text-text-secondary"
                      }`}
                    >
                      <button onClick={() => toggleFollowup(f.id)}>
                        <div
                          className={`h-3.5 w-3.5 rounded border ${
                            f.done
                              ? "bg-accent border-accent flex items-center justify-center"
                              : "border-text-tertiary"
                          }`}
                        >
                          {f.done && <Check className="h-2.5 w-2.5 text-white" />}
                        </div>
                      </button>
                      <span className="flex-1">{f.title}</span>
                      <span className="text-text-tertiary">
                        {new Date(f.dueAt).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-text-primary">Notas</h2>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Adicionar nota..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="text-xs"
                  onKeyDown={(e) => e.key === "Enter" && addNote()}
                />
                <Button variant="primary" size="sm" onClick={addNote}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              {events
                .filter((e) => e.eventType === "note")
                .slice()
                .reverse()
                .map((e) => (
                  <div key={e.id} className="text-xs text-text-secondary bg-bg-subtle rounded-lg p-2.5">
                    {e.description}
                  </div>
                ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-text-primary">Timeline</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {events
                  .slice()
                  .reverse()
                  .map((e) => (
                    <div key={e.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="h-2 w-2 rounded-full bg-accent/50 mt-1.5" />
                        <div className="flex-1 w-px bg-border" />
                      </div>
                      <div className="pb-3">
                        <p className="text-xs text-text-secondary">{e.description}</p>
                        <p className="text-[10px] text-text-tertiary mt-0.5">
                          {new Date(e.occurredAt).toLocaleString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
