"use client";

import { useActionState, useState } from "react";
import { draftFromLink, type DraftState } from "@/app/app/actions";
import { NewPlanForm } from "@/components/app/NewPlanForm";
import { categoryOf } from "@/lib/app/categories";

const field =
  "w-full rounded-2xl border border-line bg-ink-2 px-4 py-3.5 text-[17px] text-bone placeholder:text-muted-2 outline-none focus-visible:border-lavender focus-visible:ring-2 focus-visible:ring-lavender";

/** Step 1: paste a link. Step 2: check the draft and post it. */
export function LinkPlanFlow({ initialUrl = "" }: { initialUrl?: string }) {
  const [state, action, pending] = useActionState<DraftState, FormData>(draftFromLink, {});
  const [url, setUrl] = useState(initialUrl);
  const [caption, setCaption] = useState("");
  const [again, setAgain] = useState(false);
  const isInstagram = /instagram\.com/i.test(url);
  const showCaption = isInstagram || state.needsCaption;

  if (state.draft && state.source && !again) {
    const d = state.draft;
    const src = state.source;
    return (
      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-4 rounded-2xl border border-line bg-ink-2 p-3">
          {src.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src.thumbnailUrl} alt="" className="h-20 w-14 shrink-0 rounded-xl object-cover" referrerPolicy="no-referrer" />
          ) : (
            <span className="flex h-20 w-14 shrink-0 items-center justify-center rounded-xl border border-line text-muted-2" aria-hidden="true">▶</span>
          )}
          <div className="flex min-w-0 flex-col gap-1">
            <span className="mono text-lavender">from a {src.platform === "tiktok" ? "tiktok" : "reel"}{src.author ? ` · ${src.author}` : ""}</span>
            <span className="truncate text-[15px] text-muted">{src.caption.split("\n")[0]}</span>
            <span className="mono text-[12px] text-muted-2">
              {d.by === "ai" ? `orbi filled this in · ${categoryOf(d.kind).label}` : "a first guess · fill in the rest"}
            </span>
          </div>
        </div>
        <NewPlanForm draft={d} source={src} />
        <button type="button" onClick={() => setAgain(true)} className="mono link-draw self-start text-muted-2">
          use a different link
        </button>
      </div>
    );
  }

  return (
    <form action={(fd) => { setAgain(false); action(fd); }} className="flex flex-col gap-6" noValidate>
      <div className="flex flex-col gap-2">
        <label htmlFor="lk-url" className="mono text-muted-2">
          tiktok or reel link
        </label>
        <input
          id="lk-url"
          name="url"
          type="url"
          inputMode="url"
          autoComplete="off"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.tiktok.com/@…/video/…"
          className={field}
          aria-describedby="lk-help"
        />
        <p id="lk-help" className="text-[15px] text-muted-2">
          orbi reads the caption and suggests the place, a price and a day. you check everything before it&apos;s posted.
        </p>
      </div>
      {showCaption ? (
        <div className="flex flex-col gap-2">
          <label htmlFor="lk-cap" className="mono text-muted-2">
            caption{isInstagram ? "" : " (if we can't read it)"}
          </label>
          <textarea id="lk-cap" name="caption" rows={4} maxLength={2000} value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="paste the caption, or a few words: &ldquo;pasta at via carota, west village&rdquo;" className={`${field} resize-none`} />
        </div>
      ) : null}
      {state.error && !pending ? (
        <p role="alert" className="mono text-lavender">
          {state.error}
        </p>
      ) : null}
      <button type="submit" disabled={pending || !url.trim()} className="mono min-h-14 rounded-full bg-bordeaux px-8 text-[15px] text-bone transition-colors hover:bg-lavender hover:text-ink disabled:opacity-60">
        {pending ? "reading the video…" : "make it a plan"}
      </button>
    </form>
  );
}
