import { JunoMascot } from "@/components/app/JunoMascot";
import { Reveal } from "@/components/Reveal";

const ASK = ["small", "$$", "night", "food", "williamsburg"];

const POINTS = [
  { t: "tell it the vibe", b: "something small, medium or big. the budget, the neighborhood, a day or a night. that's it." },
  { t: "it uses your lists", b: "save coffee shops, bars, restaurants, parks and hidden gems, or bring them over from tiktok, instagram or your notes. only you see them." },
  { t: "and what your network loves", b: "places that are popular with people one step from you, with the scores from people who were there. never who went." },
];

/** Website section: Juno, the little astronaut planner. */
export function MeetJuno() {
  return (
    <section id="juno" aria-labelledby="juno-title" className="gutter border-t border-line py-24 md:py-36">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-14 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-20">
        <div className="flex flex-col gap-6">
          <p className="mono text-muted-2">meet juno</p>
          <Reveal>
            <h2 id="juno-title" className="display text-[clamp(2.75rem,7vw,5.5rem)]">
              nobody can decide? <span className="text-lavender">ask juno.</span>
            </h2>
          </Reveal>
          <p className="max-w-[46ch] text-muted">
            a little astronaut planner, named after the nasa probe orbiting jupiter. it keeps your plans in orbit, so your friends never drift too far.
          </p>
          <ul className="flex flex-col gap-5 border-t border-line pt-6">
            {POINTS.map((p, i) => (
              <Reveal as="li" key={p.t} delay={i * 0.08} className="flex gap-4">
                <span className="mono pt-1 text-lavender">0{i + 1}</span>
                <span className="flex flex-col gap-1">
                  <span className="display text-[1.5rem] leading-tight">{p.t}</span>
                  <span className="text-muted">{p.b}</span>
                </span>
              </Reveal>
            ))}
          </ul>
        </div>

        {/* an example conversation */}
        <div className="flex flex-col gap-5 rounded-[32px] bg-bordeaux p-6 md:p-8">
          <div className="flex items-end gap-4">
            <JunoMascot className="h-32 w-32 shrink-0 md:h-40 md:w-40" wave />
            <p className="mb-4 rounded-[20px] rounded-bl-md bg-bone px-4 py-3 font-[family-name:var(--font-serif)] text-[1.4rem] italic leading-tight text-ink">
              hi, i&apos;m juno. what&apos;s the vibe?
            </p>
          </div>
          <div className="flex flex-wrap justify-end gap-2" aria-label="what you tell juno">
            {ASK.map((a) => (
              <span key={a} className="mono rounded-full bg-lavender px-3.5 py-1.5 text-[13px] text-ink">{a}</span>
            ))}
          </div>
          <article className="flex flex-col gap-3 rounded-[24px] bg-ink p-5">
            <span className="mono text-[11px] uppercase tracking-widest text-muted-2">from your lists · a quiet night</span>
            <span className="display text-[2rem] leading-none">le crocodile</span>
            <span className="text-muted">williamsburg · $$$ · thu 7pm</span>
            <span className="text-[15px] text-bone">it&apos;s on your list, it&apos;s loved in your network, and it fits a slow, small dinner.</span>
            <span className="mono mt-1 self-start rounded-full bg-bone px-4 py-2 text-[13px] text-ink">make it a plan</span>
          </article>
          <p className="mono text-[12px] text-lavender-soft">example. juno suggests experiences, never people.</p>
        </div>
      </div>
    </section>
  );
}
