import { MapPreview } from "@/components/MapPreview";
import { Reveal } from "@/components/Reveal";

const FG = "#F4F1F1";
const RING = "rgba(244,241,241,0.28)";

const STEPS = [
  {
    n: "01",
    text: "paste a tiktok or reel you want to try.",
    art: (
      <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden="true">
        <rect x="38" y="10" width="44" height="80" rx="9" fill="none" stroke={FG} strokeWidth="2" />
        <path d="M54 38v22l18-11z" fill={FG} />
        <rect x="14" y="94" width="92" height="18" rx="9" fill="none" stroke={FG} strokeWidth="1.6" />
        <path d="M24 103h40" stroke={RING} strokeWidth="3" strokeLinecap="round" />
        <circle cx="94" cy="103" r="4" fill={FG} />
      </svg>
    ),
  },
  {
    n: "02",
    text: "orbi fills in the place, price and a day. you set the minimum.",
    art: (
      <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden="true">
        <rect x="16" y="14" width="88" height="92" rx="10" fill="none" stroke={FG} strokeWidth="2" />
        <path d="M60 30c-9 0-14 6-14 13 0 9 14 21 14 21s14-12 14-21c0-7-5-13-14-13z" fill={FG} />
        <circle cx="60" cy="43" r="4" fill="#7A1428" />
        <path d="M30 78h40M30 90h24" stroke={RING} strokeWidth="3" strokeLinecap="round" />
        <text x="80" y="94" fill={FG} fontSize="13" style={{ fontFamily: "var(--font-mono), monospace" }}>$$</text>
      </svg>
    ),
  },
  {
    n: "03",
    text: "share the link with your mutuals. it's confirmed when enough friends say “i'm in”.",
    art: (
      <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden="true">
        <circle cx="60" cy="56" r="40" fill="none" stroke={RING} strokeWidth="1" strokeDasharray="2 4" />
        <circle cx="60" cy="56" r="14" fill={FG} />
        <circle cx="60" cy="18" r="7" fill={FG} />
        <circle cx="93" cy="74" r="7" fill={FG} />
        <circle cx="27" cy="74" r="7" fill="none" stroke={FG} strokeWidth="1.6" strokeDasharray="2 2" />
        <path d="M44 104l10 8 22-20" fill="none" stroke={FG} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

/** Website section: turn a video you saved into a real plan. */
export function FromALink() {
  return (
    <section id="from-a-link" aria-labelledby="link-title" className="gutter bg-bordeaux py-24 md:py-36">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-16">
        <div className="flex max-w-3xl flex-col gap-5">
          <p className="mono text-lavender-soft">from a link</p>
          <Reveal>
            <h2 id="link-title" className="display text-[clamp(2.75rem,7vw,5.5rem)] text-bone">
              saw it on tiktok? <span className="text-lavender">make it a plan.</span>
            </h2>
          </Reveal>
          <p className="max-w-[44ch] text-lavender-soft">
            paste the link. orbi turns it into a plan that only happens when enough people are in.
          </p>
        </div>

        <ol className="grid gap-5 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal as="li" key={s.n} delay={i * 0.08} className="flex flex-col gap-5 rounded-3xl bg-ink p-6 md:p-7">
              <div className="h-24 w-24">{s.art}</div>
              <p className="mono text-lavender">{s.n}</p>
              <p className="text-bone">{s.text}</p>
            </Reveal>
          ))}
        </ol>

        <div className="grid items-center gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] md:gap-14">
          {/* an example plan, made from a link */}
          <div className="flex flex-col gap-4">
            <p className="mono text-lavender-soft">example</p>
            <article className="overflow-hidden rounded-3xl bg-ink ring-1 ring-line">
              <div className="relative flex aspect-[16/9] items-end bg-ink-2 p-5">
                <svg viewBox="0 0 200 110" className="absolute inset-0 h-full w-full" aria-hidden="true">
                  <ellipse cx="100" cy="70" rx="56" ry="16" fill="none" stroke={FG} strokeWidth="1.6" />
                  <path d="M52 66c10-26 86-26 96 0" fill={FG} opacity="0.9" />
                  <path d="M70 52c8-6 16 6 24 0s16 6 24 0" fill="none" stroke="#0E0C0D" strokeWidth="2" strokeLinecap="round" />
                  <path d="M150 20l-22 40M160 26l-24 38" stroke={FG} strokeWidth="2" strokeLinecap="round" />
                </svg>
                <span className="mono relative rounded-full bg-ink/80 px-3 py-1 text-[11px] text-lavender-soft">from a tiktok · @pastagirl.nyc</span>
              </div>
              <div className="flex flex-col gap-3 p-5">
                <span className="mono text-lavender">dinner · $$</span>
                <span className="display text-[1.9rem] leading-tight text-bone">pasta bar in the west village</span>
                <span className="mono text-muted">thursday · 8pm</span>
                <div className="flex items-center justify-between gap-3 border-t border-dashed border-line pt-3">
                  <span className="flex items-center" aria-hidden="true">
                    {[0, 1, 2, 3].map((i) => (
                      <span key={i} className={`-mr-1.5 h-[18px] w-[18px] rounded-full border-2 border-ink ${i < 3 ? "bg-muted-2" : "border-dashed !border-lavender/70"}`} />
                    ))}
                  </span>
                  <span className="mono text-lavender">3 of 4 in · 1 more to confirm</span>
                </div>
              </div>
            </article>
          </div>
          <div className="flex flex-col gap-4">
            <p className="mono text-lavender-soft">your plans, on a map</p>
            <MapPreview />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
          <a
            href="/app/new/link"
            className="mono inline-flex min-h-14 items-center rounded-full bg-bone px-8 text-[14px] text-bordeaux transition-colors hover:bg-lavender hover:text-ink"
          >
            try it
          </a>
          <p className="mono text-lavender-soft">no app download needed. small groups, real plans.</p>
        </div>
      </div>
    </section>
  );
}
