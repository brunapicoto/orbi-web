"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { joinFromLink } from "@/app/app/actions";

export function JoinFromLinkButton({ slug, label }: { slug: string; label: string }) {
  const router = useRouter();
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setErr("");
            const res = await joinFromLink(slug);
            if (res.error) return setErr(res.error);
            try {
              localStorage.setItem(`orbi:in:${slug}`, "1");
            } catch {}
            router.push(`/p/${slug}`);
          })
        }
        className="mono min-h-14 rounded-full bg-bordeaux px-8 text-[15px] text-bone hover:bg-lavender hover:text-ink disabled:opacity-60"
      >
        {pending ? "saving…" : label}
      </button>
      {err ? <p role="alert" className="mono text-lavender">{err}</p> : null}
    </div>
  );
}
