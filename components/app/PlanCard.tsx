import Link from "next/link";
import { KindIcon } from "@/components/app/KindIcon";
import { formatWhen, planLabel } from "@/lib/app/kinds";
import { trustLines } from "@/lib/app/trust";
import { hostLine } from "@/lib/app/hostLine";
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
  return hostLine(plan.hostMutuals);
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
  const left = Math.max(0, plan.openSpots - plan.taken);
  const full = left <= 0 && plan.status !== "past";
  const [day, time] = formatWhen(plan.startsAt).split(" · ");
  const mine = plan.isHost || plan.joined;
  return (
    <Link
      href={`/app/plan/${plan.id}`}
      className={`group block overflow-hidden rounded-[22px] bg-ink-2 ring-1 ring-line ring-inset transition-transform active:scale-[0.985] hover:ring-lavender/50 ${full && !mine ? "opacity-60" : ""}`}
    >
      {/* the picture: the video's cover if it came from a link, otherwise the kind of plan */}
      <div className="relative h-[168px] overflow-hidden bg-bordeaux">
        {plan.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={plan.thumbnailUrl} alt="" referrerPolicy="no-referrer" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_80%_10%,#9b2a40_0%,#7a1428_45%,#2a0a12_100%)]">
            <KindIcon kind={plan.kind} className="absolute -right-4 -top-4 h-40 w-40 text-bone/10" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent from-35% to-ink/80" />
        <div className="absolute inset-x-3.5 top-3.5 flex items-start justify-between gap-2">
          {plan.occasion ? (
            <span className="mono flex items-center gap-1.5 rounded-full bg-ink/45 px-2.5 py-1 text-[11px] text-bone backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-lavender" aria-hidden="true" />
              {plan.occasion}
            </span>
          ) : (
            <span />
          )}
          {mine ? (
            <span className="display rounded-full bg-lavender px-3 py-1 text-[14px] text-ink">{plan.isHost ? "you're hosting" : "spot saved"}</span>
          ) : null}
        </div>
        <div className="absolute inset-x-4 bottom-3.5 text-bone">
          <span className="display block text-[1.9rem] leading-none [overflow-wrap:anywhere]">{plan.title || plan.place.split(",")[0]}</span>
          <span className="mono mt-1.5 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-bone/90">
            <KindIcon kind={plan.kind} className="h-3.5 w-3.5" />
            {planLabel(plan)}
            {plan.neighborhood ? ` · ${plan.neighborhood}` : ""}
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-3 px-4 pb-4 pt-3.5">
        <div className="flex items-center justify-between gap-3">
          <span className="flex min-w-0 items-center gap-2 text-[13px] text-muted">
            <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border border-dashed border-lavender/60 text-[11px] text-lavender" aria-hidden="true">?</span>
            <span className="truncate">{plan.isHost ? "you're hosting" : hostLine(plan.hostMutuals)}</span>
          </span>
          <SpotDots plan={plan} />
        </div>
        <div className="flex items-end justify-between gap-3 border-t border-line pt-3">
          <div>
            <p className="text-[16px] text-bone">{day}</p>
            <p className="text-[13px] text-muted">{time}</p>
          </div>
          <div className="text-right">
            <p className={`display text-[1.6rem] leading-none ${full ? "text-muted-2" : "text-lavender"}`}>
              {plan.status === "live" ? "now" : plan.status === "past" ? "done" : full ? "full" : left}
            </p>
            <p className="mono mt-1 text-[10px] uppercase tracking-wider text-muted-2">
              {plan.status === "live" ? "happening" : plan.status === "past" ? "it happened" : full ? "next time" : plan.status === "on" ? `${left === 1 ? "spot" : "spots"} open · it's on` : `${left === 1 ? "spot" : "spots"} open`}
            </p>
          </div>
        </div>
        {why ? <p className="mono text-[12px] text-lavender">for you · {why}</p> : null}
        {trust ? (
          <p className="mono flex items-center gap-2 text-[12px] text-lavender-soft">
            <TrustDot />
            {trust.band ?? trust.base}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
