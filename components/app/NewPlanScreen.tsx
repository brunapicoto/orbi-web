"use client";

import { useCallback, useRef, useState } from "react";
import { LinkPlanFlow } from "@/components/app/LinkPlanFlow";
import { NewPlanForm } from "@/components/app/NewPlanForm";

/** The "+" screen: the usual form first, then "saw it on tiktok or instagram?" below it.
 *  Once a link turns into a draft, only the draft form shows, so there's one form on screen. */
export function NewPlanScreen({ initialKind }: { initialKind: string }) {
  const [hasDraft, setHasDraft] = useState(false);
  const linkRef = useRef<HTMLElement>(null);
  const onDraft = useCallback((has: boolean) => {
    setHasDraft(has);
    if (has) requestAnimationFrame(() => linkRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, []);

  return (
    <>
      {hasDraft ? null : <NewPlanForm initialKind={initialKind} />}
      <section ref={linkRef} aria-labelledby="from-link-title" className={`flex flex-col gap-6 ${hasDraft ? "" : "border-t border-line pt-10"}`}>
        <header className="flex flex-col gap-2">
          <p className="mono text-muted-2">or from a link</p>
          <h2 id="from-link-title" className="display text-[2.25rem] leading-[0.95]">
            saw it on tiktok or instagram?
          </h2>
          <p className="text-[15px] text-muted">paste the link and orbi fills in the plan for you.</p>
        </header>
        <LinkPlanFlow onDraft={onDraft} />
      </section>
    </>
  );
}
