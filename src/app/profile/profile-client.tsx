"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { User, Plus, X, Save, Loader2, Sparkles, AlertTriangle, Globe, Briefcase } from "lucide-react";
import type { ProfileData, LocationType, ContractType, ExperienceLevel, JobWithStatus } from "@/types";
import { locationTypeLabel, contractTypeLabel, experienceLevelLabel, fitLabelText } from "@/lib/utils";
import Link from "next/link";

const DEFAULTS: ProfileData = {
  name: "Felipe Baruja",
  headline: "Cientista de Dados em formação | Full-Stack | USP-ICMC",
  summary: "Estudante de Estatística e Ciência de Dados na USP-ICMC (1º ano). Desenvolvedor full-stack com projetos reais em produção (React Native, Next.js, Python). Busco estágio em Ciência de Dados, Analytics ou desenvolvimento.",
  skills: [
    "Python", "Pandas", "SQL", "Statistics", "Data Science", "EDA",
    "TypeScript", "Next.js", "React", "Node.js", "FastAPI",
    "PostgreSQL", "SQLite", "Drizzle ORM", "Supabase",
    "Git", "GitHub", "Excel", "Google Sheets", "API",
    "Machine Learning", "Scikit-learn", "Probability",
    "React Native", "Docker", "Vercel", "Selenium",
  ],
  desiredRoles: [
    "Estágio em Ciência de Dados",
    "Estágio em Análise de Dados",
    "Estágio em Engenharia de Dados",
    "Estágio em Business Intelligence",
    "Estágio em Desenvolvimento Full-Stack",
    "Júnior em Data Science",
    "Júnior em Data Analytics",
    "Júnior em Full-Stack",
  ],
  desiredSalaryMin: 1500,
  desiredSalaryMax: 5000,
  desiredCurrency: "BRL",
  desiredLocationTypes: ["remote", "hybrid"],
  desiredContractTypes: ["internship", "clt", "pj", "international"],
  experienceLevel: "junior",
  languages: ["Português", "Inglês"],
};

export function ProfileClient() {
  const router = useRouter();
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProfileData>(DEFAULTS);
  const [newSkill, setNewSkill] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newKeyword, setNewKeyword] = useState("");
  const [negativeKeywords, setNegativeKeywords] = useState<string[]>([
    "vendas", "SAP", "COBOL", "presencial", "VBA", "Delphi", "mainframe",
  ]);
  const [saving, setSaving] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [flexProfile, setFlexProfile] = useState({
    freelanceMinHourlyRate: null as number | null,
    freelancePreferredCurrency: "USD",
    freelanceAvailableHoursPerWeek: 20,
    freelanceOpenToFixedPrice: true,
    freelanceMinFixedProjectValue: null as number | null,
    freelanceExperienceYears: null as number | null,
    freelancePortfolioUrl: "",
    freelanceSpecialization: "full-stack",
  });

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data && data.id) {
          setProfile(data);
          if (data.negativeKeywords) setNegativeKeywords(data.negativeKeywords);
          setFlexProfile({
            freelanceMinHourlyRate: data.freelanceMinHourlyRate ?? null,
            freelancePreferredCurrency: data.freelancePreferredCurrency ?? "USD",
            freelanceAvailableHoursPerWeek: data.freelanceAvailableHoursPerWeek ?? 20,
            freelanceOpenToFixedPrice: data.freelanceOpenToFixedPrice ?? true,
            freelanceMinFixedProjectValue: data.freelanceMinFixedProjectValue ?? null,
            freelanceExperienceYears: data.freelanceExperienceYears ?? null,
            freelancePortfolioUrl: data.freelancePortfolioUrl ?? "",
            freelanceSpecialization: data.freelanceSpecialization ?? "full-stack",
          });
        }
      })
      .catch(() => {});
  }, []);

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

  const save = async () => {
    setSaving(true);
    try {
      const body = { ...profile, negativeKeywords, ...flexProfile };
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
    </div>
  );
}
