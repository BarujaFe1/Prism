"use client";

import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { useUIStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

export function Shell({ children }: { children: ReactNode }) {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main
        className={cn(
          "flex-1 transition-all duration-300",
          sidebarOpen ? "ml-56" : "ml-16"
        )}
      >
        <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-bg/80 backdrop-blur-xl px-6 py-3">
          <button
            onClick={toggleSidebar}
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
