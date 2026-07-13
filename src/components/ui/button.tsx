import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary: "bg-accent text-white hover:bg-accent/90 shadow-sm",
        secondary: "bg-bg-elevated text-text-primary hover:bg-border",
        ghost: "text-text-secondary hover:text-text-primary hover:bg-bg-elevated",
        danger: "bg-danger text-white hover:bg-danger/90",
        outline: "border bg-transparent text-text-primary hover:bg-bg-elevated",
      },
      size: {
        sm: "h-8 px-3 text-xs gap-1.5",
        md: "h-9 px-4 text-sm gap-2",
        lg: "h-10 px-5 text-sm gap-2",
        icon: "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export function Button({
  className,
  variant,
  size,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {children}
    </button>
  );
}
