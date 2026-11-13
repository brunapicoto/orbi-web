"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { addMemory, uploadMemoryPhoto, type FormState } from "@/app/app/actions";
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

const MAX_PHOTOS = 10;

export function AddMemoryForm({ mutuals }: { mutuals: { id: string; firstName: string }[] }) {
  const router = useRouter();
  const [state, setState] = useState<FormState>({});
  const [pending, setPending] = useState(false);
  const [progress, setProgress] = useState("");
  const [photos, setPhotos] = useState<{ file: File; url: string }[]>([]);
  const fe = state.fieldErrors ?? {};

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const picked = Array.from(list).filter((f) => f.type.startsWith("image/"));
    setPhotos((cur) => [...cur, ...picked.map((file) => ({ file, url: URL.createObjectURL(file) }))].slice(0, MAX_PHOTOS));
  };
  const remove = (i: number) => setPhotos((cur) => cur.filter((_, j) => j !== i));

  // photos are shrunk on the phone, then sent one at a time (each request stays small)
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setPending(true);
    setState({});
    try {
      fd.delete("photo");
      if (photos.length) {
        setProgress(`photo 1 of ${photos.length}`);
        fd.set("photo", await shrink(photos[0].file));
      }
      fd.set("stay", "1");
      const res = await addMemory({}, fd);
      if (!res.id) {
        setState(res);
        return;
      }
      for (let i = 1; i < photos.length; i++) {
        setProgress(`photo ${i + 1} of ${photos.length}`);
        const one = new FormData();
        one.set("planId", res.id);
        one.set("photo", await shrink(photos[i].file));
        await uploadMemoryPhoto({}, one);
      }
      router.push(`/app/memories/${res.id}?added=1`);
    } catch {
      setState({ error: "something went wrong. please try again." });
    } finally {
      setPending(false);
      setProgress("");
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-8" noValidate>
      <div className="flex flex-col gap-3">
        <span className="mono text-muted-2" id="am-photos">the photos (optional)</span>
        {photos.length ? (
          <ul aria-labelledby="am-photos" className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
            {photos.map((p, i) => (
              <li key={p.url} className="relative aspect-square w-[72%] shrink-0 snap-start overflow-hidden rounded-3xl bg-ink-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={`photo ${i + 1} you chose`} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => remove(i)}
                  aria-label={`remove photo ${i + 1}`}
                  className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-full bg-ink/80 text-[20px] text-bone hover:bg-lavender hover:text-ink"
                >
                  ×
                </button>
                <span className="mono absolute bottom-2 left-3 rounded-full bg-ink/80 px-2.5 py-1 text-[11px] text-lavender-soft">{i + 1}/{photos.length}</span>
              </li>
            ))}
            {photos.length < MAX_PHOTOS ? (
              <li className="aspect-square w-[40%] shrink-0 snap-start">
                <AddTile onFiles={addFiles} label="add more" />
              </li>
            ) : null}
          </ul>
        ) : (
          <div className="aspect-square">
            <AddTile onFiles={addFiles} label="choose photos" />
          </div>
        )}
        <p className="text-[15px] text-muted-2">up to {MAX_PHOTOS}. swipe to see them all.</p>
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

      <button type="submit" disabled={pending} className="mono min-h-14 rounded-full bg-bordeaux px-8 text-[15px] text-bone hover:bg-lavender hover:text-ink disabled:opacity-60">
        {pending ? (progress ? `saving · ${progress}` : "saving…") : "add the memory"}
      </button>
    </form>
  );
}

function AddTile({ onFiles, label }: { onFiles: (f: FileList | null) => void; label: string }) {
  return (
    <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-lavender/60 bg-ink-2 text-lavender focus-within:ring-2 focus-within:ring-lavender">
      <input
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => {
          onFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <span aria-hidden="true" className="text-[28px] leading-none">+</span>
      <span className="mono text-[13px]">{label}</span>
    </label>
  );
}
