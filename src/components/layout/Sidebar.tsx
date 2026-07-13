"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Radar,
  Compass,
  GitPullRequestArrow,
  BarChart3,
  Cable,
  User,
  Settings,
  Moon,
  Sun,
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "./ThemeProvider";
import { useUIStore } from "@/lib/store";

const navItems = [
  { href: "/", label: "Radar", icon: Radar },
  { href: "/explore", label: "Explorar", icon: Compass },
  { href: "/freelas", label: "Freelas", icon: Briefcase, freelance: true },
  { href: "/pipeline", label: "Pipeline", icon: GitPullRequestArrow },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/sources", label: "Fontes", icon: Cable },
  { href: "/profile", label: "Perfil", icon: User },
  { href: "/settings", label: "Ajustes", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-30 flex h-full flex-col border-r bg-bg transition-all duration-300",
        sidebarOpen ? "w-56" : "w-16"
      )}
    >
      <div className={cn("flex items-center px-5 pt-6 pb-4", !sidebarOpen && "justify-center px-0")}>
        {sidebarOpen ? (
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent">
              <span className="text-xs font-bold text-white">P</span>
            </div>
            <span className="text-sm font-semibold tracking-tight text-text-primary">Prism</span>
          </Link>
        ) : (
          <Link href="/" className="flex items-center justify-center">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent">
              <span className="text-xs font-bold text-white">P</span>
            </div>
          </Link>
        )}
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const isFreelance = (item as any).freelance;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200",
                isActive && isFreelance && "bg-amber-500/10 text-amber-400 font-medium",
                isActive && !isFreelance && "bg-accent-subtle text-accent font-medium",
                !isActive && "text-text-secondary hover:text-text-primary hover:bg-bg-elevated",
                !sidebarOpen && "justify-center px-0"
              )}
              title={!sidebarOpen ? item.label : undefined}
            >
              <item.icon className={cn("h-4 w-4 shrink-0", isFreelance && "text-amber-400/70")} />
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className={cn("border-t px-3 py-3", !sidebarOpen && "flex justify-center")}>
        <button
          onClick={toggle}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-all duration-200 w-full",
            !sidebarOpen && "justify-center px-0"
          )}
          title={!sidebarOpen ? (theme === "dark" ? "Modo claro" : "Modo escuro") : undefined}
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4 shrink-0" />
          ) : (
            <Moon className="h-4 w-4 shrink-0" />
          )}
          {sidebarOpen && <span>{theme === "dark" ? "Modo claro" : "Modo escuro"}</span>}
        </button>
      </div>
    </aside>
  );
}
