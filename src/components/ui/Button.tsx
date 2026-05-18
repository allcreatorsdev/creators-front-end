import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-hover",
  secondary: "bg-bg text-text border border-border hover:bg-nav-active",
  ghost: "text-faint hover:text-text hover:bg-nav-active",
  danger: "text-red-600 hover:bg-red-50",
};

export function Button({
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2",
        "text-sm font-medium transition-colors disabled:opacity-50",
        "disabled:pointer-events-none",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
