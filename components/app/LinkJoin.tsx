"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { joinFromLink } from "@/app/app/actions";

type Props = {
  slug: string;
  signedIn: boolean;
  isHost: boolean;
  joined: boolean;
  connected: boolean;
  status: string;
};

const KEY = (slug: string) => `orbi:in:${slug}`;

/** The "i'm in" button on the public page. Remembers in this browser that you said yes. */
export function LinkJoin({ slug, signedIn, isHost, joined, connected, status }: Props) {
  const [done, setDone] = useState(joined);
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      if (joined) localStorage.setItem(KEY(slug), "1");
      else if (!signedIn && localStorage.getItem(KEY(slug))) setDone(true);
    } catch {
      // storage can be blocked; the server still knows
    }
  }, [slug, joined, signedIn]);

  if (isHost) {
    const share = async () => {
      const url = window.location.href;
      try {
        if (navigator.share) await navigator.share({ url });
        else {
          await navigator.clipboard.writeText(url);
          setCopied(true);
        }
      } catch {
        // cancelled
      }
    };
    return (
      <div className="flex flex-col gap-3">
        <p className="mono text-lavender">this is your plan.</p>
        <button type="button" onClick={share} className="mono min-h-14 rounded-full bg-bone px-8 text-[15px] text-ink hover:bg-lavender">
          {copied ? "link copied" : "share the link"}
        </button>
      </div>
    );
  }
  if (done) {
    return (
      <div className="flex flex-col gap-2 rounded-2xl border border-lavender/40 p-5">
        <p className="display text-[1.75rem] text-lavender">you&apos;re in.</p>
        <p className="text-[15px] text-muted">you&apos;ll see who else is coming when it starts.</p>
        {signedIn ? (
          <Link href="/app" className="mono link-draw self-start text-bone">open orbi</Link>
        ) : null}
      </div>
    );
  }
  if (status === "live") return <p className="mono text-muted">this plan already started.</p>;

  // signed out, or not in the host's orbit yet: the confirm page explains the connection first
  if (!signedIn || !connected) {
    return (
      <div className="flex flex-col gap-3">
        <Link href={`/app/join/${slug}`} className="mono flex min-h-14 items-center justify-center rounded-full bg-bone px-8 text-[15px] text-bordeaux hover:bg-lavender hover:text-ink">
          i&apos;m in
        </Link>
        <p className="text-[15px] text-muted-2">
          {signedIn ? "you'll join the host's orbit first. it takes one tap." : "sign in with your email. no app download needed."}
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setErr("");
            const res = await joinFromLink(slug);
            if (res.error) setErr(res.error);
            else {
              setDone(true);
              try {
                localStorage.setItem(KEY(slug), "1");
              } catch {}
            }
          })
        }
        className="mono min-h-14 rounded-full bg-bone px-8 text-[15px] text-bordeaux hover:bg-lavender hover:text-ink disabled:opacity-60"
      >
        {pending ? "saving…" : "i'm in"}
      </button>
      {err ? <p role="alert" className="mono text-lavender">{err}</p> : null}
    </div>
  );
}
