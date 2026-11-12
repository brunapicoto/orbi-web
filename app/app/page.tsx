import Link from "next/link";
import { OrbitDial } from "@/components/OrbitDial";
import { PlanCard } from "@/components/app/PlanCard";
import { requireMe } from "@/lib/app/session";
import type { PlanView } from "@/lib/app/types";

export const dynamic = "force-dynamic";

export default async function PlansHome() {
  const { store, me } = await requireMe("/app");
  const plans = await store.plans();

  const now = plans.filter((p) => p.status === "live");
  const mine = plans.filter((p) => (p.isHost || p.joined) && (p.status === "open" || p.status === "on"));
  const open = plans.filter((p) => !p.isHost && !p.joined && (p.status === "open" || p.status === "on") && p.taken < p.openSpots);
  const past = plans.filter((p) => p.status === "past").reverse();

  return (
    <div className="flex flex-col gap-12">
      <header className="flex flex-col gap-2">
        <p className="mono text-muted-2">hi {me.firstName.toLowerCase()}</p>
        <h1 className="display text-[3rem]">what&apos;s the plan?</h1>
      </header>

      <Group title="happening now" plans={now} />
      <Group title="you're going" plans={mine} empty="nothing yet. join a plan below, or post one." />
      <Group
        title="open to you"
        plans={open}
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

function Group({ title, plans, empty }: { title: string; plans: PlanView[]; empty?: React.ReactNode }) {
  if (!plans.length && !empty) return null;
  return (
    <section className="flex flex-col gap-4" aria-label={title}>
      <h2 className="mono text-muted-2">{title}</h2>
      {plans.length ? (
        <ul className="flex flex-col gap-3">
          {plans.map((p) => (
            <li key={p.id}>
              <PlanCard plan={p} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[16px] text-muted">{empty}</p>
      )}
    </section>
  );
}
