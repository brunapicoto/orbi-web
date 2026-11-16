import Link from "next/link";
import { OrbitDial } from "@/components/OrbitDial";
import { KindIcon } from "@/components/app/KindIcon";
import { JunoMascot } from "@/components/app/JunoMascot";
import { PlanCard } from "@/components/app/PlanCard";
import { KINDS, TIME_ZONE, formatWhen } from "@/lib/app/kinds";
import { rankPlans } from "@/lib/app/rank";
import { requireMe } from "@/lib/app/session";
import type { PlanSignal, PlanView } from "@/lib/app/types";

export const dynamic = "force-dynamic";

export default async function PlansHome({ searchParams }: { searchParams: Promise<{ kind?: string; sort?: string; show?: string }> }) {
  const { store } = await requireMe("/app");
  const { kind, sort, show } = await searchParams;
  const view = show === "open" || show === "going" ? show : "everyone";
  const prefs = await store.prefs();
  const soonest = sort === "soonest";
  const plans = await store.plans();

  const now = plans.filter((p) => p.status === "live");
  const mine = plans.filter((p) => (p.isHost || p.joined) && (p.status === "open" || p.status === "on"));
  const openAll = plans.filter((p) => !p.isHost && !p.joined && (p.status === "open" || p.status === "on") && p.taken < p.openSpots);
  const kindsHere = KINDS.filter((k) => openAll.some((p) => p.kind === k.id));
  const active = kind && kindsHere.some((k) => k.id === kind) ? kind : null;
  const filtered = active ? openAll.filter((p) => p.kind === active) : openAll;
  const past = plans.filter((p) => p.status === "past").reverse();
  // group-level trust signal for upcoming plans (never about one person)
  const upcoming = [...mine, ...filtered];
  const signals = new Map(await Promise.all(upcoming.map(async (p) => [p.id, await store.signal(p.id)] as const)));
  // open plans: ordered for you (unless you asked for soonest first); nothing is hidden
  const ranked = soonest ? filtered.map((plan) => ({ plan, why: null as string | null })) : rankPlans(filtered, prefs, signals);
  const open = ranked.map((r) => r.plan);
  const whys = new Map(ranked.map((r) => [r.plan.id, r.why]));
  const q = (o: Record<string, string | null>) => {
    const sp = new URLSearchParams();
    const k = "kind" in o ? o.kind : active;
    const st = "sort" in o ? o.sort : soonest ? "soonest" : null;
    const sh = "show" in o ? o.show : view === "everyone" ? null : view;
    if (k) sp.set("kind", k);
    if (st) sp.set("sort", st);
    if (sh) sp.set("show", sh);
    const str = sp.toString();
    return str ? `/app?${str}` : "/app";
  };

  const todayNy = new Date().toLocaleDateString("en-CA", { timeZone: TIME_ZONE });
  const tonight = mine.find((p) => new Date(p.startsAt).toLocaleDateString("en-CA", { timeZone: TIME_ZONE }) === todayNy) ?? now.find((p) => p.isHost || p.joined);
  const showOpen = view !== "going";
  const showMine = view !== "open";

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-4">
        <p className="mono text-[12px] uppercase tracking-widest text-muted-2">this week · new york</p>
        <h1 className="display text-[3.4rem]">who&apos;s making plans.</h1>
        <nav aria-label="show" className="-mx-5 flex items-center gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
          <Chip href={q({ show: null })} active={view === "everyone"} label="everyone" />
          <Chip href={q({ show: "open" })} active={view === "open"} label="spots open" />
          <Chip href={q({ show: "going" })} active={view === "going"} label="you're going" />
          <Link href="/app/map" className="mono flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-lavender/60 px-4 text-[13px] text-lavender hover:bg-lavender hover:text-ink">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.7} aria-hidden="true"><path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z" /><circle cx="12" cy="10" r="2.3" /></svg>
            view map
          </Link>
        </nav>
      </header>

      {tonight ? (
        <Link href={`/app/plan/${tonight.id}`} className="flex items-center gap-4 rounded-[20px] bg-bone px-4 py-4 text-ink transition-colors hover:bg-lavender">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-wine text-bone" aria-hidden="true">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.7}><path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z" /><circle cx="12" cy="10" r="2.3" /></svg>
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="mono text-[11px] uppercase tracking-wider text-ink/60">
              {tonight.status === "live" ? "happening now" : `today at ${formatWhen(tonight.startsAt).split(" · ")[1]}`}
            </span>
            <span className="display truncate text-[1.5rem] leading-tight">ready for {(tonight.title || tonight.place).split(",")[0].toLowerCase()}?</span>
          </span>
          <span aria-hidden="true" className="text-[20px]">→</span>
        </Link>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        <Link href="/app/juno" className="flex items-center gap-2 rounded-[18px] bg-ink-2 p-2.5 pr-3 ring-1 ring-line ring-inset hover:ring-lavender/50">
          <JunoMascot className="h-11 w-11 shrink-0" />
          <span className="flex flex-col leading-tight">
            <span className="display text-[1.15rem]">ask juno</span>
            <span className="text-[12px] text-muted">plan for your group</span>
          </span>
        </Link>
        <Link href="/app/lists" className="flex items-center gap-3 rounded-[18px] bg-ink-2 p-2.5 pl-4 pr-3 ring-1 ring-line ring-inset hover:ring-lavender/50">
          <span className="display text-[1.8rem] text-lavender" aria-hidden="true">✦</span>
          <span className="flex flex-col leading-tight">
            <span className="display text-[1.15rem]">your lists</span>
            <span className="text-[12px] text-muted">places worth a plan</span>
          </span>
        </Link>
      </div>

      {showMine ? <Group title="happening now" plans={now} /> : null}
      {showMine ? <Group title="you're going" plans={mine} signals={signals} empty="nothing yet. save a spot below, or post one." /> : null}
      {showOpen && kindsHere.length > 1 ? (
        <nav aria-label="filter plans by type" className="-mx-5 -mb-6 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
          <Chip href={q({ kind: null })} active={!active} label="everything" />
          {kindsHere.map((k) => (
            <Chip key={k.id} href={q({ kind: k.id })} active={active === k.id} label={k.label} kind={k.id} />
          ))}
        </nav>
      ) : null}
      {showOpen && openAll.length > 1 ? (
        <div className="-mb-8 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1 rounded-full border border-line p-1" role="group" aria-label="order plans">
            <Link href={q({ sort: null })} scroll={false} aria-current={!soonest ? "true" : undefined} className={`mono rounded-full px-3 py-2 text-[12px] ${!soonest ? "bg-bone text-ink" : "text-muted-2 hover:text-bone"}`}>
              for you
            </Link>
            <Link href={q({ sort: "soonest" })} scroll={false} aria-current={soonest ? "true" : undefined} className={`mono rounded-full px-3 py-2 text-[12px] ${soonest ? "bg-bone text-ink" : "text-muted-2 hover:text-bone"}`}>
              soonest
            </Link>
          </div>
          {!prefs ? (
            <Link href="/app/preferences" className="mono link-draw text-lavender">
              tell us what you&apos;re into
            </Link>
          ) : (
            <Link href="/app/preferences" className="mono link-draw text-muted-2">
              edit what you&apos;re into
            </Link>
          )}
        </div>
      ) : null}
      {showOpen ? <Group
        title="open to you"
        plans={open}
        signals={signals}
        whys={whys}
        empty={
          <span>
            no open plans from your mutuals right now.{" "}
            <Link href="/app/mutuals" className="link-draw text-lavender">
              invite more mutuals
            </Link>{" "}
            or{" "}
            <Link href="/app/new" className="link-draw text-lavender">
              post one
            </Link>
            .
          </span>
        }
      /> : null}
      {view === "everyone" && past.length ? <Group title="it happened" plans={past} /> : null}
      {view === "everyone" && plans.length ? <p className="display text-center text-[1.3rem] text-muted-2">that&apos;s your week.</p> : null}

      {plans.length === 0 ? (
        <div className="flex flex-col items-center gap-6 py-6 text-center">
          <div className="w-24">
            <OrbitDial phase="plan" interactive={false} />
          </div>
          <p className="max-w-[30ch] text-muted">plans show up here when your mutuals post them. start by inviting a few people.</p>
          <Link href="/app/mutuals" className="mono inline-flex min-h-12 items-center rounded-full bg-bordeaux px-6 text-bone hover:bg-lavender hover:text-ink">
            invite your mutuals
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function Group({ title, plans, empty, signals, whys }: { title: string; plans: PlanView[]; empty?: React.ReactNode; signals?: Map<string, PlanSignal | null>; whys?: Map<string, string | null> }) {
  if (!plans.length && !empty) return null;
  return (
    <section className="flex flex-col gap-4" aria-label={title}>
      <h2 className="mono text-muted-2">{title}</h2>
      {plans.length ? (
        <ul className="flex flex-col gap-3">
          {plans.map((p) => (
            <li key={p.id}>
              <PlanCard plan={p} signal={signals ? signals.get(p.id) ?? null : undefined} why={whys?.get(p.id) ?? null} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[16px] text-muted">{empty}</p>
      )}
    </section>
  );
}

function Chip({ href, active, label, kind }: { href: string; active: boolean; label: string; kind?: string }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "true" : undefined}
      className={`mono flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-[13px] transition-colors ${
        active ? "border-lavender bg-lavender text-ink" : "border-line text-bone hover:border-lavender"
      }`}
    >
      {kind ? <KindIcon kind={kind} className="h-4 w-4" /> : null}
      {label}
    </Link>
  );
}
