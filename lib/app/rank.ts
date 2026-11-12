import { kindLabel, TIME_ZONE } from "@/lib/app/kinds";
import type { PlanSignal, PlanView, Prefs } from "@/lib/app/types";

export const TIMES = [
  { id: "weeknight", label: "weeknights" },
  { id: "weekend-morning", label: "weekend mornings" },
  { id: "weekend-afternoon", label: "weekend afternoons" },
  { id: "weekend-night", label: "weekend nights" },
] as const;

export const AREAS = [
  { id: "manhattan", label: "manhattan" },
  { id: "brooklyn", label: "brooklyn" },
  { id: "queens", label: "queens" },
  { id: "outside", label: "a little outside the city" },
] as const;

export const SIZES = [
  { id: "small", label: "small, 3 to 4" },
  { id: "medium", label: "medium, 5 to 6" },
  { id: "big", label: "the more the merrier" },
] as const;

// neighborhood words in a plan's place, to guess the area (plans have free-text places)
const AREA_WORDS: Record<string, string[]> = {
  manhattan: ["manhattan", "nolita", "soho", "noho", "chelsea", "village", "les", "lower east", "tribeca", "flatiron", "midtown", "harlem", "upper east", "upper west", "central park", "east river", "hudson", "kips bay", "gramercy", "fidi"],
  brooklyn: ["brooklyn", "williamsburg", "bushwick", "greenpoint", "bed-stuy", "bedstuy", "park slope", "dumbo", "fort greene", "carroll gardens", "crown heights", "prospect", "cobble hill", "red hook", "clinton hill"],
  queens: ["queens", "astoria", "long island city", "lic", "ridgewood", "jackson heights", "sunnyside", "rockaway"],
  outside: ["beacon", "hudson valley", "jersey", "hoboken", "upstate", "long beach", "montauk"],
};

/** Which part of the week a plan falls in, on New York time. */
export function timeBucket(iso: string): string | null {
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-US", { weekday: "short", hour: "numeric", hour12: false, timeZone: TIME_ZONE }).formatToParts(d);
  const day = parts.find((p) => p.type === "weekday")?.value ?? "";
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0) % 24;
  const weekend = day === "Sat" || day === "Sun" || (day === "Fri" && hour >= 17);
  if (!weekend) return hour >= 17 ? "weeknight" : null;
  if (day === "Fri" || hour >= 17) return "weekend-night";
  return hour < 12 ? "weekend-morning" : "weekend-afternoon";
}

export function areaOf(place: string): string | null {
  const p = place.toLowerCase();
  for (const [area, words] of Object.entries(AREA_WORDS)) if (words.some((w) => new RegExp(`\\b${w}\\b`).test(p))) return area;
  return null;
}

export function sizeOf(plan: PlanView): "small" | "medium" | "big" {
  const total = 1 + plan.bringing + plan.openSpots;
  return total <= 4 ? "small" : total <= 6 ? "medium" : "big";
}

export type Ranked = { plan: PlanView; score: number; why: string | null };

/**
 * Orders plans for you. Uses only the plan (type, time, place, size) and how soon it is,
 * never who is in it. Nothing is hidden: plans that match nothing still show, lower down.
 */
export function rankPlans(plans: PlanView[], prefs: Prefs | null, signals?: Map<string, PlanSignal | null>): Ranked[] {
  const now = Date.now();
  const ranked = plans.map((plan) => {
    const why: string[] = [];
    let score = 0;
    if (prefs) {
      if (prefs.kinds.includes(plan.kind)) {
        score += 3;
        why.push(`you like ${kindLabel(plan.kind)}`);
      }
      const t = timeBucket(plan.startsAt);
      if (t && prefs.times.includes(t)) {
        score += 2;
        why.push(TIMES.find((x) => x.id === t)!.label);
      }
      const a = areaOf(plan.place);
      if (a && prefs.areas.includes(a)) {
        score += 1.5;
        why.push(a === "outside" ? "a little outside the city" : `in ${a}`);
      }
      if (prefs.groupSize && prefs.groupSize === sizeOf(plan)) {
        score += 1;
        why.push(`${prefs.groupSize} group`);
      }
    }
    if (plan.status === "on") score += 0.5;
    if (signals?.get(plan.id)?.band) score += 0.5;
    // sooner plans first, gently: about one point less per week out
    const days = Math.max(0, (new Date(plan.startsAt).getTime() - now) / 86_400_000);
    score -= Math.min(days, 30) * 0.15;
    return { plan, score, why: why.length ? why.slice(0, 2).join(" · ") : null };
  });
  return ranked.sort((x, y) => y.score - x.score || x.plan.startsAt.localeCompare(y.plan.startsAt));
}
