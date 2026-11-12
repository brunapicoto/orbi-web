import { planLabel } from "@/lib/app/kinds";

export const PRICE_LABELS = ["free", "$", "$$", "$$$"] as const;

export function priceLabel(level: number | null | undefined) {
  return level == null ? null : PRICE_LABELS[level] ?? null;
}

/** The plan's name: its title, or "dinner", "networking · finance"... */
export function planTitle(p: { title?: string | null; kind: string; topic?: string | null }) {
  return p.title?.trim() || planLabel(p);
}

/** "2 of 4 in" while waiting; "confirmed · 5 in" once it reaches the minimum. */
export function countLine(going: number, min: number, status: string) {
  if (status === "on" || status === "live") return `confirmed · ${going} in`;
  return `${going} of ${min} in`;
}
