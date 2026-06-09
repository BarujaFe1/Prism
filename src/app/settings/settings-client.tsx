"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Palette, Download, Upload, Trash2, Info,
  Moon, Sun, Monitor, Bell, Clock, Calendar,
} from "lucide-react";
import { useUIStore } from "@/lib/store";
import { useState } from "react";
import { useToast } from "@/components/ui/toast";
import type { SettingsData } from "@/types";

export function SettingsClient() {
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery<SettingsData>({
    queryKey: ["settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings");
      return res.json();
    },
    staleTime: 30000,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: Partial<SettingsData>) => {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast("Configurações salvas", "success");
    },
    onError: () => toast("Erro ao salvar", "error"),
  });

  const [local, setLocal] = useState<SettingsData | null>(null);
  const s = local || settings || {
    syncFrequency: "6", notificationsEnabled: true, followUpDays: 5,
    alertHighFitDays: 2, dailyBriefingEnabled: true, lastBackupAt: null,
  };

  if (!isLoading && !local && settings) setLocal(settings);

  const themeOptions = [
    { value: "light" as const, label: "Claro", icon: Sun },
    { value: "dark" as const, label: "Escuro", icon: Moon },
    { value: "system" as const, label: "Sistema", icon: Monitor },
  ];

  return (
    <div className="px-6 pt-4 pb-16 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Ajustes</h1>
        <p className="text-sm text-text-secondary mt-1">Configurações do Prism</p>
      </div>

      <div className="space-y-5">
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Palette className="h-4 w-4 text-text-tertiary" />Tema
            </h2>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {themeOptions.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button key={opt.value} onClick={() => setTheme(opt.value)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${theme === opt.value ? "bg-accent text-white" : "bg-bg-elevated text-text-secondary hover:text-text-primary"}`}>
                    <Icon className="h-4 w-4" />{opt.label}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Clock className="h-4 w-4 text-text-tertiary" />Sincronização
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs text-text-tertiary font-medium">Frequência de sincronização automática</label>
              <select value={s.syncFrequency} onChange={(e) => setLocal({ ...s, syncFrequency: e.target.value })}
                className="mt-1 block w-full rounded-lg border bg-bg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40">
                <option value="1">A cada 1 hora</option>
                <option value="6">A cada 6 horas</option>
                <option value="12">A cada 12 horas</option>
                <option value="24">Uma vez por dia</option>
                <option value="manual">Apenas manual</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Bell className="h-4 w-4 text-text-tertiary" />Notificações e Alertas
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={s.notificationsEnabled}
                onChange={(e) => setLocal({ ...s, notificationsEnabled: e.target.checked })}
                className="rounded border-text-tertiary text-accent focus:ring-accent/40 h-4 w-4" />
              <div>
                <p className="text-sm text-text-primary">Notificações in-app</p>
                <p className="text-xs text-text-tertiary">Mostrar badge no Radar quando houver novas vagas de alto fit</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={s.dailyBriefingEnabled}
                onChange={(e) => setLocal({ ...s, dailyBriefingEnabled: e.target.checked })}
                className="rounded border-text-tertiary text-accent focus:ring-accent/40 h-4 w-4" />
              <div>
                <p className="text-sm text-text-primary">Briefing diário</p>
                <p className="text-xs text-text-tertiary">Mostrar resumo do dia ao abrir o Radar</p>
              </div>
            </label>

            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <label className="text-xs text-text-tertiary font-medium">Dias para follow-up</label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-text-tertiary" />
                  <input type="number" min={1} max={30} value={s.followUpDays}
                    onChange={(e) => setLocal({ ...s, followUpDays: Number(e.target.value) })}
                    className="w-20 rounded-lg border bg-bg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40" />
                </div>
              </div>
              <div>
                <label className="text-xs text-text-tertiary font-medium">Alertar alto fit após (dias)</label>
                <div className="flex items-center gap-2 mt-1">
                  <Bell className="h-4 w-4 text-text-tertiary" />
                  <input type="number" min={1} max={14} value={s.alertHighFitDays}
                    onChange={(e) => setLocal({ ...s, alertHighFitDays: Number(e.target.value) })}
                    className="w-20 rounded-lg border bg-bg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Download className="h-4 w-4 text-text-tertiary" />Dados
            </h2>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="secondary" size="md" className="w-full justify-start">
              <Download className="h-4 w-4" />Exportar dados (JSON)
            </Button>
            <Button variant="secondary" size="md" className="w-full justify-start">
              <Upload className="h-4 w-4" />Importar dados
            </Button>
            <Button variant="ghost" size="md" className="w-full justify-start text-danger hover:text-danger">
              <Trash2 className="h-4 w-4" />Limpar todos os dados
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Info className="h-4 w-4 text-text-tertiary" />Sobre
            </h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm text-text-secondary">
              <p>Prism v0.2.0</p>
              <p>Radar pessoal de oportunidades de carreira</p>
              <p className="text-xs text-text-tertiary mt-2">Construído com Next.js, SQLite e TypeScript</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="primary" onClick={() => saveMutation.mutate(s)} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Salvando..." : "Salvar configurações"}
          </Button>
        </div>
      </div>
    </div>
  );
}
