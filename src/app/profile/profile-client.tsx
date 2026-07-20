"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { User, Plus, X, Save, Loader2, Sparkles, AlertTriangle, Globe, Briefcase, BookOpen, CheckSquare, Square, Trash2, Calendar } from "lucide-react";
import type { ProfileData, LocationType, ContractType, ExperienceLevel, JobWithStatus } from "@/types";
import { locationTypeLabel, contractTypeLabel, experienceLevelLabel, fitLabelText } from "@/lib/utils";
import Link from "next/link";

import { buildPersonalProfilePayload, PERSONAL_NEGATIVE_KEYWORDS } from "@/lib/profile/personal-profile";
import { buildCoverageHeatmap } from "@/lib/career/evidence-coverage";

const PERSONAL_DEFAULTS = buildPersonalProfilePayload();

const DEFAULTS: ProfileData = {
  name: PERSONAL_DEFAULTS.name,
  headline: PERSONAL_DEFAULTS.headline,
  summary: PERSONAL_DEFAULTS.summary,
  skills: PERSONAL_DEFAULTS.skills,
  desiredRoles: PERSONAL_DEFAULTS.desiredRoles,
  desiredSalaryMin: PERSONAL_DEFAULTS.desiredSalaryMin,
  desiredSalaryMax: PERSONAL_DEFAULTS.desiredSalaryMax,
  desiredCurrency: PERSONAL_DEFAULTS.desiredCurrency,
  desiredLocationTypes: PERSONAL_DEFAULTS.desiredLocationTypes,
  desiredContractTypes: PERSONAL_DEFAULTS.desiredContractTypes,
  experienceLevel: PERSONAL_DEFAULTS.experienceLevel,
  languages: PERSONAL_DEFAULTS.languages,
  githubUrl: PERSONAL_DEFAULTS.githubUrl,
  linkedinUrl: PERSONAL_DEFAULTS.linkedinUrl,
  portfolioUrl: PERSONAL_DEFAULTS.portfolioUrl,
  resumeUrl: PERSONAL_DEFAULTS.resumeUrl,
  resumeFilename: PERSONAL_DEFAULTS.resumeFilename,
  contactEmail: PERSONAL_DEFAULTS.contactEmail,
};

export function ProfileClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectSkill = searchParams ? searchParams.get("preselect") : null;
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProfileData>(DEFAULTS);
  const [newSkill, setNewSkill] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newKeyword, setNewKeyword] = useState("");
  const [negativeKeywords, setNegativeKeywords] = useState<string[]>([
    ...PERSONAL_NEGATIVE_KEYWORDS,
  ]);
  const [saving, setSaving] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [flexProfile, setFlexProfile] = useState<{
    freelanceMinHourlyRate: number | null;
    freelancePreferredCurrency: string;
    freelanceAvailableHoursPerWeek: number | null;
    freelanceOpenToFixedPrice: boolean;
    freelanceMinFixedProjectValue: number | null;
    freelanceExperienceYears: number | null;
    freelancePortfolioUrl: string;
    freelanceSpecialization: string;
  }>({
    freelanceMinHourlyRate: (PERSONAL_DEFAULTS.freelanceMinHourlyRate as number) ?? 20,
    freelancePreferredCurrency: (PERSONAL_DEFAULTS.freelancePreferredCurrency as string) ?? "USD",
    freelanceAvailableHoursPerWeek:
      (PERSONAL_DEFAULTS.freelanceAvailableHoursPerWeek as number) ?? 10,
    freelanceOpenToFixedPrice: (PERSONAL_DEFAULTS.freelanceOpenToFixedPrice as boolean) ?? true,
    freelanceMinFixedProjectValue:
      (PERSONAL_DEFAULTS.freelanceMinFixedProjectValue as number) ?? 300,
    freelanceExperienceYears: (PERSONAL_DEFAULTS.freelanceExperienceYears as number) ?? 2,
    freelancePortfolioUrl: (PERSONAL_DEFAULTS.freelancePortfolioUrl as string) ?? "",
    freelanceSpecialization: "full-stack",
  });
  const [applicationPlans, setApplicationPlans] = useState<any[]>(
    (PERSONAL_DEFAULTS.applicationPlans as any[]) || []
  );

  const [skillsEvidence, setSkillsEvidence] = useState<any[]>(
    (PERSONAL_DEFAULTS.skillsEvidence as any[]) || []
  );
  const [newEvProject, setNewEvProject] = useState("");
  const [newEvUrl, setNewEvUrl] = useState("");
  const [newEvDesc, setNewEvDesc] = useState("");
  const [newEvMetrics, setNewEvMetrics] = useState("");
  const [newEvBullet, setNewEvBullet] = useState("");
  const [newEvConfidence, setNewEvConfidence] = useState("high");
  const [newEvSkills, setNewEvSkills] = useState<string[]>([]);
  const [newEvSkillInput, setNewEvSkillInput] = useState("");

  const addEvSkill = () => {
    if (!newEvSkillInput.trim() || newEvSkills.includes(newEvSkillInput.trim())) return;
    setNewEvSkills([...newEvSkills, newEvSkillInput.trim()]);
    setNewEvSkillInput("");
  };

  const removeEvSkill = (skill: string) => {
    setNewEvSkills(newEvSkills.filter(s => s !== skill));
  };

  const addEvidence = () => {
    if (!newEvProject.trim()) return;
    const newEvidenceItem = {
      id: crypto.randomUUID(),
      projectName: newEvProject.trim(),
      projectUrl: newEvUrl.trim() || null,
      description: newEvDesc.trim() || null,
      metrics: newEvMetrics.trim() || null,
      approvedResumeBullet: newEvBullet.trim() || null,
      confidence: newEvConfidence,
      associatedSkills: newEvSkills,
    };
    setSkillsEvidence([...skillsEvidence, newEvidenceItem]);
    setNewEvProject("");
    setNewEvUrl("");
    setNewEvDesc("");
    setNewEvMetrics("");
    setNewEvBullet("");
    setNewEvConfidence("high");
    setNewEvSkills([]);
  };

  const removeEvidence = (id: string) => {
    setSkillsEvidence(skillsEvidence.filter(ev => ev.id !== id));
  };

  // Learning Backlog States
  const [learningBacklog, setLearningBacklog] = useState<any[]>(
    (PERSONAL_DEFAULTS.learningBacklog as any[]) || []
  );
  const [newBtSkill, setNewBtSkill] = useState("");
  const [newBtTitle, setNewBtTitle] = useState("");
  const [newBtReason, setNewBtReason] = useState("");
  const [newBtPriority, setNewBtPriority] = useState("medium");
  const [newBtEvidence, setNewBtEvidence] = useState("");
  const [newBtDue, setNewBtDue] = useState("");
  const [showBtSuggestEvidenceDialog, setShowBtSuggestEvidenceDialog] = useState(false);
  const [btSelectedTech, setBtSelectedTech] = useState("");

  const addLearningTask = () => {
    if (!newBtSkill.trim() || !newBtTitle.trim()) {
      toast("Tecnologia e título são obrigatórios", "error");
      return;
    }
    const newTask = {
      id: crypto.randomUUID(),
      skill: newBtSkill.trim(),
      title: newBtTitle.trim(),
      reason: newBtReason.trim() || "Manual",
      priority: newBtPriority,
      evidenceExpected: newBtEvidence.trim() || "Construir projeto prático",
      status: "todo",
      dueAt: newBtDue ? new Date(newBtDue).toISOString() : null,
      createdAt: new Date().toISOString(),
    };
    setLearningBacklog([...learningBacklog, newTask]);
    setNewBtSkill("");
    setNewBtTitle("");
    setNewBtReason("");
    setNewBtPriority("medium");
    setNewBtEvidence("");
    setNewBtDue("");
    toast("Tarefa de estudos adicionada! Lembre-se de salvar o perfil.", "success");
  };

  const removeLearningTask = (id: string) => {
    setLearningBacklog(learningBacklog.filter(t => t.id !== id));
    toast("Tarefa removida! Salve o perfil para persistir.", "success");
  };

  const toggleLearningTaskStatus = (id: string) => {
    const task = learningBacklog.find(t => t.id === id);
    if (!task) return;
    const nextStatus = task.status === "todo" ? "done" : "todo";
    
    setLearningBacklog(learningBacklog.map(t => 
      t.id === id ? { ...t, status: nextStatus, completedAt: nextStatus === "done" ? new Date().toISOString() : null } : t
    ));

    toast(nextStatus === "done" ? "Parabéns! Tarefa concluída." : "Tarefa reaberta.", "success");

    if (nextStatus === "done") {
      setBtSelectedTech(task.skill);
      setShowBtSuggestEvidenceDialog(true);
    }
  };

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data && data.id) {
          setProfile(data);
          if (data.negativeKeywords) setNegativeKeywords(data.negativeKeywords);
          if (data.skillsEvidence) setSkillsEvidence(data.skillsEvidence);
          if (data.learningBacklog) setLearningBacklog(data.learningBacklog);
          if (data.applicationPlans) setApplicationPlans(data.applicationPlans);
          setFlexProfile({
            freelanceMinHourlyRate: data.freelanceMinHourlyRate ?? 20,
            freelancePreferredCurrency: data.freelancePreferredCurrency ?? "USD",
            freelanceAvailableHoursPerWeek: data.freelanceAvailableHoursPerWeek ?? 10,
            freelanceOpenToFixedPrice: data.freelanceOpenToFixedPrice ?? true,
            freelanceMinFixedProjectValue: data.freelanceMinFixedProjectValue ?? 300,
            freelanceExperienceYears: data.freelanceExperienceYears ?? 2,
            freelancePortfolioUrl: data.freelancePortfolioUrl ?? "",
            freelanceSpecialization: data.freelanceSpecialization ?? "Full-Stack",
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (preselectSkill) {
      const cleanSkill = decodeURIComponent(preselectSkill).trim();
      if (cleanSkill) {
        setNewEvSkills((prev) => {
          if (!prev.includes(cleanSkill)) {
            return [...prev, cleanSkill];
          }
          return prev;
        });
        setNewBtSkill(cleanSkill);
        setNewBtTitle(`Estudar ${cleanSkill}`);
        
        setTimeout(() => {
          const el = document.getElementById("evidence-matrix-card");
          if (el) {
            el.scrollIntoView({ behavior: "smooth" });
          }
        }, 500);
      }
    }
  }, [preselectSkill]);

  const { data: allJobs } = useQuery({
    queryKey: ["profile-preview-jobs"],
    queryFn: async () => {
      const res = await fetch("/api/jobs?limit=200&sortBy=score&sortOrder=desc");
      return res.json() as Promise<JobWithStatus[]>;
    },
    staleTime: 30000,
  });

  const topMatches = useMemo(() => {
    if (!allJobs) return [];
    return allJobs
      .filter((j) => j.score !== null && j.score >= 0.6)
      .slice(0, 5);
  }, [allJobs]);

  const summaryLength = profile.summary?.length || 0;

  const skillsAnalysis = useMemo(() => {
    const gapCounts: Record<string, number> = {};
    if (allJobs) {
      allJobs.forEach((j) => {
        if (
          ["new", "saved", "preparing", "applied", "reviewing", "testing", "interview"].includes(
            j.status
          )
        ) {
          j.technologies?.forEach((t) => {
            gapCounts[t] = (gapCounts[t] || 0) + 1;
          });
        }
      });
    }

    const heatmap = buildCoverageHeatmap({
      profileSkills: profile.skills,
      evidences: skillsEvidence,
      learningSkills: learningBacklog
        .filter((t) => t.status === "todo")
        .map((t) => t.skill)
        .filter(Boolean),
      jobTechCounts: gapCounts,
    });

    return {
      green: heatmap.strong.map((r) => ({
        name: r.skill,
        status: r.label,
        confidence: "high",
      })),
      yellow: [...heatmap.partial, ...heatmap.pending].map((r) => ({
        name: r.skill,
        status: r.label,
        confidence: "medium",
      })),
      red: heatmap.realGaps
        .filter((r) => r.jobDemand >= 2)
        .map((r) => ({ name: r.skill, status: r.label, jobCount: r.jobDemand })),
      gray: [
        ...heatmap.unregistered.map((r) => ({ name: r.skill, status: r.label })),
        ...heatmap.inLearning.map((r) => ({ name: r.skill, status: r.label })),
        ...heatmap.realGaps
          .filter((r) => r.jobDemand < 2)
          .map((r) => ({ name: r.skill, status: r.label })),
      ],
    };
  }, [profile.skills, skillsEvidence, learningBacklog, allJobs]);

  const { data: careerTracks = [], refetch: refetchTracks } = useQuery({
    queryKey: ["career-tracks"],
    queryFn: async () => {
      const res = await fetch("/api/tracks");
      return res.json() as Promise<
        {
          id: string;
          label: string;
          active: boolean;
          priority: number;
          weight: number;
          notes: string | null;
        }[]
      >;
    },
  });

  const toggleTrack = async (id: string, active: boolean) => {
    await fetch("/api/tracks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, active }),
    });
    refetchTracks();
  };

  const save = async () => {
    setSaving(true);
    try {
      const body = {
        ...profile,
        negativeKeywords,
        ...flexProfile,
        skillsEvidence,
        learningBacklog,
        applicationPlans,
      };
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      toast("Perfil salvo! Recalculando scores...", "success");

      setRecalculating(true);
      const scoreRes = await fetch("/api/score", { method: "POST" });
      const scoreData = await scoreRes.json();

      if (scoreData.ok) {
        toast(`Scores recalculados — ${scoreData.updated} vagas atualizadas`, "success");
      }
      setRecalculating(false);
      router.refresh();
    } catch {
      toast("Erro ao salvar perfil", "error");
    }
    setSaving(false);
  };

  const addSkill = () => {
    if (!newSkill.trim() || profile.skills.includes(newSkill.trim())) return;
    setProfile({ ...profile, skills: [...profile.skills, newSkill.trim()] });
    setNewSkill("");
  };

  const removeSkill = (skill: string) => {
    setProfile({ ...profile, skills: profile.skills.filter((s) => s !== skill) });
  };

  const addRole = () => {
    if (!newRole.trim() || profile.desiredRoles.includes(newRole.trim())) return;
    setProfile({ ...profile, desiredRoles: [...profile.desiredRoles, newRole.trim()] });
    setNewRole("");
  };

  const removeRole = (role: string) => {
    setProfile({ ...profile, desiredRoles: profile.desiredRoles.filter((r) => r !== role) });
  };

  const addKeyword = () => {
    if (!newKeyword.trim() || negativeKeywords.includes(newKeyword.trim())) return;
    setNegativeKeywords([...negativeKeywords, newKeyword.trim()]);
    setNewKeyword("");
  };

  const removeKeyword = (kw: string) => {
    setNegativeKeywords(negativeKeywords.filter((k) => k !== kw));
  };

  const toggleLocation = (t: LocationType) => {
    const arr = profile.desiredLocationTypes;
    setProfile({
      ...profile,
      desiredLocationTypes: arr.includes(t) ? arr.filter((x) => x !== t) : [...arr, t],
    });
  };

  const toggleContract = (t: ContractType) => {
    const arr = profile.desiredContractTypes;
    setProfile({
      ...profile,
      desiredContractTypes: arr.includes(t) ? arr.filter((x) => x !== t) : [...arr, t],
    });
  };

  const salarySuggestion = profile.experienceLevel === "internship" ? 1500
    : profile.experienceLevel === "trainee" ? 2000
    : profile.experienceLevel === "junior" ? 3500
    : profile.experienceLevel === "mid" ? 7000
    : profile.experienceLevel === "senior" ? 12000
    : 8000;

  const applySalarySuggestion = () => {
    setProfile({ ...profile, desiredSalaryMin: salarySuggestion });
  };

  return (
    <div className="px-6 pt-4 pb-16 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Perfil</h1>
          <p className="text-sm text-text-secondary mt-1">
            Seu perfil profissional usado para calcular o score de aderência das vagas
          </p>
        </div>
        {recalculating && (
          <div className="flex items-center gap-2 text-xs text-accent">
            <Loader2 className="h-3 w-3 animate-spin" />
            Recalculando scores...
          </div>
        )}
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="text-xs"
          onClick={() => {
            const p = buildPersonalProfilePayload();
            setProfile({
              name: p.name,
              headline: p.headline,
              summary: p.summary,
              skills: p.skills,
              desiredRoles: p.desiredRoles,
              desiredSalaryMin: p.desiredSalaryMin,
              desiredSalaryMax: p.desiredSalaryMax,
              desiredCurrency: p.desiredCurrency,
              desiredLocationTypes: p.desiredLocationTypes,
              desiredContractTypes: p.desiredContractTypes,
              experienceLevel: p.experienceLevel,
              languages: p.languages,
              githubUrl: p.githubUrl,
              linkedinUrl: p.linkedinUrl,
              portfolioUrl: p.portfolioUrl,
              resumeUrl: p.resumeUrl,
              resumeFilename: p.resumeFilename,
              contactEmail: p.contactEmail,
            });
            setNegativeKeywords([...(p.negativeKeywords || [])]);
            setSkillsEvidence([...(p.skillsEvidence as any[])]);
            setLearningBacklog([...(p.learningBacklog as any[])]);
            setApplicationPlans([...(p.applicationPlans as any[])]);
            setFlexProfile({
              freelanceMinHourlyRate: (p.freelanceMinHourlyRate as number) ?? 20,
              freelancePreferredCurrency: (p.freelancePreferredCurrency as string) ?? "USD",
              freelanceAvailableHoursPerWeek: (p.freelanceAvailableHoursPerWeek as number) ?? 10,
              freelanceOpenToFixedPrice: (p.freelanceOpenToFixedPrice as boolean) ?? true,
              freelanceMinFixedProjectValue: (p.freelanceMinFixedProjectValue as number) ?? 300,
              freelanceExperienceYears: (p.freelanceExperienceYears as number) ?? 2,
              freelancePortfolioUrl: (p.freelancePortfolioUrl as string) ?? "",
              freelanceSpecialization: "full-stack",
            });
            toast("Perfil recomendado carregado — revise e salve.", "success");
          }}
        >
          Carregar perfil recomendado
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2 space-y-5">
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <User className="h-4 w-4 text-text-tertiary" />
                Informações básicas
              </h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-text-tertiary font-medium">Nome</label>
                  <Input
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-text-tertiary font-medium">Nível de experiência</label>
                  <Select
                    value={profile.experienceLevel}
                    onChange={(e) => setProfile({ ...profile, experienceLevel: e.target.value as ExperienceLevel })}
                    className="mt-1"
                  >
                    {(["internship", "trainee", "junior", "mid", "senior", "lead"] as const).map((l) => (
                      <option key={l} value={l}>{experienceLevelLabel(l)}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-text-tertiary font-medium">Localização</label>
                  <Input
                    value={"São Carlos, SP"}
                    disabled
                    className="mt-1 opacity-60"
                    title="Sua localização atual para scoring de vagas presenciais"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-text-tertiary font-medium">Headline</label>
                <Input
                  value={profile.headline}
                  onChange={(e) => setProfile({ ...profile, headline: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs text-text-tertiary font-medium">Resumo</label>
                  <span className={`text-[10px] ${summaryLength > 300 ? "text-amber-500" : "text-text-tertiary"}`}>
                    {summaryLength}/300 caracteres
                  </span>
                </div>
                <textarea
                  value={profile.summary || ""}
                  onChange={(e) => setProfile({ ...profile, summary: e.target.value.slice(0, 300) })}
                  className="mt-1 block w-full rounded-lg border bg-bg px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 min-h-[80px] resize-y"
                />
              </div>
            </CardContent>
          </Card>

          <Card id="career-tracks-card">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-text-primary">Duas vertentes</h2>
                <Link href="/today" className="text-[11px] text-accent">
                  Hoje →
                </Link>
              </div>
              <p className="text-[11px] text-text-tertiary">
                Esforço igual e separado: <strong className="text-text-secondary font-medium">Dev</strong> (software)
                e <strong className="text-text-secondary font-medium">Dados</strong> (analista · Estatística USP).
                Sub-tracks reforçam uma vertente; não competem com ela.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {careerTracks.length === 0 && (
                <p className="text-xs text-text-tertiary">
                  Nenhum track. Rode <code className="text-[10px]">npm run career:seed</code>.
                </p>
              )}
              {(["dev", "dados"] as const).map((vert) => {
                const primaryKey = vert === "dev" ? "fullstack_product" : "data_analytics";
                const primary = careerTracks.find((t) => t.key === primaryKey);
                const subs = careerTracks.filter((t) => {
                  if (vert === "dev") return ["frontend", "backend", "mobile"].includes(t.key);
                  return t.key === "ai_automation";
                });
                return (
                  <div key={vert} className="rounded-xl border border-border/60 p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-text-primary">
                          {vert === "dev" ? "Dev" : "Dados"}
                        </p>
                        <p className="text-[10px] text-text-tertiary mt-0.5">
                          {vert === "dev"
                            ? "Full-Stack · Frontend · Backend · Product"
                            : "Analista · BI · Estatística USP · Data products"}
                        </p>
                      </div>
                      {primary && (
                        <button
                          type="button"
                          onClick={() => toggleTrack(primary.id, !primary.active)}
                          className={`text-[11px] px-2 py-1 rounded-md shrink-0 ${
                            primary.active
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              : "bg-bg-elevated text-text-tertiary"
                          }`}
                        >
                          {primary.active ? "Ativo" : "Off"}
                        </button>
                      )}
                    </div>
                    {primary && (
                      <p className="text-[11px] text-text-secondary">{primary.label}</p>
                    )}
                    {subs.length > 0 && (
                      <div className="space-y-1.5 pt-1 border-t border-border/40">
                        <p className="text-[10px] text-text-tertiary">Sub-tracks</p>
                        {subs.map((t) => (
                          <div key={t.id} className="flex items-center justify-between gap-2">
                            <p className="text-[11px] text-text-secondary truncate">{t.label}</p>
                            <button
                              type="button"
                              onClick={() => toggleTrack(t.id, !t.active)}
                              className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${
                                t.active
                                  ? "bg-emerald-500/10 text-emerald-400"
                                  : "bg-bg-elevated text-text-tertiary"
                              }`}
                            >
                              {t.active ? "On" : "Off"}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <Globe className="h-4 w-4 text-text-tertiary" />
                Presença online e documentos
              </h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-text-tertiary font-medium">GitHub</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary text-xs">&gt;_</span>
                    <Input
                      value={profile.githubUrl || ""}
                      onChange={(e) => setProfile({ ...profile, githubUrl: e.target.value })}
                      placeholder="https://github.com/seu-usuario"
                      className="mt-1 pl-8"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-text-tertiary font-medium">LinkedIn</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary text-xs">in</span>
                    <Input
                      value={profile.linkedinUrl || ""}
                      onChange={(e) => setProfile({ ...profile, linkedinUrl: e.target.value })}
                      placeholder="https://linkedin.com/in/seu-perfil"
                      className="mt-1 pl-8"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs text-text-tertiary font-medium">Portfolio / Site pessoal</label>
                <Input
                  value={profile.portfolioUrl || ""}
                  onChange={(e) => setProfile({ ...profile, portfolioUrl: e.target.value })}
                  placeholder="https://seusite.com"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-text-tertiary font-medium">Currículo (PDF)</label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={profile.resumeUrl || ""}
                    onChange={(e) => setProfile({ ...profile, resumeUrl: e.target.value })}
                    placeholder="Link para currículo online ou upload"
                    className="flex-1"
                  />
                </div>
                {profile.resumeUrl && (
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs text-success">Currículo: {profile.resumeFilename || "link externo"}</span>
                    <Button variant="ghost" size="sm" className="text-xs" onClick={() => window.open(profile.resumeUrl, "_blank")}>
                      Ver currículo
                    </Button>
                  </div>
                )}
                {!profile.resumeUrl && (
                  <p className="text-xs text-text-tertiary mt-1">Nenhum currículo carregado</p>
                )}
              </div>
              <div>
                <label className="text-xs text-text-tertiary font-medium">Email de candidatura</label>
                <Input
                  type="email"
                  value={profile.contactEmail || ""}
                  onChange={(e) => setProfile({ ...profile, contactEmail: e.target.value })}
                  placeholder="seu@email.com"
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-text-primary">Habilidades</h2>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {profile.skills.map((skill) => (
                  <Badge key={skill} variant="accent" className="gap-1">
                    {skill}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeSkill(skill)} />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Adicionar tecnologia..."
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addSkill()}
                />
                <Button variant="secondary" size="sm" onClick={addSkill}>
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                  <span className="text-base">📊</span>
                  SLA de Habilidades & Heatmap
                </h2>
                <span className="text-[10px] text-text-tertiary">Distribuição de cobertura do seu portfólio</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-left">
              {/* Stats row */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-2">
                  <span className="text-emerald-400 font-bold block text-base">{skillsAnalysis.green.length}</span>
                  <span className="text-text-tertiary text-[9px] uppercase font-semibold">Forte</span>
                </div>
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-2">
                  <span className="text-amber-400 font-bold block text-base">{skillsAnalysis.yellow.length}</span>
                  <span className="text-text-tertiary text-[9px] uppercase font-semibold">Pendente</span>
                </div>
                <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-2">
                  <span className="text-red-400 font-bold block text-base">{skillsAnalysis.red.length}</span>
                  <span className="text-text-tertiary text-[9px] uppercase font-semibold">Gaps Críticos</span>
                </div>
                <div className="bg-zinc-500/5 border border-zinc-500/20 rounded-lg p-2">
                  <span className="text-zinc-400 font-bold block text-base">{skillsAnalysis.gray.length}</span>
                  <span className="text-text-tertiary text-[9px] uppercase font-semibold">Sem Evid.</span>
                </div>
              </div>

              {/* Heatmap Grid */}
              <div className="space-y-4">
                {skillsAnalysis.red.length > 0 && (
                  <div>
                    <h4 className="text-[10px] uppercase font-bold text-red-400 mb-1.5 flex items-center gap-1">
                      <span>🔴</span> Gaps Críticos (Exigidos em vagas, sem projeto)
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {skillsAnalysis.red.map(s => (
                        <span 
                          key={s.name} 
                          title="Clique para adicionar ao seu Plano de Estudos"
                          className="cursor-pointer"
                          onClick={() => {
                            setNewBtSkill(s.name);
                            setNewBtTitle(`Aprender e comprovar ${s.name}`);
                            setNewBtReason(`Gap Crítico (${s.jobCount} vagas)`);
                            const el = document.getElementById("learning-backlog-card");
                            if (el) el.scrollIntoView({ behavior: "smooth" });
                          }}
                        >
                          <Badge 
                            variant="default" 
                            className="bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] gap-1.5 cursor-pointer hover:bg-red-500/15"
                          >
                            {s.name}
                            <span className="text-[8px] bg-red-500/20 px-1 rounded">Vagas: {s.jobCount}</span>
                          </Badge>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {skillsAnalysis.green.length > 0 && (
                  <div>
                    <h4 className="text-[10px] uppercase font-bold text-emerald-400 mb-1.5">
                      <span>🟢</span> Cobertura Forte (Projetos com link, métrica e bullet)
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {skillsAnalysis.green.map(s => (
                        <Badge key={s.name} variant="default" className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] gap-1">
                          ✓ {s.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {skillsAnalysis.yellow.length > 0 && (
                  <div>
                    <h4 className="text-[10px] uppercase font-bold text-amber-400 mb-1.5">
                      <span>🟡</span> Cobertura Pendente (Falta link, métrica ou bullet)
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {skillsAnalysis.yellow.map(s => (
                        <span 
                          key={s.name} 
                          title={`Habilidade cadastrada mas ${s.status.toLowerCase()}. Clique para associar evidência.`}
                          className="cursor-pointer"
                          onClick={() => {
                            setNewEvSkillInput(s.name);
                            if (!newEvSkills.includes(s.name)) {
                              setNewEvSkills([...newEvSkills, s.name]);
                            }
                            const el = document.getElementById("evidence-matrix-card");
                            if (el) el.scrollIntoView({ behavior: "smooth" });
                          }}
                        >
                          <Badge 
                            variant="default" 
                            className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] gap-1.5 cursor-pointer hover:bg-amber-500/15"
                          >
                            ⚠ {s.name}
                            <span className="text-[8px] bg-amber-500/20 px-1.5 rounded">{s.status}</span>
                          </Badge>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {skillsAnalysis.gray.length > 0 && (
                  <div>
                    <h4 className="text-[10px] uppercase font-bold text-text-tertiary mb-1.5">
                      <span>⚪</span> Sem Evidência de Projeto / Em estudo
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {skillsAnalysis.gray.map(s => (
                        <Badge key={s.name} variant="default" className="bg-zinc-500/5 text-text-secondary border border-border text-[10px] gap-1.5">
                          {s.name}
                          <span className="text-[8px] bg-bg-elevated px-1 rounded text-text-tertiary">{s.status}</span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-text-primary">Cargos desejados</h2>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {profile.desiredRoles.map((role) => (
                  <Badge key={role} variant="accent" className="gap-1">
                    {role}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeRole(role)} />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Adicionar cargo..."
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addRole()}
                />
                <Button variant="secondary" size="sm" onClick={addRole}>
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Matriz de Evidências */}
          <Card id="evidence-matrix-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-accent" />
                  Matriz de Evidências
                </h2>
                <span className="text-[10px] text-text-tertiary">Comprove suas habilidades com projetos e métricas reais</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Existing Evidences List */}
              {skillsEvidence.length > 0 ? (
                <div className="space-y-3 mb-6">
                  {skillsEvidence.map((ev: any) => (
                    <div key={ev.id} className="p-3 rounded-lg border border-border bg-bg-elevated/10 relative group hover:border-accent/30 transition-all">
                      <button
                        onClick={() => removeEvidence(ev.id)}
                        className="absolute right-2 top-2 h-5 w-5 rounded hover:bg-danger/10 text-text-tertiary hover:text-danger flex items-center justify-center transition-colors"
                        title="Remover evidência"
                      >
                        <X className="h-3 w-3" />
                      </button>

                      <div className="flex items-center gap-2 mb-1.5 pr-6">
                        {ev.projectUrl ? (
                          <a href={ev.projectUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-accent hover:underline flex items-center gap-1">
                            {ev.projectName} <Globe className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-xs font-semibold text-text-primary">{ev.projectName}</span>
                        )}
                        <Badge variant={ev.confidence === "high" ? "success" : ev.confidence === "medium" ? "accent" : "default"} className="text-[9px] py-0 px-1.5 uppercase font-bold">
                          Confiança: {ev.confidence}
                        </Badge>
                      </div>

                      {ev.description && (
                        <p className="text-xs text-text-secondary mb-1.5 leading-relaxed">{ev.description}</p>
                      )}

                      {ev.metrics && (
                        <p className="text-[11px] text-emerald-400 font-medium mb-1.5">📊 Impacto/Métrica: {ev.metrics}</p>
                      )}

                      {ev.approvedResumeBullet && (
                        <div className="mb-2 bg-bg-subtle/50 p-2 rounded text-[10px] text-text-tertiary italic leading-normal border-l-2 border-border">
                          Bullet de CV: {ev.approvedResumeBullet}
                        </div>
                      )}

                      {ev.associatedSkills && ev.associatedSkills.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {ev.associatedSkills.map((s: string) => (
                            <Badge key={s} variant="default" className="text-[9px] py-0 px-1">{s}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-text-tertiary italic text-center py-4 bg-bg-elevated/5 rounded-lg border border-dashed">
                  Nenhuma evidência de projeto adicionada. Adicione seus projetos abaixo para impulsionar o scoring e a automação de candidaturas.
                </p>
              )}

              {/* Add New Evidence Form */}
              <div className="border-t border-border/60 pt-4 space-y-3">
                <h3 id="evidence-form-title" className="text-xs font-semibold text-text-primary uppercase tracking-wider">Adicionar Evidência de Projeto</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-text-tertiary font-semibold uppercase">Nome do Projeto *</label>
                    <Input
                      placeholder="Ex: DataFlow"
                      value={newEvProject}
                      onChange={(e) => setNewEvProject(e.target.value)}
                      className="text-xs mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-tertiary font-semibold uppercase">Link do Projeto / GitHub</label>
                    <Input
                      placeholder="Ex: https://github.com/..."
                      value={newEvUrl}
                      onChange={(e) => setNewEvUrl(e.target.value)}
                      className="text-xs mt-1"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-text-tertiary font-semibold uppercase">O que este projeto faz?</label>
                  <Input
                    placeholder="Ex: Biblioteca para profiling, Health Score e validação de qualidade de dados..."
                    value={newEvDesc}
                    onChange={(e) => setNewEvDesc(e.target.value)}
                    className="text-xs mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-text-tertiary font-semibold uppercase">Métricas / Resultados Reais</label>
                    <Input
                      placeholder="Ex: Reduziu retrabalho manual em 80%..."
                      value={newEvMetrics}
                      onChange={(e) => setNewEvMetrics(e.target.value)}
                      className="text-xs mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-tertiary font-semibold uppercase">Nível de Confiança / Domínio</label>
                    <Select
                      value={newEvConfidence}
                      onChange={(e) => setNewEvConfidence(e.target.value)}
                      className="text-xs mt-1"
                    >
                      <option value="high">Alta Confiança (Uso diário/Projetos complexos)</option>
                      <option value="medium">Média Confiança (Prática em projetos/Confortável)</option>
                      <option value="low">Básica (Apenas estudos/Projetos simples)</option>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-text-tertiary font-semibold uppercase">Bullet formatado para Currículo</label>
                  <textarea
                    placeholder="Ex: Construí sistema local-first para monitorar e limpar logs operacionais..."
                    value={newEvBullet}
                    onChange={(e) => setNewEvBullet(e.target.value)}
                    className="mt-1 block w-full rounded-lg border bg-bg px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent min-h-[60px]"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-text-tertiary font-semibold uppercase">Habilidades Provadas neste Projeto</label>
                  <div className="flex gap-1.5 flex-wrap my-1.5">
                    {newEvSkills.map((s) => (
                      <Badge key={s} variant="accent" className="gap-1 text-[9px] py-0 px-1.5">
                        {s}
                        <X className="h-2.5 w-2.5 cursor-pointer" onClick={() => removeEvSkill(s)} />
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ex: Python, Pandas, Data Quality..."
                      value={newEvSkillInput}
                      onChange={(e) => setNewEvSkillInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addEvSkill()}
                      className="text-xs"
                    />
                    <Button variant="secondary" size="sm" onClick={addEvSkill} className="text-xs px-3 h-8">
                      Associar Habilidade
                    </Button>
                  </div>
                </div>

                <Button variant="secondary" size="sm" onClick={addEvidence} className="w-full text-xs h-9 mt-2">
                  <Plus className="h-4 w-4 mr-1" />
                  Salvar Evidência na Lista
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Planos de candidatura */}
          <Card id="application-plans-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-accent" />
                  Planos de candidatura (busca pessoal)
                </h2>
                <span className="text-[10px] text-text-tertiary">
                  Meta semanal sugerida:{" "}
                  {applicationPlans
                    .filter((p) => p.active)
                    .reduce((sum: number, p: { weeklyTarget?: number }) => sum + (p.weeklyTarget || 0), 0)}{" "}
                  apps
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {applicationPlans.length === 0 ? (
                <p className="text-xs text-text-tertiary">
                  Rode <code className="text-accent">npm run profile:personal</code> para carregar os planos.
                </p>
              ) : (
                applicationPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className="rounded-lg border border-border/60 bg-bg-elevated/10 p-3 text-left"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-text-primary">{plan.title}</p>
                        <p className="text-[11px] text-text-secondary mt-1">
                          {plan.weeklyTarget}/semana · {(plan.roleFocus || []).join(", ")}
                        </p>
                        <p className="text-[11px] text-text-tertiary mt-1">{plan.notes}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {(plan.channels || []).map((ch: string) => (
                            <Badge key={ch} className="text-[10px]">
                              {ch}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Badge variant={plan.active ? "success" : "default"} className="text-[10px] shrink-0">
                        {plan.active ? "Ativo" : "Pausado"}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Learning Backlog / Plano de Estudos */}
          <Card id="learning-backlog-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-accent" />
                  Plano de Estudos (Learning Backlog)
                </h2>
                <span className="text-[10px] text-text-tertiary">Mapeie e resolva gaps de habilidades de vagas reais</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Form to add new task */}
              <div className="bg-bg-elevated/10 p-3 rounded-lg border border-border/60 space-y-3 text-left">
                <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider">Adicionar Nova Meta de Estudo</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-text-tertiary font-semibold uppercase">Tecnologia / Habilidade *</label>
                    <Input
                      placeholder="Ex: Airflow, dbt, Power BI"
                      value={newBtSkill}
                      onChange={(e) => setNewBtSkill(e.target.value)}
                      className="text-xs mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-tertiary font-semibold uppercase">Título da Meta *</label>
                    <Input
                      placeholder="Ex: Aprender o básico de DAGs"
                      value={newBtTitle}
                      onChange={(e) => setNewBtTitle(e.target.value)}
                      className="text-xs mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-text-tertiary font-semibold uppercase">Origem / Motivo (Opcional)</label>
                    <Input
                      placeholder="Ex: Exigido em 4 vagas de Eng. de Dados"
                      value={newBtReason}
                      onChange={(e) => setNewBtReason(e.target.value)}
                      className="text-xs mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-tertiary font-semibold uppercase">Evidência Esperada ao Concluir *</label>
                    <Input
                      placeholder="Ex: Criar repositório com pipeline simples"
                      value={newBtEvidence}
                      onChange={(e) => setNewBtEvidence(e.target.value)}
                      className="text-xs mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-text-tertiary font-semibold uppercase">Prioridade</label>
                    <Select
                      value={newBtPriority}
                      onChange={(e) => setNewBtPriority(e.target.value)}
                      className="text-xs mt-1"
                    >
                      <option value="high">🔴 Alta Prioridade</option>
                      <option value="medium">🟡 Média Prioridade</option>
                      <option value="low">🔵 Baixa Prioridade</option>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[10px] text-text-tertiary font-semibold uppercase">Prazo (Opcional)</label>
                    <Input
                      type="date"
                      value={newBtDue}
                      onChange={(e) => setNewBtDue(e.target.value)}
                      className="text-xs mt-1"
                    />
                  </div>
                </div>

                <Button variant="secondary" size="sm" onClick={addLearningTask} className="w-full text-xs h-8 mt-1">
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar Meta no Plano de Estudos
                </Button>
              </div>

              {/* Task list */}
              {learningBacklog.length > 0 ? (
                <div className="space-y-2.5 mt-4 text-left">
                  {/* Sorted: Todo tasks first, sorted by priority (high, medium, low) */}
                  {[...learningBacklog]
                    .sort((a, b) => {
                      if (a.status !== b.status) return a.status === "todo" ? -1 : 1;
                      const priorityWeight: Record<string, number> = { high: 3, medium: 2, low: 1 };
                      return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
                    })
                    .map((task) => {
                      const isDone = task.status === "done";
                      return (
                        <div
                          key={task.id}
                          className={`p-3 rounded-lg border transition-all flex items-start gap-3 relative group ${
                            isDone
                              ? "bg-bg-elevated/5 border-border/40 opacity-60"
                              : "bg-bg-elevated/15 border-border/80 hover:border-accent/30"
                          }`}
                        >
                          <button
                            onClick={() => toggleLearningTaskStatus(task.id)}
                            className={`mt-0.5 rounded flex items-center justify-center transition-colors ${
                              isDone ? "text-accent" : "text-text-tertiary hover:text-accent"
                            }`}
                            title={isDone ? "Marcar como a fazer" : "Marcar como concluída"}
                          >
                            {isDone ? (
                              <CheckSquare className="h-4 w-4" />
                            ) : (
                              <Square className="h-4 w-4" />
                            )}
                          </button>

                          <div className="flex-1 space-y-1 pr-6">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span
                                className={`text-xs font-medium ${
                                  isDone ? "line-through text-text-tertiary" : "text-text-primary"
                                }`}
                              >
                                {task.title}
                              </span>
                              <Badge variant="accent" className="text-[9px] py-0 px-1.5 font-semibold uppercase">
                                {task.skill}
                              </Badge>
                              <Badge
                                variant={
                                  task.priority === "high"
                                    ? "danger"
                                    : task.priority === "medium"
                                    ? "warning"
                                    : "default"
                                }
                                className="text-[9px] py-0 px-1.5 uppercase font-bold"
                              >
                                {task.priority === "high" ? "Alta" : task.priority === "medium" ? "Média" : "Baixa"}
                              </Badge>
                            </div>

                            <div className="text-[11px] text-text-secondary leading-relaxed">
                              {task.reason && (
                                <p>
                                  <span className="text-text-tertiary font-medium">Motivo:</span> {task.reason}
                                </p>
                              )}
                              {task.evidenceExpected && (
                                <p>
                                  <span className="text-text-tertiary font-medium">Evidência Esperada:</span> {task.evidenceExpected}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-3 text-[10px] text-text-tertiary pt-0.5">
                              {task.dueAt && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Prazo: {new Date(task.dueAt).toLocaleDateString("pt-BR")}
                                </span>
                              )}
                              {isDone && task.completedAt && (
                                <span className="text-emerald-400">
                                  Concluído em: {new Date(task.completedAt).toLocaleDateString("pt-BR")}
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => removeLearningTask(task.id)}
                            className="absolute right-2 top-2 h-5 w-5 rounded hover:bg-danger/10 text-text-tertiary hover:text-danger flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                            title="Remover meta de estudos"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <p className="text-xs text-text-tertiary italic text-center py-4 bg-bg-elevated/5 rounded-lg border border-dashed">
                  Nenhuma meta de estudos adicionada. Adicione gaps de vagas de alto fit para priorizar seus estudos.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-text-tertiary" />
                Palavras-chave negativas
              </h2>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-text-tertiary">
                Vagas que mencionarem estas palavras terão score reduzido automaticamente.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {negativeKeywords.map((kw) => (
                  <Badge key={kw} variant="default" className="gap-1 bg-danger/10 text-danger dark:bg-danger/20">
                    {kw}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeKeyword(kw)} />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Ex: SAP, COBOL, vendas..."
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addKeyword()}
                />
                <Button variant="secondary" size="sm" onClick={addKeyword}>
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-text-primary">Preferências</h2>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <p className="text-xs text-text-tertiary font-medium mb-2">Modalidade</p>
                <div className="flex gap-2">
                  {(["remote", "hybrid", "onsite"] as LocationType[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => toggleLocation(t)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        profile.desiredLocationTypes.includes(t)
                          ? "bg-accent text-white" : "bg-bg-elevated text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      {locationTypeLabel(t)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-text-tertiary font-medium mb-2">Tipo de contrato</p>
                <div className="flex flex-wrap gap-2">
                  {(["clt", "pj", "internship", "freelancer", "temporary", "international"] as ContractType[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => toggleContract(t)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        profile.desiredContractTypes.includes(t)
                          ? "bg-accent text-white" : "bg-bg-elevated text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      {contractTypeLabel(t)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-text-tertiary font-medium">Salário mínimo</label>
                    <button
                      onClick={applySalarySuggestion}
                      className="text-[10px] text-accent hover:underline"
                      title={`Sugerir R$ ${salarySuggestion.toLocaleString("pt-BR")} para ${experienceLevelLabel(profile.experienceLevel)}`}
                    >
                      Sugerir
                    </button>
                  </div>
                  <Input
                    type="number"
                    value={profile.desiredSalaryMin || ""}
                    onChange={(e) => setProfile({ ...profile, desiredSalaryMin: e.target.value ? parseInt(e.target.value) : null })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-text-tertiary font-medium">Salário máximo</label>
                  <Input
                    type="number"
                    value={profile.desiredSalaryMax || ""}
                    onChange={(e) => setProfile({ ...profile, desiredSalaryMax: e.target.value ? parseInt(e.target.value) : null })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-text-tertiary font-medium">Moeda</label>
                  <Select
                    value={profile.desiredCurrency}
                    onChange={(e) => setProfile({ ...profile, desiredCurrency: e.target.value })}
                    className="mt-1"
                  >
                    <option value="BRL">BRL (R$)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Freelance Preferences */}
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-amber-400" />
                Preferências de Freelance
              </h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-text-tertiary font-medium">Taxa horária mínima (USD)</label>
                  <Input
                    type="number"
                    value={flexProfile.freelanceMinHourlyRate || ""}
                    onChange={(e) => setFlexProfile({ ...flexProfile, freelanceMinHourlyRate: e.target.value ? parseFloat(e.target.value) : null })}
                    className="mt-1"
                    placeholder="ex: 35"
                  />
                </div>
                <div>
                  <label className="text-xs text-text-tertiary font-medium">Moeda preferida</label>
                  <Select
                    value={flexProfile.freelancePreferredCurrency}
                    onChange={(e) => setFlexProfile({ ...flexProfile, freelancePreferredCurrency: e.target.value })}
                    className="mt-1"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="BRL">BRL (R$)</option>
                    <option value="EUR">EUR (€)</option>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-xs text-text-tertiary font-medium">Horas disponíveis por semana</label>
                <div className="flex gap-2 mt-1">
                  {[5, 10, 20, 30, 40].map((h) => (
                    <button
                      key={h}
                      onClick={() => setFlexProfile({ ...flexProfile, freelanceAvailableHoursPerWeek: h })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        flexProfile.freelanceAvailableHoursPerWeek === h
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : "bg-bg-elevated text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      {h}h
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={flexProfile.freelanceOpenToFixedPrice}
                    onChange={(e) => setFlexProfile({ ...flexProfile, freelanceOpenToFixedPrice: e.target.checked })}
                    className="rounded border-border"
                  />
                  Aceito projetos de preço fixo
                </label>
              </div>

              {flexProfile.freelanceOpenToFixedPrice && (
                <div>
                  <label className="text-xs text-text-tertiary font-medium">Valor mínimo por projeto fixo (USD)</label>
                  <Input
                    type="number"
                    value={flexProfile.freelanceMinFixedProjectValue || ""}
                    onChange={(e) => setFlexProfile({ ...flexProfile, freelanceMinFixedProjectValue: e.target.value ? parseFloat(e.target.value) : null })}
                    className="mt-1"
                    placeholder="ex: 500"
                  />
                </div>
              )}

              <div>
                <label className="text-xs text-text-tertiary font-medium">Especialização principal</label>
                <Select value={flexProfile.freelanceSpecialization} onChange={(e) => setFlexProfile({ ...flexProfile, freelanceSpecialization: e.target.value })} className="mt-1">
                  <option value="full-stack">Full-Stack</option>
                  <option value="frontend">Frontend</option>
                  <option value="backend">Backend</option>
                  <option value="data-science">Data Science</option>
                  <option value="ml-ai">ML/AI</option>
                  <option value="devops">DevOps</option>
                  <option value="mobile">Mobile</option>
                </Select>
              </div>

              <div>
                <label className="text-xs text-text-tertiary font-medium">Anos de experiência como freelancer</label>
                <Input
                  type="number"
                  value={flexProfile.freelanceExperienceYears || ""}
                  onChange={(e) => setFlexProfile({ ...flexProfile, freelanceExperienceYears: e.target.value ? parseInt(e.target.value) : null })}
                  className="mt-1"
                  placeholder="ex: 2"
                />
              </div>

              <div>
                <label className="text-xs text-text-tertiary font-medium">Link do portfólio freelance</label>
                <Input
                  type="url"
                  value={flexProfile.freelancePortfolioUrl || ""}
                  onChange={(e) => setFlexProfile({ ...flexProfile, freelancePortfolioUrl: e.target.value })}
                  className="mt-1"
                  placeholder="https://..."
                />
              </div>

              <p className="text-[11px] text-text-tertiary bg-amber-500/5 border border-amber-500/20 rounded-lg p-2">
                <Briefcase className="h-3 w-3 inline mr-1 text-amber-400" />
                Sua taxa horária mínima é usada pelo motor de score freelance para calcular o fit financeiro.
                Sugestão: pesquise no mercado qual a taxa mediana para sua especialização antes de definir.
              </p>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button variant="primary" size="lg" onClick={save} disabled={saving || recalculating}>
              {saving || recalculating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? "Salvando..." : recalculating ? "Recalculando..." : "Salvar e recalcular"}
            </Button>
          </div>
        </div>

        {/* Sidebar: Preview de top matches */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-text-tertiary" />
                Vagas de alto fit
              </h2>
            </CardHeader>
            <CardContent>
              {topMatches.length === 0 ? (
                <p className="text-xs text-text-tertiary">Nenhuma vaga com alto fit ainda.</p>
              ) : (
                <div className="space-y-2">
                  {topMatches.map((job) => (
                    <Link key={job.id} href={`/jobs/${job.id}`}>
                      <div className="rounded-lg p-2.5 hover:bg-bg-elevated transition-colors">
                        <p className="text-xs font-medium text-text-primary leading-snug line-clamp-2">{job.title}</p>
                        <p className="text-[10px] text-text-secondary mt-0.5">{job.company}</p>
                        <div className="flex items-center gap-1 mt-1">
                          {job.fitLabel && (
                            <Badge variant={job.fitLabel === "high" ? "success" : "accent"} className="text-[9px] py-0 px-1.5">
                              {fitLabelText(job.fitLabel)}
                            </Badge>
                          )}
                          {job.score !== null && (
                            <span className="text-[10px] font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                              {Math.round(job.score * 100)}%
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {showBtSuggestEvidenceDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-bg border border-border rounded-xl p-6 max-w-md w-full mx-4 shadow-xl text-left">
            <div className="flex items-start gap-3">
              <Sparkles className="h-6 w-6 text-accent shrink-0" />
              <div>
                <h3 className="text-base font-semibold text-text-primary">Tarefa de Estudos Concluída!</h3>
                <p className="text-xs text-text-secondary mt-2 leading-relaxed">
                  Você concluiu seus estudos para a habilidade <strong className="text-accent">{btSelectedTech}</strong>.
                  Deseja registrar uma nova evidência (como um projeto ou aprendizado prático) na sua <strong>Matriz de Evidências</strong> para comprovar este conhecimento e turbinar seu Actionability Score nas vagas?
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2.5 mt-5">
              <Button
                variant="secondary"
                onClick={() => setShowBtSuggestEvidenceDialog(false)}
              >
                Agora Não
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setShowBtSuggestEvidenceDialog(false);
                  // Populate the new evidence skill input/tag
                  if (btSelectedTech && !newEvSkills.includes(btSelectedTech)) {
                    setNewEvSkills([...newEvSkills, btSelectedTech]);
                  }
                  // Scroll to the evidence card/form
                  setTimeout(() => {
                    const el = document.getElementById("evidence-matrix-card");
                    if (el) {
                      el.scrollIntoView({ behavior: "smooth" });
                    }
                  }, 100);
                }}
              >
                Sim, Criar Evidência
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
