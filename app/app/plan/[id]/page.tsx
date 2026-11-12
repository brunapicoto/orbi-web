import Link from "next/link";
import { notFound } from "next/navigation";
import { cancelPlan } from "@/app/app/actions";
import { OrbitDial, type DialPhase } from "@/components/OrbitDial";
import { JoinButton } from "@/components/app/JoinButton";
import { KindIcon } from "@/components/app/KindIcon";
import { PeopleReveal } from "@/components/app/PeopleReveal";
import { PhotoUpload } from "@/components/app/PhotoUpload";
import { SpotDots, planLine, whoLine } from "@/components/app/PlanCard";
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
            ? `${plan.taken + 1} people. ${plan.status === "live" ? "the list is open." : "it happened."}`
            : plan.status === "on"
              ? `it's on: ${plan.taken + 1} people so far, ${planLine(plan)}. names stay sealed until it starts.`
              : `${plan.taken + 1} of 3 needed so far, ${planLine(plan)}. if it doesn't reach 3, it quietly doesn't happen.`}
        </p>
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
          <PeopleReveal people={people} animate={plan.status === "live"} />
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
