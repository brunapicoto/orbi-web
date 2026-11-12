import Link from "next/link";
import { OrbitDial } from "@/components/OrbitDial";
import { KindIcon } from "@/components/app/KindIcon";
import { PlanCard } from "@/components/app/PlanCard";
import { KINDS } from "@/lib/app/kinds";
import { requireMe } from "@/lib/app/session";
import type { PlanSignal, PlanView } from "@/lib/app/types";

export const dynamic = "force-dynamic";

export default async function PlansHome({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const { store, me } = await requireMe("/app");
  const { kind } = await searchParams;
  const plans = await store.plans();

  const now = plans.filter((p) => p.status === "live");
  const mine = plans.filter((p) => (p.isHost || p.joined) && (p.status === "open" || p.status === "on"));
  const openAll = plans.filter((p) => !p.isHost && !p.joined && (p.status === "open" || p.status === "on") && p.taken < p.openSpots);
  const kindsHere = KINDS.filter((k) => openAll.some((p) => p.kind === k.id));
  const active = kind && kindsHere.some((k) => k.id === kind) ? kind : null;
  const open = active ? openAll.filter((p) => p.kind === active) : openAll;
  const past = plans.filter((p) => p.status === "past").reverse();
  // group-level trust signal for upcoming plans (never about one person)
  const upcoming = [...mine, ...open];
  const signals = new Map(await Promise.all(upcoming.map(async (p) => [p.id, await store.signal(p.id)] as const)));

  return (
    <div className="flex flex-col gap-12">
      <header className="flex flex-col gap-2">
        <p className="mono text-muted-2">hi {me.firstName.toLowerCase()}</p>
        <h1 className="display text-[3rem]">what&apos;s the plan?</h1>
        <p className="text-[16px] text-muted">everyone here is from your network.</p>
      </header>

      <Group title="happening now" plans={now} />
      <Group title="you're going" plans={mine} signals={signals} empty="nothing yet. join a plan below, or post one." />
      {kindsHere.length > 1 ? (
        <nav aria-label="filter plans by type" className="-mx-5 -mb-6 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
          <Chip href="/app" active={!active} label="everything" />
          {kindsHere.map((k) => (
            <Chip key={k.id} href={`/app?kind=${k.id}`} active={active === k.id} label={k.label} kind={k.id} />
          ))}
        </nav>
      ) : null}
      <Group
        title="open to you"
        plans={open}
        signals={signals}
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

function Group({ title, plans, empty, signals }: { title: string; plans: PlanView[]; empty?: React.ReactNode; signals?: Map<string, PlanSignal | null> }) {
  if (!plans.length && !empty) return null;
  return (
    <section className="flex flex-col gap-4" aria-label={title}>
      <h2 className="mono text-muted-2">{title}</h2>
      {plans.length ? (
        <ul className="flex flex-col gap-3">
          {plans.map((p) => (
            <li key={p.id}>
              <PlanCard plan={p} signal={signals ? signals.get(p.id) ?? null : undefined} />
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
