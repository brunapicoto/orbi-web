"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { joinWaitlist, type WaitlistState } from "@/app/actions/waitlist";
import { OrbitDial } from "@/components/OrbitDial";

const initial: WaitlistState = { status: "idle" };

const inputBase =
  "w-full rounded-2xl border bg-bordeaux/40 px-5 py-4 text-[18px] text-bone placeholder:text-lavender-soft/70 outline-none transition-colors focus-visible:border-lavender focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavender";

export function WaitlistForm() {
  const [state, action, pending] = useActionState(joinWaitlist, initial);
  const doneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.status === "ok" || state.status === "duplicate") doneRef.current?.focus();
  }, [state.status]);

  if (state.status === "ok" || state.status === "duplicate") {
    return (
      <div ref={doneRef} tabIndex={-1} className="flex flex-col items-start gap-6 outline-none" aria-live="polite">
        <OrbitDial phase="reveal" size={72} interactive={false} ring="rgba(201,210,250,0.4)" />
        <p className="display text-[clamp(2rem,5vw,3.25rem)] text-bone">
          {state.status === "duplicate" ? "you're already on the list." : "you're in. we'll let you know when your circle is ready."}
        </p>
        <CopyInvite />
      </div>
    );
  }

  const fe = state.fieldErrors ?? {};
  const v = state.values;

  return (
    <form action={action} noValidate className="flex flex-col gap-5" aria-describedby={state.message ? "wl-message" : undefined}>
      <div className="grid gap-5 md:grid-cols-2">
        <Field id="wl-first" label="first name" error={fe.firstName}>
          <input
            id="wl-first"
            name="firstName"
            type="text"
            autoComplete="given-name"
            required
            defaultValue={v?.firstName}
            aria-invalid={fe.firstName ? true : undefined}
            aria-describedby={fe.firstName ? "wl-first-error" : undefined}
            className={`${inputBase} ${fe.firstName ? "border-lavender" : "border-lavender-soft/30"}`}
          />
        </Field>
        <Field id="wl-email" label="email" error={fe.email}>
          <input
            id="wl-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            defaultValue={v?.email}
            aria-invalid={fe.email ? true : undefined}
            aria-describedby={fe.email ? "wl-email-error" : undefined}
            className={`${inputBase} ${fe.email ? "border-lavender" : "border-lavender-soft/30"}`}
          />
        </Field>
      </div>
      <Field id="wl-hood" label="neighborhood or school (optional)" error={fe.neighborhood}>
        <input
          id="wl-hood"
          name="neighborhood"
          type="text"
          autoComplete="off"
          defaultValue={v?.neighborhood}
          aria-invalid={fe.neighborhood ? true : undefined}
          aria-describedby={fe.neighborhood ? "wl-hood-error" : undefined}
          className={`${inputBase} ${fe.neighborhood ? "border-lavender" : "border-lavender-soft/30"}`}
        />
      </Field>

      {/* honeypot, hidden from people and screen readers */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="wl-company">company</label>
        <input id="wl-company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {state.message ? (
        <p id="wl-message" role="alert" className="mono text-lavender">
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mono mt-2 inline-flex min-h-14 items-center justify-center gap-3 self-start rounded-full bg-bone px-8 text-[14px] text-bordeaux transition-colors hover:bg-lavender hover:text-ink disabled:opacity-70"
      >
        {pending ? "joining…" : "join the waitlist"}
      </button>
    </form>
  );
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="mono text-lavender-soft">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mono text-lavender">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function CopyInvite() {
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState("");
  const fallbackRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setUrl(window.location.origin);
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      fallbackRef.current?.select();
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={copy}
        className="mono inline-flex min-h-12 items-center rounded-full border border-lavender-soft/40 px-6 text-bone transition-colors hover:border-lavender hover:text-lavender"
      >
        {copied ? "link copied" : "copy invite link"}
      </button>
      <label htmlFor="wl-invite" className="sr-only">
        invite link
      </label>
      <input
        id="wl-invite"
        ref={fallbackRef}
        readOnly
        value={url}
        className="mono min-w-0 flex-1 bg-transparent text-lavender-soft outline-none"
      />
      <span className="sr-only" aria-live="polite">
        {copied ? "invite link copied" : ""}
      </span>
    </div>
  );
}
