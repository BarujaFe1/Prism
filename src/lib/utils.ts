import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatSalary(
  min: number | null,
  max: number | null,
  currency: string | null,
  period: string | null
): string {
  if (!min && !max) return "";
  const curr = currency || "BRL";
  const fmt = (n: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: curr,
      maximumFractionDigits: 0,
    }).format(n);

  if (min && max) return `${fmt(min)} - ${fmt(max)}`;
  if (min) return `a partir de ${fmt(min)}`;
  if (max) return `até ${fmt(max)}`;
  return "";
}

export function timeAgo(date: string | Date): string {
  const now = new Date();
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "hoje";
  if (days === 1) return "ontem";
  if (days < 7) return `há ${days} dias`;
  if (days < 30) return `há ${Math.floor(days / 7)} sem`;
  if (days < 365) return `há ${Math.floor(days / 30)} meses`;
  return `há ${Math.floor(days / 365)} anos`;
}

export function getApplicationStatusLabel(status: string): string {
  const map: Record<string, string> = {
    new: "Nova",
    saved: "Salva",
    high_priority: "Prioridade",
    preparing: "Preparando",
    applied: "Aplicada",
    reviewing: "Em análise",
    testing: "Teste Técnico",
    interview: "Entrevista",
    offer: "Oferta",
    rejected: "Recusada",
    ignored: "Ignorada",
    archived: "Arquivada",
  };
  return map[status] || status;
}

export function getApplicationStatusColor(status: string): string {
  const map: Record<string, string> = {
    new: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    saved: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    high_priority: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    preparing: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    applied: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    reviewing: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    testing: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    interview: "bg-pink-500/10 text-pink-400 border-pink-500/20",
    offer: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    rejected: "bg-red-500/10 text-red-400 border-red-500/20",
    ignored: "bg-zinc-500/10 text-zinc-500 border-zinc-500/15",
    archived: "bg-zinc-500/10 text-zinc-500 border-zinc-500/15",
  };
  return map[status] || "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
}

export function statusLabel(status: string): string {
  return getApplicationStatusLabel(status);
}

export function locationTypeLabel(t: string): string {
  const map: Record<string, string> = {
    remote: "Remoto",
    hybrid: "Híbrido",
    onsite: "Presencial",
  };
  return map[t] || t;
}

export function contractTypeLabel(t: string): string {
  const map: Record<string, string> = {
    clt: "CLT",
    pj: "PJ",
    internship: "Estágio",
    freelancer: "Freelancer",
    temporary: "Temporário",
    international: "Internacional",
  };
  return map[t] || t;
}

export function experienceLevelLabel(t: string): string {
  const map: Record<string, string> = {
    internship: "Estágio",
    trainee: "Trainee",
    junior: "Júnior",
    mid: "Pleno",
    senior: "Sênior",
    lead: "Lead",
  };
  return map[t] || t;
}

export function fitLabelColor(label: string | null): string {
  const map: Record<string, string> = {
    high: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30",
    good: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30",
    partial: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30",
    low: "text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/30",
  };
  return map[label || ""] || map.low;
}

export function fitLabelText(label: string | null): string {
  const map: Record<string, string> = {
    high: "Excelente fit",
    good: "Bom fit",
    partial: "Revisar",
    low: "Baixo fit",
  };
  return map[label || ""] || "Sem avaliação";
}

export function generateId(): string {
  return crypto.randomUUID();
}
