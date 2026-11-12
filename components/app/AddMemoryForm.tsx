"use client";

import { startTransition, useActionState, useRef, useState } from "react";
import { addMemory, type FormState } from "@/app/app/actions";
import { KindIcon } from "@/components/app/KindIcon";
import { shrink } from "@/components/app/PhotoUpload";
import { KINDS } from "@/lib/app/kinds";

const field =
  "w-full rounded-2xl border border-line bg-ink-2 px-4 py-3.5 text-[17px] text-bone placeholder:text-muted-2 outline-none focus-visible:border-lavender focus-visible:ring-2 focus-visible:ring-lavender";
const chip =
  "mono flex min-h-11 items-center gap-2 rounded-full border border-line px-4 text-[13px] text-bone peer-checked:border-lavender peer-checked:bg-lavender peer-checked:text-ink peer-focus-visible:ring-2 peer-focus-visible:ring-lavender";

const today = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export function AddMemoryForm({ mutuals }: { mutuals: { id: string; firstName: string }[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(addMemory, {});
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const fe = state.fieldErrors ?? {};

  // shrink the photo on the phone before it is sent
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const file = fileRef.current?.files?.[0];
    if (file) {
      setBusy(true);
      fd.set("photo", await shrink(file));
      setBusy(false);
    } else {
      fd.delete("photo");
    }
    startTransition(() => action(fd));
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-8" noValidate>
      <div className="flex flex-col gap-3">
        <span className="mono text-muted-2">the photo (optional)</span>
        <label className="relative flex aspect-[4/3] cursor-pointer items-center justify-center overflow-hidden rounded-3xl border border-dashed border-lavender/60 bg-ink-2 text-lavender focus-within:ring-2 focus-within:ring-lavender">
          <input
            ref={fileRef}
            type="file"
            name="photo"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              setPreview(f ? URL.createObjectURL(f) : null);
            }}
          />
          {preview ? (
            // a local preview of the chosen file
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="the photo you chose" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <span className="mono">choose a photo</span>
          )}
        </label>
        {fe.photo ? <p className="mono text-lavender">{fe.photo}</p> : null}
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="mono mb-3 text-muted-2">what was it</legend>
        <div className="flex flex-wrap gap-2">
          {KINDS.map((k) => (
            <label key={k.id} className="cursor-pointer">
              <input type="radio" name="kind" value={k.id} className="peer sr-only" />
              <span className={chip}>
                <KindIcon kind={k.id} className="h-4 w-4" />
                {k.label}
              </span>
            </label>
          ))}
        </div>
        {fe.kind ? <p className="mono text-lavender">{fe.kind}</p> : null}
      </fieldset>

      <div className="flex flex-col gap-2">
        <label htmlFor="am-place" className="mono text-muted-2">where</label>
        <input id="am-place" name="place" placeholder="Lilia, Prospect Park, Marta's rooftop" className={field} />
        {fe.place ? <p className="mono text-lavender">{fe.place}</p> : null}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="am-day" className="mono text-muted-2">when</label>
        <input id="am-day" name="happenedOn" type="date" max={today()} defaultValue={today()} className={`${field} [color-scheme:dark]`} />
        {fe.happenedOn ? <p className="mono text-lavender">{fe.happenedOn}</p> : null}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="am-note" className="mono text-muted-2">a line about it (optional)</label>
        <textarea id="am-note" name="note" rows={2} maxLength={280} placeholder="the night we closed the place down." className={`${field} resize-none`} />
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="mono mb-3 text-muted-2">who was there</legend>
        {mutuals.length ? (
          <div className="flex flex-wrap gap-2">
            {mutuals.map((m) => (
              <label key={m.id} className="cursor-pointer">
                <input type="checkbox" name="tagged" value={m.id} className="peer sr-only" />
                <span className={chip}>{m.firstName.toLowerCase()}</span>
              </label>
            ))}
          </div>
        ) : (
          <p className="text-[15px] text-muted">you can tag people in your orbit once you&apos;re connected.</p>
        )}
        <p className="text-[15px] text-muted-2">
          they&apos;ll get a ping and see it only if they accept. if they don&apos;t, nothing comes back to you.
        </p>
      </fieldset>

      {state.error ? <p role="alert" className="mono text-lavender">{state.error}</p> : null}

      <button type="submit" disabled={pending || busy} className="mono min-h-14 rounded-full bg-bordeaux px-8 text-[15px] text-bone hover:bg-lavender hover:text-ink disabled:opacity-60">
        {pending || busy ? "saving…" : "add the memory"}
      </button>
    </form>
  );
}
