/** Display formatting helpers. */

export function compactNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 ? 1 : 0)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n % 1_000 ? 1 : 0)}K`;
  return String(n);
}

export function outlier(n: number): string {
  return `${n.toFixed(1)}x`;
}

export function percent(n: number): string {
  return `${n.toFixed(0)}%`;
}

export function relativeDay(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const day = 86_400_000;
  if (diff < day) return "Today";
  if (diff < 2 * day) return "Yesterday";
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;
  return d.toLocaleDateString();
}
