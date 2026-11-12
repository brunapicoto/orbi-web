"use client";

import { useActionState, useState, useTransition } from "react";
import { acceptInvite, saveName, sendMagicLink, type FormState } from "@/app/app/actions";

const field =
  "w-full rounded-2xl border border-line bg-ink-2 px-4 py-3.5 text-[17px] text-bone placeholder:text-muted-2 outline-none focus-visible:border-lavender focus-visible:ring-2 focus-visible:ring-lavender";
const primary =
  "mono min-h-14 rounded-full bg-bordeaux px-8 text-[15px] text-bone transition-colors hover:bg-lavender hover:text-ink disabled:opacity-60";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(sendMagicLink, {});
  if (state.ok) {
    return (
      <div role="status" className="flex flex-col gap-3">
        <p className="display text-[2rem]">check your email.</p>
        <p className="text-muted">
          we sent a sign-in link to <span className="text-bone">{state.sentTo}</span>. open it on this phone.
        </p>
      </div>
    );
  }
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="next" value={next} />
      <label htmlFor="li-email" className="mono text-muted-2">
        email
      </label>
      <input id="li-email" name="email" type="email" inputMode="email" autoComplete="email" required className={field} aria-invalid={!!state.fieldErrors?.email} aria-describedby={state.fieldErrors?.email ? "li-email-e" : undefined} />
      {state.fieldErrors?.email ? <p id="li-email-e" className="mono text-lavender">{state.fieldErrors.email}</p> : null}
      {state.error ? <p role="alert" className="mono text-lavender">{state.error}</p> : null}
      <button type="submit" disabled={pending} className={primary}>
        {pending ? "sending…" : "send me a sign-in link"}
      </button>
      <p className="text-[15px] text-muted-2">no password. we email you a link that signs you in.</p>
    </form>
  );
}

export function NameForm({ next, current = "", cta = "continue" }: { next?: string; current?: string; cta?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveName, {});
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <label htmlFor="nf-name" className="mono text-muted-2">
        first name
      </label>
      <input id="nf-name" name="firstName" defaultValue={current} autoComplete="given-name" required maxLength={40} className={field} aria-invalid={!!state.fieldErrors?.firstName} aria-describedby={state.fieldErrors?.firstName ? "nf-name-e" : undefined} />
      {state.fieldErrors?.firstName ? <p id="nf-name-e" className="mono text-lavender">{state.fieldErrors.firstName}</p> : null}
      {state.error ? <p role="alert" className="mono text-lavender">{state.error}</p> : null}
      {state.ok ? <p role="status" className="mono text-lavender">saved.</p> : null}
      <button type="submit" disabled={pending} className={primary}>
        {pending ? "saving…" : cta}
      </button>
    </form>
  );
}

export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      (document.getElementById("cl-url") as HTMLInputElement | null)?.select();
    }
  };
  return (
    <div className="flex flex-col gap-3">
      <label htmlFor="cl-url" className="sr-only">
        your invite link
      </label>
      <input id="cl-url" readOnly value={url} className={`${field} mono text-[14px] text-lavender-soft`} onFocus={(e) => e.currentTarget.select()} />
      <button type="button" onClick={copy} className={primary}>
        {copied ? "link copied" : "copy invite link"}
      </button>
      <span className="sr-only" aria-live="polite">
        {copied ? "invite link copied" : ""}
      </span>
    </div>
  );
}

export function AcceptInvite({ code, name }: { code: string; name: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await acceptInvite(code);
            if (res?.error) setError(res.error);
          })
        }
        className={primary}
      >
        {pending ? "connecting…" : `connect with ${name.toLowerCase()}`}
      </button>
      <p aria-live="polite" className="mono min-h-5 text-lavender">
        {error ?? ""}
      </p>
    </div>
  );
}
