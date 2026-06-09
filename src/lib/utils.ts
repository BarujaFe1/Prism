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

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    new: "Nova",
    saved: "Salva",
    high_priority: "Prioridade",
    preparing: "Preparando",
    applied: "Aplicada",
    reviewing: "Em análise",
    interview: "Entrevista",
    offer: "Oferta",
    rejected: "Recusada",
    ignored: "Ignorada",
    archived: "Arquivada",
  };
  return map[status] || status;
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
