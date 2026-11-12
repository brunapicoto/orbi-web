import Link from "next/link";
import { OrbitDial } from "@/components/OrbitDial";
import { KindIcon } from "@/components/app/KindIcon";
import { PlanCard } from "@/components/app/PlanCard";
import { ViewToggle } from "@/components/app/ViewToggle";
import { KINDS } from "@/lib/app/kinds";
import { rankPlans } from "@/lib/app/rank";
import { requireMe } from "@/lib/app/session";
import type { PlanSignal, PlanView } from "@/lib/app/types";

export const dynamic = "force-dynamic";

export default async function PlansHome({ searchParams }: { searchParams: Promise<{ kind?: string; sort?: string }> }) {
  const { store, me } = await requireMe("/app");
  const { kind, sort } = await searchParams;
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
    if (k) sp.set("kind", k);
    if (st) sp.set("sort", st);
    const str = sp.toString();
    return str ? `/app?${str}` : "/app";
  };

  return (
    <div className="flex flex-col gap-12">
      <header className="flex flex-col gap-2">
        <p className="mono text-muted-2">hi {me.firstName.toLowerCase()}</p>
        <h1 className="display text-[3rem]">what&apos;s the plan?</h1>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[16px] text-muted">everyone here is from your network.</p>
          <ViewToggle current="list" />
        </div>
      </header>

      <Group title="happening now" plans={now} />
      <Group title="you're going" plans={mine} signals={signals} empty="nothing yet. join a plan below, or post one." />
      {kindsHere.length > 1 ? (
        <nav aria-label="filter plans by type" className="-mx-5 -mb-6 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
          <Chip href={q({ kind: null })} active={!active} label="everything" />
          {kindsHere.map((k) => (
            <Chip key={k.id} href={q({ kind: k.id })} active={active === k.id} label={k.label} kind={k.id} />
          ))}
        </nav>
      ) : null}
      {openAll.length > 1 ? (
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
      <Group
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
      />
      {past.length ? <Group title="it happened" plans={past} /> : null}

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
