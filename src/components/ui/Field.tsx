import { cn } from "@/lib/utils/cn";

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "text-xs font-medium uppercase tracking-wider text-faint",
        className,
      )}
      {...props}
    />
  );
}

const fieldBase =
  "w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm " +
  "text-text placeholder:text-faint outline-none focus:border-brand";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldBase, className)} {...props} />;
}

export function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(fieldBase, "appearance-none", className)} {...props} />
  );
}
