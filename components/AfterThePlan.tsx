import { Reveal } from "@/components/Reveal";
import { DinnerArt, RunArt } from "@/components/SceneArt";

const POINTS = [
  {
    t: "a memory, not a post",
    b: "photos from the group, saved where the plan happened. tag who was there: they accept, accept with their face blurred, or decline.",
  },
  {
    t: "seen by your extended network",
    b: "your network and the networks of everyone tagged can see it. that's how you find out what people one step away are doing. no likes, no comments, no follower counts.",
  },
  {
    t: "rated by the people who were there",
    b: "only they can rate it, 1 to 5, anonymously. a score shows once 3 of them have rated. you rate the experience, never the people.",
  },
];

// an illustration of the discovery view: example place, example scores
const EXAMPLE = [
  { name: "birthday dinner", when: "oct 28", score: "4.9" },
  { name: "dinner with friends", when: "nov 10", score: "4.8" },
  { name: "saturday dinner", when: "sep 14", score: "4.3" },
];

function StarIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z" fill="currentColor" />
    </svg>
  );
}

/** Website section: what happens after a plan. Memories, and anonymous ratings of experiences. */
export function AfterThePlan() {
  return (
    <section id="memories" aria-labelledby="after-title" className="gutter border-t border-line py-24 md:py-36">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-16">
        <div className="flex max-w-3xl flex-col gap-5">
          <p className="mono text-muted-2">after the plan</p>
          <Reveal>
            <h2 id="after-title" className="display text-[clamp(2.75rem,7vw,5.5rem)]">
              every plan becomes a memory. <span className="text-lavender">the best ones get found.</span>
            </h2>
          </Reveal>
          <p className="max-w-[46ch] text-muted">
            stars from strangers tell you little. people one step from you, who were actually there, tell you what&apos;s worth doing. for a pasta place, a run club or a ski trip.
          </p>
        </div>

        <ul className="grid gap-px overflow-hidden rounded-3xl bg-line ring-1 ring-line md:grid-cols-3">
          {POINTS.map((p, i) => (
            <Reveal as="li" key={p.t} delay={i * 0.08} className="flex flex-col gap-3 bg-ink-2 p-7 md:p-8">
              <span className="mono text-lavender">0{i + 1}</span>
              <h3 className="display text-[clamp(1.6rem,2.6vw,2.1rem)] leading-tight">{p.t}</h3>
              <p className="text-muted">{p.b}</p>
            </Reveal>
          ))}
        </ul>

        <div className="grid items-start gap-8 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-14">
          {/* a memory */}
          <div className="flex flex-col gap-4">
            <p className="mono text-muted-2">a memory</p>
            <article className="overflow-hidden rounded-3xl bg-ink-2 ring-1 ring-line">
              <div className="relative aspect-square bg-bordeaux p-10">
                <DinnerArt />
                <span className="mono absolute left-4 top-4 rounded-full bg-ink/70 px-3 py-1 text-[11px] text-lavender-soft">1/4</span>
              </div>
              <div className="flex flex-col gap-2 p-5">
                <span className="mono text-lavender-soft">thu · nov 10</span>
                <span className="display text-[1.9rem] leading-tight">via carota</span>
                <span className="mono flex items-center gap-1.5 text-lavender">
                  <StarIcon className="h-3.5 w-3.5" />
                  <span className="text-bone">4.8</span>/5 · 4 ratings
                </span>
                <span className="mono text-muted-2">from your network · with 3 people</span>
              </div>
            </article>
          </div>

          {/* the discovery view */}
          <div className="flex flex-col gap-4">
            <p className="mono text-muted-2">look up a place or an activity</p>
            <div className="flex flex-col gap-5 rounded-3xl bg-ink-2 p-6 ring-1 ring-line md:p-8">
              <span className="mono text-lavender">in your network</span>
              <span className="display text-[2.5rem] leading-[0.95]">via carota</span>
              <p className="flex items-end gap-3">
                <span className="display text-[4.5rem] leading-[0.8] text-lavender">4.7</span>
                <span className="mono flex items-center gap-1 pb-1 text-muted">
                  <StarIcon className="h-4 w-4 text-lavender" />
                  /5
                </span>
              </p>
              <p className="mono text-muted-2">9 ratings · 3 experiences</p>
              <ul className="flex flex-col divide-y divide-line border-t border-line">
                {EXAMPLE.map((e) => (
                  <li key={e.name} className="flex items-center justify-between gap-4 py-3.5">
                    <span className="flex flex-col">
                      <span className="text-bone">{e.name}</span>
                      <span className="mono text-[12px] text-muted-2">{e.when}</span>
                    </span>
                    <span className="mono flex items-center gap-1.5 text-lavender">
                      <StarIcon className="h-3.5 w-3.5" />
                      <span className="text-bone">{e.score}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <div className="flex items-center gap-4 rounded-2xl border border-line p-4">
                <span className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-bordeaux p-2">
                  <RunArt />
                </span>
                <span className="flex flex-col gap-1">
                  <span className="text-bone">running</span>
                  <span className="mono text-[12px] text-muted-2">works for activities too: every run in your network, one score</span>
                </span>
              </div>
              <p className="text-[14px] text-muted-2">example. every rating counts once, and nothing shows until 3 people who were there have rated.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
