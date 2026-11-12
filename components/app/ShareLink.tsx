"use client";

import { useState } from "react";

/** Share a plan with a link (WhatsApp, iMessage...). The link shows a preview, never who's in. */
export function ShareLink({ slug, isHost }: { slug: string; isHost: boolean }) {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    const url = `${window.location.origin}/p/${slug}`;
    try {
      if (navigator.share) await navigator.share({ url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // cancelled
    }
  };
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-line p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="mono text-muted-2">/p/{slug}</span>
        <button type="button" onClick={share} className="mono min-h-11 rounded-full bg-bone px-5 text-[13px] text-ink hover:bg-lavender">
          {copied ? "copied" : "share link"}
        </button>
      </div>
      <p className="text-[14px] text-muted-2">
        {isHost
          ? "send it to friends. people outside your orbit join it by connecting with you first."
          : "anyone with it sees the plan and the count, never who's in."}
      </p>
    </div>
  );
}
