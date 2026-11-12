"use client";

import Link from "next/link";
import { useState } from "react";
import { OrbitDial, type DialPhase } from "@/components/OrbitDial";
import { NameForm } from "@/components/app/Forms";

const STEPS: { phase: DialPhase; kicker: string; title: string; body: string }[] = [
  {
    phase: "full",
    kicker: "01 / 03",
    title: "open a spot, save a spot.",
    body: "post a plan with open spots: a dinner, a run, the sauna. only your mutuals see it, and nobody sees who else said yes. not even the host.",
  },
  {
    phase: "blind",
    kicker: "02 / 03",
    title: "no browsing. no rating. no dms.",
    body: "no profiles to scroll, no photos to score, no 1:1 chat before the plan. you meet everyone in the room, then decide who stays in your orbit.",
  },
  {
    phase: "reveal",
    kicker: "03 / 03",
    title: "only your orbit.",
    body: "always groups of 3 or more. only people one degree from you. if a plan doesn't reach 3, it quietly doesn't happen and nobody gets a no.",
  },
];

/** Opening screen, three onboarding cards, then your first name (or back to plans on a replay). */
export function WelcomeFlow({ next, replay }: { next: string; replay: boolean }) {
  const [step, setStep] = useState(-1);
  const last = STEPS.length;

  if (step === -1) {
    return (
      <div className="-mx-5 -mt-6 flex min-h-[calc(100dvh-24px)] flex-col justify-between bg-bordeaux px-6 pb-10 pt-10">
        <p className="display text-[2rem] text-lavender">orbi</p>
        <div className="flex flex-col gap-6">
          <h1 className="display text-[3.4rem] leading-[0.95] text-bone">your phone is full of people you never see.</h1>
          <p className="display text-[1.75rem] leading-tight text-lavender-soft">orbi gets you in the same room.</p>
        </div>
        <button type="button" onClick={() => setStep(0)} className="mono min-h-14 rounded-full bg-bone text-[15px] text-bordeaux hover:bg-lavender hover:text-ink">
          begin
        </button>
      </div>
    );
  }

  if (step < last) {
    const s = STEPS[step];
    return (
      <div className="flex min-h-[calc(100dvh-80px)] flex-col gap-10 pt-4">
        <div className="mx-auto w-48">
          <OrbitDial phase={s.phase} interactive={false} />
        </div>
        <div className="flex flex-col gap-4">
          <p className="mono text-lavender">{s.kicker}</p>
          <h1 className="display text-[2.75rem] leading-[0.95]">{s.title}</h1>
          <p className="text-muted">{s.body}</p>
        </div>
        <div className="mt-auto flex items-center gap-4">
          <div className="flex gap-1.5" aria-hidden="true">
            {STEPS.map((_, i) => (
              <span key={i} className={`h-1 w-7 rounded-full ${i <= step ? "bg-lavender" : "bg-line"}`} />
            ))}
          </div>
          <span className="flex-1" />
          {step < last - 1 ? (
            <button type="button" onClick={() => setStep(last - 1)} className="mono min-h-11 px-2 text-muted-2 hover:text-bone">
              skip
            </button>
          ) : null}
          <button type="button" onClick={() => setStep(step + 1)} className="mono min-h-12 rounded-full bg-bordeaux px-6 text-bone hover:bg-lavender hover:text-ink">
            {step < last - 1 ? "continue" : replay ? "back to plans" : "i'm in"}
          </button>
        </div>
      </div>
    );
  }

  if (replay) {
    return (
      <div className="flex flex-col gap-6 pt-10">
        <h1 className="display text-[2.75rem]">that&apos;s orbi.</h1>
        <Link href="/app" className="mono inline-flex min-h-12 items-center self-start rounded-full bg-bordeaux px-6 text-bone hover:bg-lavender hover:text-ink">
          back to plans
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10 pt-6">
      <header className="flex flex-col gap-3">
        <p className="mono text-muted-2">last thing</p>
        <h1 className="display text-[3rem]">what should your mutuals call you?</h1>
        <p className="text-muted">only your connections see your name, and only once a plan starts.</p>
      </header>
      <NameForm next={next} />
    </div>
  );
}
