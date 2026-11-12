"use client";

import { useState, useTransition } from "react";
import { joinPlan, leavePlan } from "@/app/app/actions";

export function JoinButton({ planId, joined, full }: { planId: string; joined: boolean; full: boolean }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = (fn: typeof joinPlan) =>
    start(async () => {
      setError(null);
      const res = await fn(planId);
      if (res.error) setError(res.error);
    });

  return (
    <div className="flex flex-col gap-3">
      {joined ? (
        <button
          type="button"
          onClick={() => run(leavePlan)}
          disabled={pending}
          className="mono min-h-14 rounded-full border border-line px-8 text-[15px] text-muted transition-colors hover:border-lavender hover:text-bone disabled:opacity-60"
        >
          {pending ? "one sec…" : "i can't make it anymore"}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => run(joinPlan)}
          disabled={pending || full}
          className="mono min-h-14 rounded-full bg-bordeaux px-8 text-[15px] text-bone transition-colors hover:bg-lavender hover:text-ink disabled:opacity-60"
        >
          {full ? "this plan is full" : pending ? "saving your spot…" : "i'm in"}
        </button>
      )}
      <p aria-live="polite" className="mono min-h-5 text-lavender">
        {error ?? ""}
      </p>
    </div>
  );
}
