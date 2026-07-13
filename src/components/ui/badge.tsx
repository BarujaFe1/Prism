import { cn } from "@/lib/utils";

export function Badge({
  className,
  children,
  variant = "default",
}: {
  className?: string;
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "accent";
}) {
  const variants = {
    default: "bg-bg-elevated text-text-secondary",
    success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
    warning: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
    danger: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400",
    accent: "bg-accent-subtle text-accent",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
