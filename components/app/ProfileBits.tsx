"use client";

import { useRouter } from "next/navigation";
import { useActionState, useRef, useState, useTransition } from "react";
import { blockPerson, leaveOrbi, saveProfile, setAppearInPicks, unblockPerson, uploadAvatar, type FormState } from "@/app/app/actions";
import { shrink } from "@/components/app/PhotoUpload";

const field =
  "w-full rounded-2xl border border-line bg-ink-2 px-4 py-3.5 text-[17px] text-bone placeholder:text-muted-2 outline-none focus-visible:border-lavender focus-visible:ring-2 focus-visible:ring-lavender";

/** Your photo. Only you and the people in your orbit ever see it. */
export function AvatarPicker({ url, initial }: { url: string | null; initial: string }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const pick = async (f: File | undefined) => {
    if (!f) return;
    setBusy(true);
    setErr("");
    const fd = new FormData();
    fd.set("photo", await shrink(f));
    const res = await uploadAvatar(fd);
    setBusy(false);
    if (res.error) setErr(res.error);
    else router.refresh();
  };
  return (
    <div className="flex flex-col items-start gap-2">
      <button type="button" onClick={() => input.current?.click()} aria-label="change your photo" className="relative h-[84px] w-[84px] overflow-hidden rounded-full ring-2 ring-lavender/70 ring-offset-4 ring-offset-wine">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="display flex h-full w-full items-center justify-center bg-ink-2 text-[2.2rem] text-lavender">{initial}</span>
        )}
        <span className="mono absolute inset-x-0 bottom-0 bg-ink/70 py-0.5 text-center text-[10px] text-bone">{busy ? "…" : "edit"}</span>
      </button>
      <input ref={input} type="file" accept="image/*" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
      {err ? <p role="alert" className="mono text-[12px] text-lavender">{err}</p> : null}
    </div>
  );
}

export function ProfileForm({ bio, neighborhood }: { bio: string; neighborhood: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveProfile, {});
  const [b, setB] = useState(bio);
  const [n, setN] = useState(neighborhood);
  return (
    <form action={action} className="flex flex-col gap-3">
      <label htmlFor="pf-bio" className="mono text-muted-2">a line about you (your orbit sees it)</label>
      <textarea id="pf-bio" name="bio" rows={3} maxLength={160} value={b} onChange={(e) => setB(e.target.value)} placeholder="always open to a wednesday dinner. will travel for handmade pasta." className={`${field} resize-none`} />
      <label htmlFor="pf-hood" className="mono text-muted-2">your neighborhood</label>
      <input id="pf-hood" name="neighborhood" maxLength={40} value={n} onChange={(e) => setN(e.target.value)} placeholder="carroll gardens" className={field} />
      {state.fieldErrors ? <p className="mono text-lavender">{Object.values(state.fieldErrors)[0]}</p> : null}
      {state.error ? <p role="alert" className="mono text-lavender">{state.error}</p> : null}
      <button type="submit" disabled={pending} className="mono min-h-12 self-start rounded-full bg-bone px-6 text-[14px] text-ink hover:bg-lavender disabled:opacity-60">
        {pending ? "saving…" : state.ok ? "saved" : "save"}
      </button>
    </form>
  );
}

export function Toggle({ on, label, sub }: { on: boolean; label: string; sub: string }) {
  const [v, setV] = useState(on);
  const [pending, start] = useTransition();
  return (
    <label className="flex min-h-14 cursor-pointer items-center justify-between gap-4 px-5 py-4">
      <span className="flex flex-col">
        <span className="display text-[1.25rem]">{label}</span>
        <span className="text-[13px] text-muted-2">{sub}</span>
      </span>
      <input
        type="checkbox"
        checked={v}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.checked;
          setV(next);
          start(async () => {
            const res = await setAppearInPicks(next);
            if (res.error) setV(!next);
          });
        }}
        className="peer sr-only"
      />
      <span aria-hidden="true" className="relative h-7 w-12 shrink-0 rounded-full border border-line bg-ink transition-colors after:absolute after:left-1 after:top-1 after:h-[18px] after:w-[18px] after:rounded-full after:bg-muted after:transition-transform peer-checked:bg-lavender peer-checked:after:translate-x-5 peer-checked:after:bg-ink peer-focus-visible:ring-2 peer-focus-visible:ring-lavender" />
    </label>
  );
}

export function UnblockButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button type="button" disabled={pending} onClick={() => start(async () => { await unblockPerson(id); router.refresh(); })} className="mono min-h-10 rounded-full border border-line px-4 text-[12px] text-bone hover:border-lavender">
      {pending ? "…" : "let back in"}
    </button>
  );
}

/** From your orbit: they disappear for you, you for them. They're never told. */
export function BlockButton({ id, name }: { id: string; name: string }) {
  const [ask, setAsk] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();
  if (!ask)
    return (
      <button type="button" onClick={() => setAsk(true)} className="mono min-h-10 px-2 text-[12px] text-muted-2 hover:text-lavender">
        rather not see
      </button>
    );
  return (
    <span className="flex items-center gap-2">
      <button type="button" disabled={pending} onClick={() => start(async () => { await blockPerson(id); router.refresh(); })} className="mono min-h-10 rounded-full bg-bone px-3 text-[12px] text-ink hover:bg-lavender">
        {pending ? "…" : `hide ${name}`}
      </button>
      <button type="button" onClick={() => setAsk(false)} className="mono min-h-10 px-2 text-[12px] text-muted-2">cancel</button>
    </span>
  );
}

export function LeaveButton() {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="mono link-draw self-start text-muted-2">leave orbi</button>
      {open ? (
        <div role="dialog" aria-modal="true" aria-labelledby="leave-title" className="fixed inset-0 z-50 flex items-end justify-center bg-ink/70 p-4 backdrop-blur-sm sm:items-center">
          <div className="flex w-full max-w-md flex-col gap-4 rounded-[28px] bg-ink-2 p-7 ring-1 ring-line">
            <h2 id="leave-title" className="display text-[2.2rem]">leave orbi?</h2>
            <p className="text-muted">your profile, your plans and your memories are deleted. the people in your orbit aren&apos;t told. this can&apos;t be undone.</p>
            <button type="button" disabled={pending} onClick={() => start(() => leaveOrbi())} className="mono min-h-14 rounded-full border border-lavender px-6 text-lavender hover:bg-lavender hover:text-ink disabled:opacity-60">
              {pending ? "leaving…" : "yes, delete everything"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="mono min-h-14 rounded-full bg-bone px-6 text-ink hover:bg-lavender">stay</button>
          </div>
        </div>
      ) : null}
    </>
  );
}
