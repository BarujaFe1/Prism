"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Shell } from "@/components/layout/Shell";
import { BarChart3, Briefcase, TrendingUp, DollarSign, Target, Loader2 } from "lucide-react";

export default function FreelanceAnalyticsPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["freelance-analytics"],
    queryFn: async () => {
      const [syncRes, projectsRes] = await Promise.all([
        fetch("/api/freelance/sync"),
        fetch("/api/freelance/projects?limit=1"),
      ]);
      const sync = await syncRes.json();
      const proj = await projectsRes.json();
      return { ...sync, total: proj.total || sync.totalProjects };
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-text-tertiary" />
      </div>
    );
  }

  const byPlatform = stats?.byPlatform || {};
  const platformEntries = Object.entries(byPlatform).sort((a, b) => (b[1] as number) - (a[1] as number));
  const sources = stats?.sources || [];

  return (
    <Shell>
    <div className="px-6 pt-4 pb-16 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="h-5 w-5 text-amber-400" />
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Analytics Freelas</h1>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        <Card>
          <CardContent className="py-3 px-4">
            <p className="text-xs text-text-tertiary">Total Projetos</p>
            <p className="text-xl font-semibold text-text-primary">{stats?.totalProjects || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4">
            <p className="text-xs text-text-tertiary">Fontes Ativas</p>
            <p className="text-xl font-semibold text-text-primary">{sources.filter((s: any) => s.enabled).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4">
            <p className="text-xs text-text-tertiary">Janelas de Oportunidade</p>
            <p className="text-xl font-semibold text-amber-400">{stats?.opportunityWindows || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4">
            <p className="text-xs text-text-tertiary">Plataformas</p>
            <p className="text-xl font-semibold text-text-primary">{platformEntries.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="py-4 px-5">
            <h2 className="text-sm font-semibold text-text-primary mb-3">Projetos por Plataforma</h2>
            <div className="space-y-2">
              {platformEntries.length === 0 ? (
                <p className="text-xs text-text-tertiary">Nenhum projeto coletado ainda</p>
              ) : platformEntries.map(([platform, count]) => (
                <div key={platform} className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary capitalize">{platform}</span>
                  <span className="font-medium text-text-primary">{count as number}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4 px-5">
            <h2 className="text-sm font-semibold text-text-primary mb-3">Fontes de Sincronização</h2>
            <div className="space-y-2">
              {sources.length === 0 ? (
                <p className="text-xs text-text-tertiary">Nenhuma fonte configurada</p>
              ) : sources.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="text-text-secondary">{s.name}</span>
                    {s.errorMessage && <span className="text-red-400 text-xs ml-2">⚠</span>}
                  </div>
                  <span className="text-xs text-text-tertiary">{s.totalCollected || 0} projetos</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </Shell>
  );
}
