import { isDemoMode } from "@/lib/api-guards";

/** Visible only when PRISM_DEMO_MODE is enabled (server-rendered). */
export function DemoBanner() {
  if (!isDemoMode()) return null;

  return (
    <div
      role="status"
      className="border-b border-amber-500/40 bg-amber-500/10 px-4 py-2 text-center text-sm text-amber-950 dark:text-amber-100"
    >
      <strong className="font-semibold">Demo somente leitura.</strong>{" "}
      Dados sintéticos · mutações e sync desabilitados ·{" "}
      <a
        className="underline underline-offset-2 hover:opacity-80"
        href="https://github.com/BarujaFe1/Prism"
      >
        código no GitHub
      </a>
    </div>
  );
}
