"use client";

import Link from "next/link";
import { useActionState } from "react";
import { savePrefs, type FormState } from "@/app/app/actions";
import { KindIcon } from "@/components/app/KindIcon";
import { KINDS } from "@/lib/app/kinds";
import { AREAS, SIZES, TIMES } from "@/lib/app/rank";
import type { Prefs } from "@/lib/app/types";

const chip =
  "mono flex min-h-11 items-center gap-2 rounded-full border border-line px-4 text-[13px] text-bone transition-colors peer-checked:border-lavender peer-checked:bg-lavender peer-checked:text-ink peer-focus-visible:ring-2 peer-focus-visible:ring-lavender";

export function PrefsForm({ prefs, next, first }: { prefs: Prefs | null; next?: string; first?: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(savePrefs, {});
  const has = (list: string[] | undefined, v: string) => Boolean(list?.includes(v));
  return (
    <form action={action} className="flex flex-col gap-9">
      {next ? <input type="hidden" name="next" value={next} /> : null}

      <Group legend="what are you into?" hint="pick as many as you like">
        {KINDS.filter((k) => k.id !== "other").map((k) => (
          <label key={k.id} className="cursor-pointer">
            <input type="checkbox" name="kinds" value={k.id} defaultChecked={has(prefs?.kinds, k.id)} className="peer sr-only" />
            <span className={chip}>
              <KindIcon kind={k.id} className="h-4 w-4" />
              {k.label}
            </span>
          </label>
        ))}
      </Group>

      <Group legend="when are you usually free?">
        {TIMES.map((t) => (
          <label key={t.id} className="cursor-pointer">
            <input type="checkbox" name="times" value={t.id} defaultChecked={has(prefs?.times, t.id)} className="peer sr-only" />
            <span className={chip}>{t.label}</span>
          </label>
        ))}
      </Group>

      <Group legend="where do you like to go?">
        {AREAS.map((a) => (
          <label key={a.id} className="cursor-pointer">
            <input type="checkbox" name="areas" value={a.id} defaultChecked={has(prefs?.areas, a.id)} className="peer sr-only" />
            <span className={chip}>{a.label}</span>
          </label>
        ))}
      </Group>

      <Group legend="your kind of group">
        {SIZES.map((sz) => (
          <label key={sz.id} className="cursor-pointer">
            <input type="radio" name="groupSize" value={sz.id} defaultChecked={prefs?.groupSize === sz.id} className="peer sr-only" />
            <span className={chip}>{sz.label}</span>
          </label>
        ))}
      </Group>

      <p className="rounded-2xl border border-line p-4 text-[15px] text-muted">
        only you see this. orbi uses it to put the plans that fit you first. it never hides a plan, and it never looks at who&apos;s going.
      </p>

      {state.error ? <p role="alert" className="mono text-lavender">{state.error}</p> : null}
      {state.ok ? <p role="status" className="mono text-lavender">saved. your plans are re-ordered.</p> : null}

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={pending} className="mono min-h-14 rounded-full bg-bordeaux px-8 text-[15px] text-bone hover:bg-lavender hover:text-ink disabled:opacity-60">
          {pending ? "saving…" : first ? "show me plans" : "save"}
        </button>
        {first ? (
          <Link href={next ?? "/app"} className="mono link-draw text-muted-2">
            skip for now
          </Link>
        ) : null}
      </div>
    </form>
  );
}

function Group({ legend, hint, children }: { legend: string; hint?: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-3 flex flex-col gap-1">
        <span className="display text-[1.75rem] leading-tight">{legend}</span>
        {hint ? <span className="mono text-muted-2">{hint}</span> : null}
      </legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}
