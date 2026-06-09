"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Shell } from "@/components/layout/Shell";
import { Users, Loader2 } from "lucide-react";

export default function FreelanceClientesPage() {
  const { data: projects, isLoading } = useQuery({
    queryKey: ["freelance-clientes"],
    queryFn: async () => {
      const res = await fetch("/api/freelance/projects?limit=200");
      const data = await res.json();
      return data.projects || [];
    },
  });

  const clientMap = new Map<string, { count: number; maxRating: number; platforms: Set<string>; projects: any[] }>();
  (projects || []).forEach((p: any) => {
    if (!p.clientName) return;
    const existing = clientMap.get(p.clientName) || { count: 0, maxRating: 0, platforms: new Set(), projects: [] };
    existing.count++;
    existing.maxRating = Math.max(existing.maxRating, p.clientRating || 0);
    existing.platforms.add(p.platform);
    existing.projects.push(p);
    clientMap.set(p.clientName, existing);
  });

  const sortedClients = [...clientMap.entries()]
    .map(([name, data]) => ({ name, ...data, platforms: [...data.platforms] }))
    .sort((a, b) => b.count - a.count);

  return (
    <Shell>
    <div className="px-6 pt-4 pb-16 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Users className="h-5 w-5 text-amber-400" />
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Clientes Monitorados</h1>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-text-tertiary" />
        </div>
      ) : sortedClients.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-text-secondary">Nenhum cliente identificado ainda</p>
            <p className="text-xs text-text-tertiary mt-1">Os clientes aparecerão automaticamente após coletar projetos</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {sortedClients.slice(0, 50).map((client) => (
            <Card key={client.name}>
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{client.name}</p>
                    <div className="flex items-center gap-3 text-xs text-text-tertiary mt-0.5">
                      <span>{client.count} projetos</span>
                      {client.maxRating > 0 && <span>⭐ {client.maxRating}</span>}
                      <span>{client.platforms.join(", ")}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
    </Shell>
  );
}
