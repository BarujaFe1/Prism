"use client";

import { useState, useMemo, useEffect } from "react";
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
  Clipboard,
  AlertCircle,
  BookOpen,
  Award,
  Info,
  CheckCircle2,
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
import { SafeHtml } from "@/components/ui/safe-html";
import { useToast } from "@/components/ui/toast";
import { useQueryClient } from "@tanstack/react-query";

const statusOptions = [
  "new", "saved", "high_priority", "preparing", "applied", "reviewing",
  "testing", "interview", "offer", "rejected", "ignored",
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
  const { toast } = useToast();
  const queryClient = useQueryClient();
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

  // Application Quality Checklist State
  const [checklist, setChecklist] = useState<any[]>(() => {
    if (initialJob.checklistJson) {
      try {
        return JSON.parse(initialJob.checklistJson);
      } catch (e) {
        // Fallback
      }
    }
    return [
      { key: "fit", label: "Fit ≥ 75% ou justificativa manual", checked: false },
      { key: "seniority", label: "Senioridade compatível ou stretch consciente", checked: false },
      { key: "resume", label: "Currículo adaptado / versão selecionada", checked: false },
      { key: "evidence", label: "Projeto/evidência principal escolhido", checked: false },
      { key: "links", label: "Link de portfólio/GitHub conferido", checked: false },
      { key: "message", label: "Mensagem curta de pitch preparada", checked: false },
      { key: "redflags", label: "Red flags revisadas", checked: false },
      { key: "followup", label: "Lembrete de follow-up definido", checked: false },
    ];
  });

  const [showBypassModal, setShowBypassModal] = useState(false);
  const [selectedEvidences, setSelectedEvidences] = useState<string[]>([]);
  const [tailoredResumeText, setTailoredResumeText] = useState(initialJob.tailoredResume || "");
  const [isSavingTailor, setIsSavingTailor] = useState(false);

  // Application Tracking States
  const [trackingPortfolio, setTrackingPortfolio] = useState(initialJob.portfolioLinkUsed || "");
  const [trackingCvVersion, setTrackingCvVersion] = useState(initialJob.cvVersionUsed || "");
  const [trackingAppliedAt, setTrackingAppliedAt] = useState(
    initialJob.appliedAt ? new Date(initialJob.appliedAt).toISOString().split("T")[0] : ""
  );
  const [trackingRejectionReason, setTrackingRejectionReason] = useState(initialJob.rejectionReason || "");
  const [savingTracking, setSavingTracking] = useState(false);

  const saveTrackingDetails = async () => {
    setSavingTracking(true);
    try {
      const body: Record<string, any> = {
        portfolioLinkUsed: trackingPortfolio,
        cvVersionUsed: trackingCvVersion,
        rejectionReason: trackingRejectionReason,
      };
      if (trackingAppliedAt) {
        body.appliedAt = new Date(trackingAppliedAt).toISOString();
      }
      await fetch(`/api/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setJob(prev => ({ 
        ...prev, 
        portfolioLinkUsed: trackingPortfolio, 
        cvVersionUsed: trackingCvVersion, 
        rejectionReason: trackingRejectionReason,
        appliedAt: trackingAppliedAt ? new Date(trackingAppliedAt).toISOString() : prev.appliedAt
      }));
      toast("Detalhes de candidatura salvos!", "success");
      router.refresh();
    } catch (e) {
      toast("Erro ao salvar detalhes", "error");
    }
    setSavingTracking(false);
  };

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

  const updateChecklistItem = async (key: string, checked: boolean) => {
    const updated = checklist.map((item) =>
      item.key === key ? { ...item, checked } : item
    );
    setChecklist(updated);
    
    await fetch(`/api/jobs/${job.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checklistJson: JSON.stringify(updated) }),
    });
  };

  const updateStatus = async (status: string, bypassed = false) => {
    setUpdating(true);
    const nowStr = new Date().toISOString();
    const patchBody: Record<string, any> = { status, updatedAt: nowStr };
    if (status === "applied") {
      patchBody.appliedAt = nowStr;
    }
    
    await fetch(`/api/jobs/${job.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patchBody),
    });

    const description = bypassed 
      ? `Status alterado para ${statusLabel(status)} (Bypass do checklist)` 
      : `Status alterado para ${statusLabel(status)}`;

    const newEvent = {
      id: generateId(),
      jobId: job.id,
      eventType: "status_change",
      description,
      metadata: bypassed ? { bypassed: true } : null,
      occurredAt: nowStr,
      createdAt: nowStr,
    };
    
    setEvents((prev) => [...prev, newEvent]);
    setJob((prev) => ({ ...prev, status, appliedAt: status === "applied" ? nowStr : prev.appliedAt }));
    
    if (status === "applied") {
      const defaultFollowupDays = 5;
      const due = new Date();
      due.setDate(due.getDate() + defaultFollowupDays);
      
      const f = {
        id: generateId(),
        jobId: job.id,
        title: `Follow-up da candidatura na ${job.company}`,
        note: `Verificar retorno da vaga de ${job.title}`,
        dueAt: due.toISOString(),
        done: false,
        doneAt: null,
        createdAt: nowStr,
      };

      try {
        await fetch(`/api/jobs/${job.id}/followups`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ followup: f }),
        });
        setFollowups((prev) => [...prev, f]);
        toast(`Status atualizado para Aplicada! Follow-up agendado para ${due.toLocaleDateString("pt-BR")}.`, "success");
      } catch (e) {
        toast("Status atualizado para Aplicada!", "success");
      }
    } else {
      toast(`Status alterado para ${statusLabel(status)}`, "success");
    }

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

  const handleStatusChangeClick = (status: string) => {
    if (status === "applied") {
      const checkedCount = checklist.filter((item) => item.checked).length;
      if (checkedCount < 4) {
        setShowBypassModal(true);
        return;
      }
    }
    updateStatus(status);
  };

  const handleBypassApply = () => {
    setShowBypassModal(false);
    updateStatus("applied", true);
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
    
    await fetch(`/api/jobs/${job.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: noteText.trim() }), // Or standard save
    });

    setEvents((prev) => [...prev, newEvent]);
    setNoteText("");
    toast("Nota adicionada!", "success");
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
    try {
      await fetch(`/api/jobs/${job.id}/followups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followup: f }),
      });
      setFollowups((prev) => [...prev, f]);
      setFollowupTitle("");
      setFollowupDue("");
      toast("Lembrete de follow-up adicionado!", "success");
      updateChecklistItem("followup", true);
      router.refresh();
    } catch (e) {
      toast("Erro ao adicionar follow-up", "error");
    }
  };

  const toggleFollowup = async (id: string) => {
    const f = followups.find((x) => x.id === id);
    if (!f) return;
    const newDone = !f.done;
    try {
      await fetch(`/api/jobs/${job.id}/followups`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followupId: id, done: newDone }),
      });
      setFollowups((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, done: newDone, doneAt: newDone ? new Date().toISOString() : null } : item
        )
      );
      router.refresh();
    } catch (e) {
      toast("Erro ao atualizar follow-up", "error");
    }
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

  const generateMarkdownResume = (selectedIds: string[]) => {
    if (!profile) return "";
    const selectedEvs = (profile.skillsEvidence || []).filter((ev: any) =>
      selectedIds.includes(ev.id)
    );
    
    let md = `# Felipe Alirio Baruja\n`;
    md += `${profile.headline || ""}\n\n`;
    md += `## Resumo Profissional\n${profile.summary || ""}\n\n`;
    md += `## Projetos em Destaque\n\n`;
    
    selectedEvs.forEach((ev: any) => {
      md += `### ${ev.projectName}\n`;
      if (ev.description) md += `- **Sobre**: ${ev.description}\n`;
      if (ev.metrics) md += `- **Métricas/Impacto**: ${ev.metrics}\n`;
      if (ev.approvedResumeBullet) md += `- **Realização**: ${ev.approvedResumeBullet}\n`;
      if (ev.projectUrl) md += `- **Link/GitHub**: [Acessar Projeto](${ev.projectUrl})\n`;
      if (ev.associatedSkills) md += `- **Tecnologias**: ${ev.associatedSkills.join(", ")}\n`;
      md += `\n`;
    });
    
    md += `## Informações de Contato\n`;
    if (profile.contactEmail) md += `- Email: ${profile.contactEmail}\n`;
    if (profile.linkedinUrl) md += `- LinkedIn: ${profile.linkedinUrl}\n`;
    if (profile.githubUrl) md += `- GitHub: ${profile.githubUrl}\n`;
    if (profile.portfolioUrl) md += `- Portfólio: ${profile.portfolioUrl}\n`;
    
    return md;
  };

  const jobTechsList = job.technologies || [];

  const techCategories = useMemo(() => {
    const categories = {
      evidences: [] as { tech: string; projects: any[] }[],
      noEvidence: [] as string[],
      learnable: [] as string[],
      hardGaps: [] as string[],
    };
    
    if (!profile) return categories;
    
    const profileSkillsLower = (profile.skills || []).map(s => s.toLowerCase().trim());
    const evidences = profile.skillsEvidence || [];
    
    jobTechsList.forEach((tech) => {
      const techLower = tech.toLowerCase().trim();
      
      const matchingProjects = evidences.filter((ev: any) =>
        (ev.associatedSkills || []).map((s: string) => s.toLowerCase().trim()).includes(techLower)
      );
      
      if (matchingProjects.length > 0) {
        categories.evidences.push({ tech, projects: matchingProjects });
      } else if (profileSkillsLower.includes(techLower)) {
        categories.noEvidence.push(tech);
      } else if (gap.missingButLearnable.map(s => s.toLowerCase().trim()).includes(techLower)) {
        categories.learnable.push(tech);
      } else {
        categories.hardGaps.push(tech);
      }
    });
    
    return categories;
  }, [jobTechsList, profile, gap]);

  useEffect(() => {
    if (profile && jobTechsList.length > 0 && selectedEvidences.length === 0) {
      const lowerTechs = jobTechsList.map(t => t.toLowerCase().trim());
      const matchedIds = (profile.skillsEvidence || [])
        .filter((ev: any) => {
          const assoc = (ev.associatedSkills || []).map((s: string) => s.toLowerCase().trim());
          return lowerTechs.some(tech => assoc.includes(tech));
        })
        .map((ev: any) => ev.id);
      if (matchedIds.length > 0) {
        setSelectedEvidences(matchedIds);
      }
    }
  }, [profile, jobTechsList]);

  useEffect(() => {
    if (profile && selectedEvidences.length > 0 && !tailoredResumeText) {
      setTailoredResumeText(generateMarkdownResume(selectedEvidences));
    }
  }, [selectedEvidences, profile, tailoredResumeText]);

  const handleToggleEvidenceSelection = (id: string) => {
    setSelectedEvidences(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      setTailoredResumeText(generateMarkdownResume(next));
      return next;
    });
    updateChecklistItem("evidence", true);
  };

  const saveTailoredResume = async () => {
    setIsSavingTailor(true);
    try {
      await fetch(`/api/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tailoredResume: tailoredResumeText }),
      });
      toast("Material adaptado salvo com sucesso!", "success");
      updateChecklistItem("resume", true);
    } catch (e) {
      toast("Erro ao salvar currículo", "error");
    }
    setIsSavingTailor(false);
  };

  const copyTailoredResumeToClipboard = () => {
    navigator.clipboard.writeText(tailoredResumeText);
    toast("Material copiado para a área de transferência!", "success");
    updateChecklistItem("links", true);
  };

  const addLearningTask = async (tech: string) => {
    if (!profile) return;
    
    const currentBacklog = profile.learningBacklog || [];
    const exists = currentBacklog.some((t: any) => t.skill?.toLowerCase() === tech.toLowerCase());
    if (exists) {
      toast(`Você já tem uma tarefa para estudar ${tech} no seu perfil!`, "info");
      return;
    }

    const newTask = {
      id: generateId(),
      skill: tech,
      title: `Estudar ${tech} para a vaga de ${job.title} na ${job.company}`,
      reason: `Gap recorrente / exigido na vaga`,
      priority: job.score && job.score >= 0.75 ? "high" : "medium",
      status: "todo",
      evidenceExpected: `Criar ou atualizar um mini-projeto/evidência usando ${tech}`,
      dueAt: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
      createdAt: new Date().toISOString(),
    };
    
    const updatedBacklog = [...currentBacklog, newTask];
    
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ learningBacklog: updatedBacklog }),
    });
    
    if (res.ok) {
      toast(`Tarefa de estudo para ${tech} adicionada ao seu Learning Backlog!`, "success");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    } else {
      toast("Erro ao adicionar tarefa de estudo", "error");
    }
  };

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
                <SafeHtml
                  html={showTranslation && translatedDescription ? translatedDescription : (job.description || "")}
                  className="text-sm text-text-secondary leading-relaxed"
                />
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

          {job.status === "preparing" || job.status === "applied" ? (
            <Card className="border border-border/80">
              <CardHeader className="pb-3 border-b border-border/60">
                <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                  <span className="text-lg">📋</span>
                  Workspace de Candidatura Inteligente
                </h2>
              </CardHeader>
              <CardContent className="space-y-6 pt-4">
                {/* 1. Quality Checklist Panel */}
                <div className="border border-border/80 rounded-xl p-4 bg-bg-elevated/10">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      Checklist de Qualidade da Candidatura
                    </h3>
                    <span className="text-xs font-semibold tabular-nums text-text-primary">
                      {checklist.filter(item => item.checked).length} / 8 concluídos
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-bg rounded-full overflow-hidden mb-4 border">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        checklist.filter(item => item.checked).length >= 4 
                          ? "bg-success" 
                          : "bg-warning"
                      }`}
                      style={{ width: `${(checklist.filter(item => item.checked).length / 8) * 100}%` }}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {checklist.map((item) => (
                      <label 
                        key={item.key} 
                        className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-bg-elevated/40 transition-colors cursor-pointer text-xs text-text-secondary select-none"
                      >
                        <input 
                          type="checkbox" 
                          checked={item.checked} 
                          onChange={(e) => updateChecklistItem(item.key, e.target.checked)}
                          className="rounded border-border text-accent focus:ring-accent bg-bg h-4 w-4"
                        />
                        <span className={item.checked ? "text-text-tertiary line-through" : ""}>
                          {item.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 2. Evidence Matcher & Gap Analysis Panel */}
                <div className="border border-border/80 rounded-xl p-4 bg-bg-elevated/10 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                    <Award className="h-4 w-4 text-accent" />
                    Evidence Matcher & Gap Analysis
                  </h3>
                  
                  <div className="space-y-3">
                    {/* 2.1. Com evidência */}
                    {techCategories.evidences.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-emerald-500 mb-1.5 flex items-center gap-1">
                          <span>✓</span> Habilidades Provadas por Projetos
                        </h4>
                        <div className="space-y-2">
                          {techCategories.evidences.map((item: any) => (
                            <div key={item.tech} className="p-2.5 rounded-lg border border-border/60 bg-bg/40 flex flex-col gap-1.5">
                              <div className="flex items-center gap-2">
                                <Badge variant="success" className="text-[10px]">{item.tech}</Badge>
                                <span className="text-[10px] text-text-tertiary">provada por:</span>
                              </div>
                              <div className="flex flex-col gap-1 pl-2 border-l border-border/80">
                                {item.projects.map((proj: any) => (
                                  <div key={proj.id} className="text-xs flex flex-col gap-0.5">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-semibold text-text-primary">{proj.projectName}</span>
                                      <Badge className="text-[8px] py-0 px-1.5 uppercase scale-90">Confiança: {proj.confidence}</Badge>
                                    </div>
                                    {proj.description && <span className="text-[11px] text-text-secondary">{proj.description}</span>}
                                    {proj.metrics && <span className="text-[10px] text-emerald-400 font-medium">📊 Métricas: {proj.metrics}</span>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 2.2. Sem evidência */}
                    {techCategories.noEvidence.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-amber-500 mb-1.5 flex items-center gap-1">
                          <span>⚠</span> Habilidades Declaradas (Sem Evidência de Projeto)
                        </h4>
                        <div className="flex flex-wrap gap-1.5 bg-bg/20 p-2 rounded-lg border border-border/40">
                          {techCategories.noEvidence.map((tech: string) => (
                            <div key={tech} className="flex items-center gap-1">
                              <Badge variant="warning" className="text-[10px]">{tech}</Badge>
                              <span className="text-[9px] text-text-tertiary" title="Sem projeto vinculado no seu perfil. Adicione um projeto no Perfil para comprovar.">
                                (precisa de projeto)
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 2.3. Gaps Aprendíveis */}
                    {techCategories.learnable.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-amber-400 mb-1.5 flex items-center gap-1">
                          <span>⟳</span> Gaps de Habilidade Aprendíveis
                        </h4>
                        <div className="space-y-1.5 bg-bg/20 p-2.5 rounded-lg border border-border/40">
                          <p className="text-[10px] text-text-tertiary mb-1.5">Essas tecnologias são requisitadas, mas não estão no seu perfil. Você pode adicioná-las ao seu plano de estudos:</p>
                          <div className="flex flex-wrap gap-2">
                            {techCategories.learnable.map((tech: string) => (
                              <div key={tech} className="flex items-center gap-1 bg-bg px-2 py-1 rounded border border-border/80">
                                <Badge variant="default" className="text-[10px] bg-bg-elevated text-text-secondary">{tech}</Badge>
                                <button 
                                  onClick={() => addLearningTask(tech)}
                                  className="text-[9px] text-accent hover:underline flex items-center font-semibold scale-95"
                                  title="Criar tarefa de estudo no Learning Backlog"
                                >
                                  + Estudar
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 2.4. Gaps Duros */}
                    {techCategories.hardGaps.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-red-400 mb-1.5 flex items-center gap-1">
                          <span>✗</span> Gaps Duros / Requisitos Complexos
                        </h4>
                        <div className="flex flex-wrap gap-1 bg-bg/10 p-2 rounded-lg border border-border/30">
                          {techCategories.hardGaps.map((tech: string) => (
                            <Badge key={tech} variant="default" className="text-[10px] bg-danger/10 text-danger border border-danger/20">{tech}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Como Vender Seu Fit */}
                <div className="border border-border/80 rounded-xl p-4 bg-bg-elevated/10 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    Como vender seu fit nesta vaga
                  </h3>
                  
                  <div className="space-y-2.5 text-xs">
                    <div>
                      <span className="font-semibold text-text-primary block">✨ 3 Evidências Principais para Destacar:</span>
                      {techCategories.evidences.length > 0 ? (
                        <ul className="list-disc list-inside mt-1 space-y-1 text-text-secondary pl-1">
                          {techCategories.evidences.slice(0, 3).map((item: any, i: number) => (
                            <li key={i}>
                              Mencione o uso de <strong className="text-text-primary">{item.tech}</strong> no projeto <strong className="text-accent">{item.projects[0].projectName}</strong>
                              {item.projects[0].metrics && ` (${item.projects[0].metrics})`}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-text-tertiary italic mt-1 pl-1">Nenhuma evidência provada ainda. Adicione projetos e associe tecnologias no seu perfil.</p>
                      )}
                    </div>
                    
                    <div>
                      <span className="font-semibold text-text-primary block">🎯 Gaps / Tópicos para Estudar ou Contornar:</span>
                      {techCategories.learnable.length > 0 || techCategories.hardGaps.length > 0 ? (
                        <ul className="list-disc list-inside mt-1 space-y-1 text-text-secondary pl-1">
                          {[...techCategories.learnable, ...techCategories.hardGaps].slice(0, 2).map((tech, i) => (
                            <li key={i}>
                              Revisar conceitos básicos de <strong className="text-amber-500">{tech}</strong> ou justificar com aprendizado rápido.
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-emerald-500 font-medium mt-1 pl-1">Match perfeito! Nenhum gap técnico detectado.</p>
                      )}
                    </div>
                    
                    <div className="pt-1 border-t border-border/40 text-[10px] text-text-tertiary flex justify-between">
                      <span>Elegibilidade: <strong>{scoreDetails?.eligibility || "Compatível"}</strong></span>
                      <span>Trilha: <strong>{scoreDetails?.domain || "Dados"}</strong></span>
                    </div>
                  </div>
                </div>

                {/* 4. Tailor Lite Workspace */}
                {job.status === "preparing" && (
                  <div className="border border-border/80 rounded-xl p-4 bg-bg-elevated/10 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                        <Clipboard className="h-4 w-4 text-purple-400" />
                        Currículo Tailor Lite
                      </h3>
                      <span className="text-[10px] text-text-tertiary">Selecione projetos para compor o currículo</span>
                    </div>

                    {profile?.skillsEvidence && profile.skillsEvidence.length > 0 ? (
                      <div className="space-y-3">
                        <p className="text-[11px] text-text-secondary">Escolha os projetos que deseja destacar para gerar o Markdown customizado:</p>
                        <div className="flex flex-col gap-2 max-h-36 overflow-y-auto border border-border p-2 rounded-lg bg-bg/50">
                          {profile.skillsEvidence.map((ev: any) => {
                            const isSelected = selectedEvidences.includes(ev.id);
                            return (
                              <label key={ev.id} className="flex items-start gap-2.5 p-1.5 rounded hover:bg-bg-elevated/40 transition-colors cursor-pointer text-xs">
                                <input 
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleEvidenceSelection(ev.id)}
                                  className="rounded border-border text-accent focus:ring-accent bg-bg mt-0.5 h-3.5 w-3.5"
                                />
                                <div className="min-w-0">
                                  <span className="font-semibold text-text-primary">{ev.projectName}</span>
                                  {ev.metrics && <span className="text-[10px] text-emerald-400 ml-1.5">({ev.metrics})</span>}
                                  <p className="text-[10px] text-text-tertiary truncate">{ev.description || "Sem descrição"}</p>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                        
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-bold text-text-tertiary block">Material Adaptado (Markdown)</label>
                          <textarea
                            value={tailoredResumeText}
                            onChange={(e) => setTailoredResumeText(e.target.value)}
                            className="w-full h-64 bg-bg border border-border rounded-lg p-2.5 font-mono text-xs text-text-secondary focus:outline-none focus:ring-1 focus:ring-accent"
                            placeholder="# Seu Currículo customizado aparecerá aqui..."
                          />
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            onClick={copyTailoredResumeToClipboard}
                            className="flex-1"
                          >
                            Copiar Markdown
                          </Button>
                          <Button 
                            variant="primary" 
                            size="sm" 
                            onClick={saveTailoredResume}
                            disabled={isSavingTailor}
                            className="flex-1"
                          >
                            {isSavingTailor ? "Salvando..." : "Salvar no Material"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-text-tertiary italic">Configure sua Matriz de Evidências no Perfil para usar o Tailor Lite.</p>
                    )}
                  </div>
                )}

                {/* 5. Pitch / Cover letter */}
                {job.coverSuggestion && (
                  <div className="border border-border/85 rounded-xl p-4 bg-bg-elevated/5">
                    <button
                      onClick={() => setShowCover(!showCover)}
                      className="flex items-center justify-between w-full text-left"
                    >
                      <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                        <MessageSquare className="h-3.5 w-3.5 text-text-tertiary" />
                        Pitch / Cover letter sugerido
                      </h3>
                      {showCover ? <ChevronUp className="h-3.5 w-3.5 text-text-tertiary" /> : <ChevronDown className="h-3.5 w-3.5 text-text-tertiary" />}
                    </button>
                    {showCover && (
                      <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-line mt-3 p-2.5 bg-bg rounded border border-border/50">
                        {job.coverSuggestion}
                      </p>
                    )}
                  </div>
                )}

                {/* 6. Checklist Operacional */}
                {tasks.length > 0 && (
                  <div className="border border-border/85 rounded-xl p-4 bg-bg-elevated/5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">Checklist de Tarefas de Preparação</h3>
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
              </CardContent>
            </Card>
          ) : (
            <Card className="border border-dashed border-border/80">
              <CardContent className="py-8 text-center space-y-3">
                <Briefcase className="h-8 w-8 mx-auto text-text-tertiary opacity-60" />
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">Iniciar Preparação</h3>
                  <p className="text-xs text-text-tertiary max-w-sm mx-auto mt-1 leading-relaxed">
                    Mova o status desta vaga para "Preparando" para habilitar o Checklist de Qualidade, o Evidence Matcher e o gerador de Currículo Tailor Lite.
                  </p>
                </div>
                <Button variant="primary" size="sm" onClick={() => updateStatus("preparing")}>
                  Preparar Candidatura
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-text-primary">Seus links</h2>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-[10px] text-text-tertiary">Copie seus links ao se candidatar:</p>
              <div className="space-y-2">
                {profile?.githubUrl ? (
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-text-tertiary w-16">GitHub</span>
                    <code 
                      onClick={() => {
                        navigator.clipboard.writeText(profile.githubUrl!);
                        toast("Link do GitHub copiado!", "success");
                      }}
                      className="flex-1 truncate bg-bg-elevated px-2 py-0.5 rounded text-text-secondary text-[10px] cursor-pointer hover:bg-bg-elevated/80"
                    >
                      {profile.githubUrl}
                    </code>
                    <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer" className="text-text-tertiary hover:text-text-primary">
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-text-tertiary w-16">GitHub</span>
                    <Link href="/profile" className="text-[10px] text-accent hover:underline">Completar Perfil</Link>
                  </div>
                )}

                {profile?.linkedinUrl ? (
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-text-tertiary w-16">LinkedIn</span>
                    <code 
                      onClick={() => {
                        navigator.clipboard.writeText(profile.linkedinUrl!);
                        toast("Link do LinkedIn copiado!", "success");
                      }}
                      className="flex-1 truncate bg-bg-elevated px-2 py-0.5 rounded text-text-secondary text-[10px] cursor-pointer hover:bg-bg-elevated/80"
                    >
                      {profile.linkedinUrl}
                    </code>
                    <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-text-tertiary hover:text-text-primary">
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-text-tertiary w-16">LinkedIn</span>
                    <Link href="/profile" className="text-[10px] text-accent hover:underline">Completar Perfil</Link>
                  </div>
                )}

                {profile?.contactEmail ? (
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-text-tertiary w-16">Email</span>
                    <code 
                      onClick={() => {
                        navigator.clipboard.writeText(profile.contactEmail!);
                        toast("Email copiado!", "success");
                      }}
                      className="flex-1 truncate bg-bg-elevated px-2 py-0.5 rounded text-text-secondary text-[10px] cursor-pointer hover:bg-bg-elevated/80"
                    >
                      {profile.contactEmail}
                    </code>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-text-tertiary w-16">Email</span>
                    <Link href="/profile" className="text-[10px] text-accent hover:underline">Completar Perfil</Link>
                  </div>
                )}

                {profile?.portfolioUrl && (
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-text-tertiary w-16">Portfólio</span>
                    <code 
                      onClick={() => {
                        navigator.clipboard.writeText(profile.portfolioUrl!);
                        toast("Link do portfólio copiado!", "success");
                      }}
                      className="flex-1 truncate bg-bg-elevated px-2 py-0.5 rounded text-text-secondary text-[10px] cursor-pointer hover:bg-bg-elevated/80"
                    >
                      {profile.portfolioUrl}
                    </code>
                    <a href={profile.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-text-tertiary hover:text-text-primary">
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}

                {profile?.resumeUrl && (
                  <div className="flex items-center justify-between gap-2 text-xs border-t border-border/40 pt-2">
                    <span className="text-text-tertiary w-16">Currículo</span>
                    <a 
                      href={profile.resumeUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex-1 text-[10px] text-accent hover:underline truncate"
                    >
                      {profile.resumeFilename || "Visualizar Currículo PDF"}
                    </a>
                    <ExternalLink className="h-3 w-3 text-text-tertiary" />
                  </div>
                )}
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
                    onClick={() => handleStatusChangeClick(s)}
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

              {/* Conditional Application Tracking Fields */}
              {(["applied", "reviewing", "testing", "interview", "offer", "rejected"].includes(job.status)) && (
                <div className="mt-4 pt-4 border-t border-border space-y-3 text-left">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">Rastreamento</h3>
                  
                  <div>
                    <label className="text-[10px] uppercase font-bold text-text-tertiary block">Data de Candidatura</label>
                    <Input
                      type="date"
                      value={trackingAppliedAt}
                      onChange={(e) => setTrackingAppliedAt(e.target.value)}
                      className="text-xs mt-1"
                    />
                  </div>
                  
                  <div>
                    <label className="text-[10px] uppercase font-bold text-text-tertiary block">Portfólio Usado</label>
                    <Input
                      placeholder="Link do portfólio..."
                      value={trackingPortfolio}
                      onChange={(e) => setTrackingPortfolio(e.target.value)}
                      className="text-xs mt-1"
                    />
                  </div>
                  
                  <div>
                    <label className="text-[10px] uppercase font-bold text-text-tertiary block">Versão do Currículo</label>
                    <Input
                      placeholder="Ex: v2_data_engineer..."
                      value={trackingCvVersion}
                      onChange={(e) => setTrackingCvVersion(e.target.value)}
                      className="text-xs mt-1"
                    />
                  </div>
                  
                  {job.status === "rejected" && (
                    <div>
                      <label className="text-[10px] uppercase font-bold text-text-tertiary block">Motivo da Recusa</label>
                      <select
                        value={trackingRejectionReason}
                        onChange={(e) => setTrackingRejectionReason(e.target.value)}
                        className="w-full text-xs mt-1 rounded-lg border bg-bg px-2.5 py-1.5 text-text-secondary focus:outline-none focus:ring-1 focus:ring-accent"
                      >
                        <option value="">Selecione um motivo...</option>
                        <option value="seniority_gap">Senioridade incompatível</option>
                        <option value="location_mismatch">Localidade incompatível</option>
                        <option value="technology_gap">Falta de tecnologia core</option>
                        <option value="compensation_unmet">Pretensão salarial incompatível</option>
                        <option value="generic_rejection">Recusa genérica</option>
                        <option value="no_response">Sem resposta / Ghosting</option>
                        <option value="other">Outro</option>
                      </select>
                    </div>
                  )}
                  
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={saveTrackingDetails}
                    disabled={savingTracking}
                    className="w-full text-xs h-8"
                  >
                    {savingTracking ? "Salvando..." : "Salvar Detalhes"}
                  </Button>
                </div>
              )}
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
    {showBypassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-bg border border-border rounded-xl p-6 max-w-md w-full mx-4 shadow-xl text-left">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-warning shrink-0" />
              <div>
                <h3 className="text-base font-semibold text-text-primary">Checklist de Qualidade Incompleto</h3>
                <p className="text-xs text-text-secondary mt-2 leading-relaxed">
                  Você completou apenas {checklist.filter(item => item.checked).length} de 8 itens recomendados do checklist de qualidade. 
                  É altamente recomendável completar pelo menos 4 itens para garantir uma candidatura estratégica e personalizada.
                </p>
                <p className="text-xs text-text-tertiary mt-2">
                  Deseja prosseguir assim mesmo (bypass) ou voltar para completar o checklist?
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2.5 mt-5">
              <Button variant="secondary" onClick={() => setShowBypassModal(false)}>
                Voltar e Completar
              </Button>
              <Button 
                variant="primary" 
                onClick={handleBypassApply}
                className="bg-warning text-black hover:bg-warning/80"
              >
                Aplicar com Bypass
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
