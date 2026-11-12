import Link from "next/link";
import { KindIcon } from "@/components/app/KindIcon";
import { formatWhen, planLabel } from "@/lib/app/kinds";
import { trustLines } from "@/lib/app/trust";
import type { PlanSignal, PlanView } from "@/lib/app/types";

/** Spots as dots: filled for people in (host included), dashed for open. No names. */
export function SpotDots({ plan }: { plan: PlanView }) {
  const total = plan.openSpots + 1 + plan.bringing;
  const filled = plan.taken + 1 + plan.bringing;
  return (
    <span className="flex items-center" aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`-mr-1.5 h-[18px] w-[18px] rounded-full border-2 border-ink-2 ${
            i < filled ? "bg-muted-2 blur-[0.6px]" : "border-dashed !border-lavender/70 bg-transparent"
          }`}
        />
      ))}
    </span>
  );
}

export function planLine(plan: PlanView) {
  const left = plan.openSpots - plan.taken;
  if (plan.status === "live") return "happening now";
  if (plan.status === "past") return "it happened";
  if (left <= 0) return "full";
  // still waiting: how close it is to happening
  if (plan.status === "open") return `${plan.taken + 1 + plan.bringing} of ${plan.minPeople} in`;
  return `${left} ${left === 1 ? "spot" : "spots"} left`;
}

export function whoLine(plan: PlanView) {
  if (plan.isHost) return "you're hosting";
  if (plan.joined) return "you're in";
  return "someone is hosting";
}

export function TrustDot() {
  return (
    <svg viewBox="0 0 120 120" className="h-3.5 w-3.5 shrink-0" aria-hidden="true">
      <circle cx="60" cy="60" r="19" fill="currentColor" />
      <circle cx="60" cy="29" r="8" fill="currentColor" />
      <circle cx="86.8" cy="75.5" r="8" fill="currentColor" />
      <circle cx="33.2" cy="75.5" r="8" fill="currentColor" />
    </svg>
  );
}

export function PlanCard({ plan, signal, why }: { plan: PlanView; signal?: PlanSignal | null; why?: string | null }) {
  const trust = signal !== undefined ? trustLines(signal) : null;
  const happening = plan.status === "on" || plan.status === "live";
  return (
    <Link
      href={`/app/plan/${plan.id}`}
      className="group flex flex-col gap-5 rounded-3xl bg-ink-2 p-5 ring-1 ring-line ring-inset transition-colors hover:ring-lavender/50"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="mono flex items-center gap-2 text-lavender">
            <KindIcon kind={plan.kind} className="h-4 w-4" />
            {planLabel(plan)}
          </span>
          <span className="display text-[1.75rem] leading-tight text-bone [overflow-wrap:anywhere]">{plan.title || plan.place}</span>
          {plan.title ? (
            <span className="text-[15px] text-muted [overflow-wrap:anywhere]">
              {plan.place}
              {plan.neighborhood ? ` · ${plan.neighborhood}` : ""}
            </span>
          ) : null}
        </div>
        <span className="mono shrink-0 pt-0.5 text-muted-2">{whoLine(plan)}</span>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-line pt-4">
        <span className="mono text-muted">{formatWhen(plan.startsAt)}</span>
        <span className="flex items-center gap-3">
          <SpotDots plan={plan} />
          <span className={`mono ${happening ? "text-lavender" : "text-muted"}`}>
            {plan.status === "on" ? "it's on · " : ""}
            {planLine(plan)}
          </span>
        </span>
      </div>
      {why ? <p className="mono -mt-2 text-lavender">for you · {why}</p> : null}
      {trust ? (
        <p className="mono -mt-1 flex items-center gap-2 text-lavender-soft">
          <TrustDot />
          {trust.band ?? trust.base}
        </p>
      ) : null}
    </Link>
  );
}
