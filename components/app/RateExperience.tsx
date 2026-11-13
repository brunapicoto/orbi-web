"use client";

import { useState, useTransition } from "react";
import { rateMemory } from "@/app/app/actions";
import { Star } from "@/components/app/Rating";

const WORDS = ["", "not for me", "it was ok", "good", "really good", "unforgettable"];

/** Stars for someone who was there. Anonymous, about the experience, never the people. */
export function RateExperience({ memoryId, mine }: { memoryId: string; mine: number | null }) {
  const [value, setValue] = useState(mine ?? 0);
  const [hover, setHover] = useState(0);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();
  const shown = hover || value;

  const pick = (n: number) => {
    const before = value;
    setValue(n);
    setSaved(false);
    setErr("");
    start(async () => {
      const res = await rateMemory(memoryId, n);
      if (res.error) {
        setValue(before);
        setErr(res.error);
      } else setSaved(true);
    });
  };

  return (
    <section aria-labelledby="rate-title" className="flex flex-col gap-3 rounded-3xl bg-ink-2 p-5 ring-1 ring-line ring-inset">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="rate-title" className="mono text-muted-2">{mine ? "your rating" : "how was it?"}</h2>
        <span className="mono text-[12px] text-lavender-soft" aria-live="polite">
          {pending ? "saving…" : saved ? "saved" : shown ? WORDS[shown] : ""}
        </span>
      </div>
      <div className="flex gap-1" role="radiogroup" aria-label="rate this experience, 1 to 5 stars" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} ${n === 1 ? "star" : "stars"}`}
            disabled={pending}
            onMouseEnter={() => setHover(n)}
            onClick={() => pick(n)}
            className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${n <= shown ? "text-lavender" : "text-muted-2 hover:text-lavender-soft"}`}
          >
            <Star filled={n <= shown} className="h-8 w-8" />
          </button>
        ))}
      </div>
      {err ? <p role="alert" className="mono text-lavender">{err}</p> : null}
      <p className="text-[14px] text-muted-2">anonymous. you rate the experience, never the people. you can change it any time.</p>
    </section>
  );
}
