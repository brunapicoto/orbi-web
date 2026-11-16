import Link from "next/link";
import { notFound } from "next/navigation";
import { cancelPlan } from "@/app/app/actions";
import { CheckIn } from "@/components/app/CheckIn";
import { JoinButton } from "@/components/app/JoinButton";
import { KindIcon } from "@/components/app/KindIcon";
import { OrbitPicks } from "@/components/app/OrbitPicks";
import { PeopleReveal } from "@/components/app/PeopleReveal";
import { PhotoUpload } from "@/components/app/PhotoUpload";
import { SpotDots, TrustDot, planLine } from "@/components/app/PlanCard";
import { ShareLink } from "@/components/app/ShareLink";
import { MiniMap } from "@/components/app/map";
import { hostLine } from "@/lib/app/hostLine";
import { formatWhen, planLabel, planNoun } from "@/lib/app/kinds";
import { priceLabel } from "@/lib/app/planText";
import { requireMe } from "@/lib/app/session";
import { trustLines } from "@/lib/app/trust";

export const dynamic = "force-dynamic";

export default async function PlanPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ posted?: string }> }) {
  const { id } = await params;
  const { posted } = await searchParams;
  const { store } = await requireMe(`/app/plan/${id}`);
  const plan = await store.plan(id);
  if (!plan) notFound();

  const started = plan.status === "live" || plan.status === "past";
  const inPlan = plan.isHost || plan.joined;
  const start = new Date(plan.startsAt).getTime();
  // the door opens an hour before; names only after you check in
  const doorOpen = inPlan && (plan.status === "on" || plan.status === "live") && Date.now() >= start - 3600_000 && Date.now() <= start + 6 * 3600_000;
  const revealed = inPlan && plan.meCheckedIn;
  const people = revealed ? await store.people(id) : [];
  const photos = revealed ? await store.photos(id) : [];
  const groupMutuals = revealed ? await store.groupMutuals(id) : 0;
  const orbit = revealed ? await store.orbitState(id) : null;
  const total = plan.taken + 1 + plan.bringing;
  const groupSize = plan.openSpots + 1 + plan.bringing;
  const friends = `${plan.bringing} ${plan.bringing === 1 ? "friend" : "friends"}`;
  const brings = plan.bringing ? (plan.isHost ? ` you're bringing ${friends}.` : ` the host is bringing ${friends}.`) : "";
  const trust = started ? null : trustLines(await store.signal(id));
  const full = plan.taken >= plan.openSpots;
  const [day, time] = formatWhen(plan.startsAt).split(" · ");
  const name = (plan.title || plan.place).split(",")[0];

  return (
    <article className="-mx-5 -mt-6 flex flex-col gap-8">
      {/* hero */}
      <header className="relative h-[300px] overflow-hidden bg-bordeaux">
        {plan.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={plan.thumbnailUrl} alt="" referrerPolicy="no-referrer" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_80%_10%,#9b2a40_0%,#7a1428_45%,#2a0a12_100%)]">
            <KindIcon kind={plan.kind} className="absolute -right-6 -top-6 h-56 w-56 text-bone/10" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-ink/20 via-transparent to-ink/90" />
        <Link href="/app" aria-label="back to plans" className="absolute left-5 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-ink/50 text-bone backdrop-blur-md hover:bg-ink/80">
          ←
        </Link>
        <div className="absolute inset-x-5 bottom-5 flex flex-col gap-2">
          {plan.occasion ? (
            <span className="mono flex w-fit items-center gap-1.5 rounded-full bg-ink/45 px-2.5 py-1 text-[11px] text-bone backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-lavender" aria-hidden="true" />
              {plan.occasion}
            </span>
          ) : null}
          <h1 className="display text-[3rem] text-bone [overflow-wrap:anywhere]">{name}</h1>
          <span className="mono flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-bone/85">
            <KindIcon kind={plan.kind} className="h-3.5 w-3.5" />
            {planLabel(plan)}
            {plan.neighborhood ? ` · ${plan.neighborhood}` : ""}
          </span>
        </div>
      </header>

      <div className="flex flex-col gap-8 px-5">
        {posted ? (
          <p role="status" className="rounded-2xl bg-bone px-5 py-4 text-[16px] text-ink">
            your plan is out. your mutuals see &ldquo;someone is hosting.&rdquo; you&apos;ll see who&apos;s coming when you arrive, same as everyone.
          </p>
        ) : null}

        {/* when · the group */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <span className="mono text-[11px] uppercase tracking-widest text-muted-2">when</span>
            <span className="display text-[1.7rem]">{day}</span>
            <span className="text-[14px] text-muted">{time}</span>
          </div>
          <div className="flex flex-col gap-1 border-l border-line pl-4">
            <span className="mono text-[11px] uppercase tracking-widest text-muted-2">the group</span>
            <span className="display text-[1.7rem] text-lavender">{groupSize} people</span>
            <span className="text-[14px] text-muted">{started ? `${total} went` : full ? "full" : planLine(plan)}</span>
          </div>
        </div>

        {/* place, price, map */}
        <div className="flex flex-col gap-3">
          <p className="text-muted">
            {plan.title ? plan.place : plan.place}
            {priceLabel(plan.priceLevel) ? <span className="mono text-muted-2"> · {priceLabel(plan.priceLevel)}</span> : null}
          </p>
          {plan.costNote ? <p className="text-[15px] text-muted-2">{plan.costNote}</p> : null}
          {plan.lat !== null && plan.lng !== null ? <MiniMap lat={plan.lat} lng={plan.lng} kind={plan.kind} label={plan.place} /> : null}
          {plan.sourceUrl ? (
            <a href={plan.sourceUrl} target="_blank" rel="noopener noreferrer" className="mono link-draw self-start text-[12px] text-lavender-soft">
              the video{plan.sourceAuthor ? ` · ${plan.sourceAuthor}` : ""} ↗
            </a>
          ) : null}
        </div>

        {/* the host: always anonymous */}
        <div className="flex items-center gap-3">
          <span className="display flex h-11 w-11 items-center justify-center rounded-full border border-dashed border-lavender/70 text-[1.2rem] text-lavender" aria-hidden="true">
            ?
          </span>
          <span className="flex flex-col">
            <span className="mono text-[11px] uppercase tracking-widest text-muted-2">hosted by</span>
            <span className="display text-[1.4rem]">{plan.isHost ? "you" : hostLine(plan.hostMutuals).replace(" is hosting", "")}</span>
          </span>
        </div>

        {plan.note ? (
          <p className="display rounded-[20px] bg-ink-2 px-5 py-4 text-[1.35rem] leading-snug ring-1 ring-line ring-inset">&ldquo;{plan.note}&rdquo;</p>
        ) : null}

        {/* the group, before anyone arrives */}
        {!revealed ? (
          <section className="flex flex-col gap-4 rounded-[20px] bg-ink-2 p-5 ring-1 ring-line ring-inset" aria-label="the group">
            <div className="flex items-start gap-3">
              <svg viewBox="0 0 24 24" className="mt-0.5 h-5 w-5 shrink-0 text-lavender" fill="none" stroke="currentColor" strokeWidth={1.7} aria-hidden="true">
                <rect x="5" y="10.5" width="14" height="10" rx="2" />
                <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
              </svg>
              <div className="flex flex-col gap-1">
                <p className="text-bone">you won&apos;t see who else is going.</p>
                <p className="text-[15px] text-muted">
                  not even the host knows. you&apos;ll meet everyone when you get there.
                  {started && inPlan && !plan.meCheckedIn && plan.status === "past" ? " you didn't check in at this one, so the names stay sealed." : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-dashed border-line pt-4">
              <span className="text-[15px] text-muted">
                {plan.status === "on" ? `it's on: ${total} in.` : `${total} of ${plan.minPeople} needed.`}
                {brings}
              </span>
              <SpotDots plan={plan} />
            </div>
            {trust ? (
              <div className="flex flex-col gap-1.5 border-t border-dashed border-line pt-4">
                <p className="mono flex items-center gap-2 text-lavender-soft">
                  <TrustDot />
                  {trust.base}
                </p>
                <p className="text-[15px] text-muted">
                  {trust.band ? `${trust.band}. counted for the whole group, never per person.` : "friends in common show up once the group is big enough to keep everyone anonymous."}
                </p>
              </div>
            ) : null}
          </section>
        ) : null}

        {/* at the door */}
        {doorOpen && !plan.meCheckedIn ? <CheckIn planId={plan.id} place={plan.place} arrived={plan.arrived} total={total} /> : null}

        {/* saving a spot */}
        {!started && !inPlan ? (
          full ? (
            <p className="mono rounded-full border border-line px-6 py-4 text-center text-muted">this plan is full · next time</p>
          ) : (
            <Link href={`/app/plan/${plan.id}/save`} className="mono flex min-h-14 items-center justify-center gap-2 rounded-full bg-bone px-6 text-center text-[15px] text-ink hover:bg-lavender">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                <rect x="5" y="10.5" width="14" height="10" rx="2" />
                <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
              </svg>
              save a spot without seeing who&apos;s coming
            </Link>
          )
        ) : null}
        {!started && plan.joined && !doorOpen ? <JoinButton planId={plan.id} joined full={false} /> : null}

        {!started && plan.isHost && plan.shareSlug ? <ShareLink slug={plan.shareSlug} isHost /> : null}
        {!started && plan.isHost && !doorOpen ? (
          <form action={cancelPlan.bind(null, plan.id)}>
            <button type="submit" className="mono link-draw text-muted-2">
              cancel this plan
            </button>
          </form>
        ) : null}

        {/* the reveal */}
        {revealed ? (
          <section className="flex flex-col gap-4" aria-labelledby="who-title">
            <p className="mono text-center text-[11px] uppercase tracking-widest text-muted-2">
              {plan.status === "past" ? `${day} · ${name.toLowerCase()}` : `tonight · ${name.toLowerCase()}`}
            </p>
            <h2 id="who-title" className="display text-center text-[2.6rem]">
              here&apos;s who showed up.
            </h2>
            <PeopleReveal people={people} animate={plan.status === "live"} extra={plan.bringing} />
            {groupMutuals > 0 ? (
              <div className="flex items-baseline gap-4 rounded-3xl bg-ink-2 px-6 py-5 ring-1 ring-line ring-inset">
                <span className="display text-[3.25rem] leading-none text-lavender">{groupMutuals}</span>
                <span className="text-[16px] text-lavender-soft">{groupMutuals === 1 ? "friend" : "friends"} in common between you and this group.</span>
              </div>
            ) : null}
          </section>
        ) : null}

        {revealed ? (
          <section className="flex flex-col items-center gap-4 rounded-[24px] bg-ink-2 p-6 text-center ring-1 ring-line ring-inset" aria-labelledby="photo-title">
            <h2 id="photo-title" className="display text-[1.8rem]">
              how was it?
            </h2>
            <p className="text-[15px] text-muted">add a photo from the group. no likes, no comments, just for the people who were there.</p>
            {photos.length ? (
              <ul className="-mx-6 flex w-[calc(100%+3rem)] snap-x snap-mandatory gap-3 overflow-x-auto px-6 [scrollbar-width:none]">
                {photos.map((p) => (
                  <li key={p.id} className={`shrink-0 snap-start ${photos.length === 1 ? "w-full" : "w-[80%]"}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.url} alt={`group photo from ${plan.place}`} className="aspect-square w-full rounded-2xl object-cover" />
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="w-full">
              <PhotoUpload planId={plan.id} />
            </div>
          </section>
        ) : null}

        {revealed && orbit && people.length > 1 ? (
          <section className="flex flex-col gap-4" aria-labelledby="orbit-title">
            <p className="mono text-[11px] uppercase tracking-widest text-muted-2">the morning after</p>
            <h2 id="orbit-title" className="display text-[2.4rem]">
              the people you actually met.
            </h2>
            <p className="text-[15px] text-muted">
              choose who you want to keep in your orbit. if they pick you back, you&apos;re connected. if they don&apos;t, nothing happens: not a notification, not a trace.
            </p>
            <OrbitPicks planId={plan.id} people={people.filter((p) => !p.isMe && p.arrived)} picked={orbit.picked} connected={orbit.connected} />
          </section>
        ) : null}

        {plan.status === "past" && inPlan ? (
          <section className="flex flex-col gap-4 rounded-3xl bg-ink-2 p-6 ring-1 ring-line ring-inset">
            <h2 className="display text-[2.25rem] text-lavender">host the next one</h2>
            <p className="text-[16px] text-lavender-soft">good one? open a few spots for the next {planNoun(plan)}. same mutuals, new faces.</p>
            <Link href={`/app/new?kind=${plan.kind}&again=1`} className="mono inline-flex min-h-12 items-center self-start rounded-full bg-bone px-6 text-ink hover:bg-lavender">
              post a plan
            </Link>
          </section>
        ) : null}
      </div>
    </article>
  );
}
