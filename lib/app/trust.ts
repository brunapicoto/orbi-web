import type { PlanSignal } from "@/lib/app/types";

/** Copy for the group-level trust signal. Never about one person. */
export function trustLines(signal: PlanSignal | null) {
  const base = "everyone here is in your network";
  if (!signal?.band) return { base, band: null as string | null };
  const band = signal.band === "a few" ? "a few friends in common, on average" : `${signal.band} friends in common, on average`;
  return { base, band };
}
