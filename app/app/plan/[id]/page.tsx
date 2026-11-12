import Link from "next/link";
import { notFound } from "next/navigation";
import { cancelPlan } from "@/app/app/actions";
import { OrbitDial, type DialPhase } from "@/components/OrbitDial";
import { JoinButton } from "@/components/app/JoinButton";
import { KindIcon } from "@/components/app/KindIcon";
import { PeopleReveal } from "@/components/app/PeopleReveal";
import { OrbitPicks } from "@/components/app/OrbitPicks";
import { PhotoUpload } from "@/components/app/PhotoUpload";
import { SpotDots, TrustDot, planLine, whoLine } from "@/components/app/PlanCard";
import { trustLines } from "@/lib/app/trust";
import { formatWhen, kindLabel } from "@/lib/app/kinds";
import { requireMe } from "@/lib/app/session";

export const dynamic = "force-dynamic";

export default async function PlanPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ posted?: string }> }) {
  const { id } = await params;
  const { posted } = await searchParams;
  const { store } = await requireMe(`/app/plan/${id}`);
  const plan = await store.plan(id);
  if (!plan) notFound();

  const started = plan.status === "live" || plan.status === "past";
  const inPlan = plan.isHost || plan.joined;
  const people = started && inPlan ? await store.people(id) : [];
  const photos = started && inPlan ? await store.photos(id) : [];
  const groupMutuals = started && inPlan ? await store.groupMutuals(id) : 0;
  const orbit = started && inPlan ? await store.orbitState(id) : null;
  const people_n = plan.taken + 1 + plan.bringing;
  const friends = `${plan.bringing} ${plan.bringing === 1 ? "friend" : "friends"}`;
  const brings = plan.bringing ? (plan.isHost ? ` you're bringing ${friends}.` : ` the host is bringing ${friends}.`) : "";
  const trust = started ? null : trustLines(await store.signal(id));
  const full = plan.taken >= plan.openSpots;
  const phase: DialPhase = started ? "reveal" : plan.taken > 0 ? "blind" : "plan";

  return (
    <article className="flex flex-col gap-10">
      <Link href="/app" className="mono link-draw self-start text-muted-2">
        ← plans
      </Link>

      {posted ? (
        <p role="status" className="rounded-2xl bg-bordeaux px-5 py-4 text-[16px] text-bone">
          your plan is out. your mutuals see &ldquo;someone is hosting.&rdquo; you&apos;ll see who&apos;s coming when it starts, same as everyone.
        </p>
      ) : null}

      <header className="flex items-start justify-between gap-6">
        <div className="flex min-w-0 flex-col gap-3">
          <span className="mono flex items-center gap-2 text-lavender">
            <KindIcon kind={plan.kind} className="h-4 w-4" />
            {kindLabel(plan.kind)}
          </span>
          <h1 className="display text-[2.75rem] leading-[0.95]">{plan.place}</h1>
          <p className="mono text-muted">{formatWhen(plan.startsAt)}</p>
        </div>
        <div className="w-20 shrink-0">
          <OrbitDial phase={phase} interactive={false} />
        </div>
      </header>

      {plan.note ? <p className="display text-[1.5rem] leading-snug text-bone">&ldquo;{plan.note}&rdquo;</p> : null}

      <section className="flex flex-col gap-4 rounded-3xl bg-ink-2 p-5 ring-1 ring-line ring-inset" aria-label="the group">
        <div className="flex items-center justify-between gap-4">
          <span className="mono text-muted-2">{whoLine(plan)}</span>
          <SpotDots plan={plan} />
        </div>
        <p className="text-[16px] text-muted">
          {started
            ? `${people_n} people. ${plan.status === "live" ? "the list is open." : "it happened."}`
            : plan.status === "on"
              ? `it's on: ${people_n} people so far, ${planLine(plan)}.${brings} names stay sealed until it starts.`
              : `${people_n} of 3 needed so far, ${planLine(plan)}.${brings} if it doesn't reach 3, it quietly doesn't happen.`}
        </p>
        {trust ? (
          <div className="flex flex-col gap-1.5 border-t border-dashed border-line pt-4">
            <p className="mono flex items-center gap-2 text-lavender-soft">
              <TrustDot />
              {trust.base}
            </p>
            <p className="text-[15px] text-muted">
              {trust.band
                ? `${trust.band}. counted for the whole group, never per person.`
                : "friends in common show up once the group is big enough to keep everyone anonymous."}
            </p>
          </div>
        ) : null}
      </section>

      {!started && !plan.isHost ? <JoinButton planId={plan.id} joined={plan.joined} full={full && !plan.joined} /> : null}

      {!started && plan.isHost ? (
        <form action={cancelPlan.bind(null, plan.id)}>
          <button type="submit" className="mono link-draw text-muted-2">
            cancel this plan
          </button>
        </form>
      ) : null}

      {started && inPlan ? (
        <section className="flex flex-col gap-4" aria-labelledby="who-title">
          <h2 id="who-title" className="mono text-muted-2">
            {plan.status === "live" ? "who's here" : "who was there"}
          </h2>
          <PeopleReveal people={people} animate={plan.status === "live"} extra={plan.bringing} />
          {groupMutuals > 0 ? (
            <div className="flex items-baseline gap-4 rounded-3xl bg-bordeaux px-6 py-5">
              <span className="display text-[3.25rem] leading-none text-lavender">{groupMutuals}</span>
              <span className="text-[16px] text-lavender-soft">
                {groupMutuals === 1 ? "friend" : "friends"} in common between you and this group.
              </span>
            </div>
          ) : null}
        </section>
      ) : null}

      {started && inPlan && orbit && people.length > 1 ? (
        <section className="flex flex-col gap-4" aria-labelledby="orbit-title">
          <h2 id="orbit-title" className="mono text-muted-2">
            keep in orbit
          </h2>
          <OrbitPicks planId={plan.id} people={people.filter((p) => !p.isMe)} picked={orbit.picked} connected={orbit.connected} />
        </section>
      ) : null}

      {started && inPlan ? (
        <section className="flex flex-col gap-4" aria-labelledby="photo-title">
          <h2 id="photo-title" className="mono text-muted-2">
            the group photo
          </h2>
          {photos.length ? (
            <ul className="grid grid-cols-2 gap-2">
              {photos.map((p) => (
                <li key={p.id} className={photos.length === 1 ? "col-span-2" : ""}>
                  {/* signed, short-lived urls: next/image can't cache them */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt={`group photo from ${plan.place}`} className="aspect-[4/3] w-full rounded-2xl object-cover grayscale-[15%]" />
                </li>
              ))}
            </ul>
          ) : null}
          <PhotoUpload planId={plan.id} />
        </section>
      ) : null}

      {plan.status === "past" && inPlan ? (
        <section className="flex flex-col gap-4 rounded-3xl bg-bordeaux p-6">
          <h2 className="display text-[2.25rem] text-lavender">host the next one</h2>
          <p className="text-[16px] text-lavender-soft">good night? open a few spots for the next {kindLabel(plan.kind)}. same mutuals, new faces.</p>
          <Link href={`/app/new?kind=${plan.kind}&again=1`} className="mono inline-flex min-h-12 items-center self-start rounded-full bg-bone px-6 text-bordeaux hover:bg-lavender hover:text-ink">
            post a plan
          </Link>
        </section>
      ) : null}
    </article>
  );
}
