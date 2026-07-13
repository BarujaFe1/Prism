"use client";

import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "./Sidebar";
import { useUIStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import type { SettingsData } from "@/types";

export function Shell({ children }: { children: ReactNode }) {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  const { data: settings } = useQuery<SettingsData>({
    queryKey: ["settings-shell"],
    queryFn: async () => {
      const res = await fetch("/api/settings");
      return res.json();
    },
    staleTime: 60_000,
  });

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main
        className={cn(
          "flex-1 transition-all duration-300",
          sidebarOpen ? "ml-56" : "ml-16"
        )}
      >
        {settings?.demoMode && (
          <div
            role="status"
            className="border-b border-amber-500/30 bg-amber-500/10 px-6 py-2 text-xs text-amber-800 dark:text-amber-200"
          >
            Modo demo somente leitura — mutações e sync de conectores estão desabilitados.
          </div>
        )}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-bg/80 backdrop-blur-xl px-6 py-3">
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={sidebarOpen ? "Recolher menu lateral" : "Expandir menu lateral"}
            aria-expanded={sidebarOpen}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors"
          >
            {sidebarOpen ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeftOpen className="h-4 w-4" />
            )}
          </button>
        </div>
        <div className="animate-fade-in">{children}</div>
      </main>
    </div>
  );
}
