"use client";

import { useActionState, useState } from "react";
import { planWithJuno, type JunoState } from "@/app/app/actions";
import { JunoMascot } from "@/components/app/JunoMascot";
import { NewPlanForm } from "@/components/app/NewPlanForm";
import { formatWhen } from "@/lib/app/kinds";

const VIBES = ["chill", "active", "food", "culture", "celebrate", "outdoors", "late night"];
const chip = "mono flex min-h-11 shrink-0 items-center rounded-full border border-line px-4 text-[13px] text-bone peer-checked:border-lavender peer-checked:bg-lavender peer-checked:text-ink peer-focus-visible:ring-2 peer-focus-visible:ring-lavender";
const field = "w-full rounded-2xl border border-line bg-ink-2 px-4 py-3.5 text-[16px] text-bone placeholder:text-muted-2 outline-none focus-visible:border-lavender focus-visible:ring-2 focus-visible:ring-lavender";

/** Juno: group, budget, neighborhood, the kind of day or night. One plan back, ready to post. */
export function JunoPlanner() {
  const [state, action, pending] = useActionState<JunoState, FormData>(planWithJuno, {});
  const [size, setSize] = useState(4);
  const [budget, setBudget] = useState("$$");
  const [when, setWhen] = useState<"day" | "night">("night");
  const [vibe, setVibe] = useState("");
  const [hood, setHood] = useState("");
  const [extra, setExtra] = useState("");
  const [posting, setPosting] = useState(false);
  const pick = state.pick;

  if (pick && posting) {
    return (
      <div className="flex flex-col gap-6">
        <button type="button" onClick={() => setPosting(false)} className="mono link-draw self-start text-muted-2">← back to juno</button>
        <NewPlanForm draft={pick} initialNote={pick.note} initialOccasion={pick.occasion ?? ""} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-end gap-4">
        <JunoMascot className="h-28 w-28 shrink-0" wave={!pending} />
        <div className="relative mb-3 rounded-[20px] rounded-bl-md bg-bone px-4 py-3 text-ink">
          <p className="display text-[1.35rem] leading-tight">
            {pending ? "looking at your lists…" : pick ? "here's one for you." : "hi, i'm juno. what's the vibe?"}
          </p>
        </div>
      </div>

      {pick ? (
        <section aria-label="juno's plan" className="flex flex-col gap-4 rounded-[24px] bg-ink-2 p-6 ring-1 ring-line ring-inset">
          <p className="mono text-[11px] uppercase tracking-widest text-muted-2">{pick.fromYourLists ? "from your lists" : "a suggestion"}{pick.occasion ? ` · ${pick.occasion}` : ""}</p>
          <h2 className="display text-[2.2rem]">{pick.title}</h2>
          <p className="text-muted">
            {pick.place || "pick the spot"}
            {pick.neighborhood ? <span className="text-muted-2"> · {pick.neighborhood}</span> : null}
          </p>
          <p className="mono text-[13px] text-lavender">{formatWhen(new Date(pick.startsAt).toISOString())}</p>
          <p className="text-[15px] text-bone">{pick.why}</p>
          <div className="flex flex-wrap gap-2 pt-2">
            <button type="button" onClick={() => setPosting(true)} className="mono min-h-12 rounded-full bg-bone px-6 text-[14px] text-ink hover:bg-lavender">make it a plan</button>
            <button type="submit" form="juno-form" disabled={pending} className="mono min-h-12 rounded-full border border-line px-6 text-[14px] text-bone hover:border-lavender disabled:opacity-60">
              {pending ? "…" : "another idea"}
            </button>
          </div>
        </section>
      ) : null}

      <form id="juno-form" action={action} className="flex flex-col gap-6">
        <fieldset className="flex flex-col gap-3">
          <legend className="mono mb-2 text-muted-2">how many of you</legend>
          <div className="flex items-center gap-3">
            <button type="button" aria-label="fewer" onClick={() => setSize(Math.max(3, size - 1))} className="flex h-12 w-12 items-center justify-center rounded-full border border-line text-[22px] hover:border-lavender">−</button>
            <span className="display w-12 text-center text-[2.4rem]" aria-live="polite">{size}</span>
            <button type="button" aria-label="more" onClick={() => setSize(Math.min(12, size + 1))} className="flex h-12 w-12 items-center justify-center rounded-full border border-line text-[22px] hover:border-lavender">+</button>
            <input type="hidden" name="groupSize" value={size} />
          </div>
        </fieldset>
        <fieldset className="flex flex-col gap-3">
          <legend className="mono mb-2 text-muted-2">budget</legend>
          <div className="flex flex-wrap gap-2">
            {["free", "$", "$$", "$$$"].map((b) => (
              <label key={b} className="cursor-pointer">
                <input type="radio" name="budget" value={b} checked={budget === b} onChange={() => setBudget(b)} className="peer sr-only" />
                <span className={`${chip} min-w-14 justify-center`}>{b}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="flex flex-col gap-3">
          <legend className="mono mb-2 text-muted-2">a day or a night?</legend>
          <div className="flex gap-2">
            {(["day", "night"] as const).map((w) => (
              <label key={w} className="cursor-pointer">
                <input type="radio" name="when" value={w} checked={when === w} onChange={() => setWhen(w)} className="peer sr-only" />
                <span className={chip}>{w}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="flex flex-col gap-3">
          <legend className="mono mb-2 text-muted-2">the vibe</legend>
          <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
            {VIBES.map((v) => (
              <label key={v} className="shrink-0 cursor-pointer">
                <input type="radio" name="vibe" value={v} checked={vibe === v} onChange={() => setVibe(v)} onClick={() => vibe === v && setVibe("")} className="peer sr-only" />
                <span className={chip}>{v}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <label className="flex flex-col gap-2">
          <span className="mono text-muted-2">neighborhood</span>
          <input name="neighborhood" value={hood} onChange={(e) => setHood(e.target.value)} maxLength={40} placeholder="anywhere, or: williamsburg" className={field} />
        </label>
        <label className="flex flex-col gap-2">
          <span className="mono text-muted-2">anything else? (optional)</span>
          <input name="extra" value={extra} onChange={(e) => setExtra(e.target.value)} maxLength={200} placeholder="someone's birthday, no meat, near the L…" className={field} />
        </label>
        {state.error ? <p role="alert" className="mono text-lavender">{state.error}</p> : null}
        {!pick ? (
          <button type="submit" disabled={pending} className="mono min-h-14 rounded-full bg-bone px-8 text-[15px] text-ink hover:bg-lavender disabled:opacity-60">
            {pending ? "juno is thinking…" : "plan it, juno"}
          </button>
        ) : null}
        <p className="text-[13px] text-muted-2">juno uses your lists and the places that are popular in your network. it never sees who went, and it never plans around specific people.</p>
      </form>
    </div>
  );
}
