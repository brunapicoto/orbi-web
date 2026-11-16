"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";
import { addPlace, createList, deleteList, deletePlace, importPlaces, savePlaces, type FormState, type ImportState } from "@/app/app/actions";
import { videoFrames } from "@/lib/app/frames";
import { PLACE_CATEGORIES, type NewPlace, type PlaceList } from "@/lib/app/types";

const field =
  "w-full rounded-2xl border border-line bg-ink-2 px-4 py-3.5 text-[16px] text-bone placeholder:text-muted-2 outline-none focus-visible:border-lavender focus-visible:ring-2 focus-visible:ring-lavender";
const chip = (on: boolean) => `mono flex min-h-10 shrink-0 items-center rounded-full border px-4 text-[12px] ${on ? "border-lavender bg-lavender text-ink" : "border-line text-bone hover:border-lavender"}`;
const CAT_TO_KIND: Record<string, string> = { coffee: "brunch", bar: "drinks", restaurant: "dinner", park: "run", gem: "other", activity: "class", other: "other" };

export function ListsClient({ lists }: { lists: PlaceList[] }) {
  const [active, setActive] = useState(lists[0]?.id ?? "");
  const [cat, setCat] = useState<string | null>(null);
  const [mode, setMode] = useState<"none" | "add" | "import" | "new">(lists.length ? "none" : "new");
  const list = lists.find((l) => l.id === active) ?? lists[0];
  const places = list ? list.places.filter((p) => !cat || p.category === cat) : [];
  const catsHere = PLACE_CATEGORIES.filter((c) => list?.places.some((p) => p.category === c.id));

  return (
    <div className="flex flex-col gap-6">
      {lists.length ? (
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]" role="tablist" aria-label="your lists">
          {lists.map((l) => (
            <button key={l.id} type="button" role="tab" aria-selected={l.id === list?.id} onClick={() => { setActive(l.id); setCat(null); }} className={chip(l.id === list?.id)}>
              {l.name} · {l.places.length}
            </button>
          ))}
          <button type="button" onClick={() => setMode(mode === "new" ? "none" : "new")} className="mono flex min-h-10 shrink-0 items-center rounded-full border border-dashed border-lavender/60 px-4 text-[12px] text-lavender">
            + new list
          </button>
        </div>
      ) : null}

      {mode === "new" ? <NewList onDone={(id) => { if (id) setActive(id); setMode("none"); }} first={!lists.length} /> : null}

      {list ? (
        <>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setMode(mode === "add" ? "none" : "add")} className="mono min-h-11 rounded-full bg-bone px-5 text-[13px] text-ink hover:bg-lavender">+ add a place</button>
            <button type="button" onClick={() => setMode(mode === "import" ? "none" : "import")} className="mono min-h-11 rounded-full border border-lavender/60 px-5 text-[13px] text-lavender hover:bg-lavender hover:text-ink">
              import from tiktok, instagram or notes
            </button>
          </div>
          {mode === "add" ? <AddPlace listId={list.id} onDone={() => setMode("none")} /> : null}
          {mode === "import" ? <Import listId={list.id} listName={list.name} onDone={() => setMode("none")} /> : null}

          {catsHere.length > 1 ? (
            <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
              <button type="button" onClick={() => setCat(null)} className={chip(!cat)}>everything</button>
              {catsHere.map((c) => (
                <button key={c.id} type="button" onClick={() => setCat(c.id)} className={chip(cat === c.id)}>{c.label}</button>
              ))}
            </div>
          ) : null}

          {places.length ? (
            <ul className="flex flex-col divide-y divide-line overflow-hidden rounded-[20px] bg-ink-2 ring-1 ring-line ring-inset">
              {places.map((p) => (
                <li key={p.id} className="flex flex-col gap-2 px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex min-w-0 flex-col">
                      <span className="display text-[1.45rem] leading-tight [overflow-wrap:anywhere]">{p.name}</span>
                      <span className="mono text-[12px] text-muted-2">
                        {PLACE_CATEGORIES.find((c) => c.id === p.category)?.label}
                        {p.neighborhood ? ` · ${p.neighborhood}` : ""}
                      </span>
                    </span>
                    <DeletePlace id={p.id} />
                  </div>
                  {p.note ? <p className="text-[14px] text-muted">{p.note}</p> : null}
                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      href={`/app/new?kind=${CAT_TO_KIND[p.category]}&place=${encodeURIComponent(p.name)}${p.neighborhood ? `&hood=${encodeURIComponent(p.neighborhood)}` : ""}`}
                      className="mono link-draw text-[12px] text-lavender"
                    >
                      make it a plan →
                    </Link>
                    {p.sourceUrl ? (
                      <a href={p.sourceUrl} target="_blank" rel="noopener noreferrer" className="mono link-draw text-[12px] text-muted-2">the video ↗</a>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted">nothing here yet. add a place, or import the ones you saved on tiktok, instagram or in your notes.</p>
          )}
          <DeleteList id={list.id} name={list.name} />
        </>
      ) : null}
    </div>
  );
}

function NewList({ onDone, first }: { onDone: (id?: string) => void; first: boolean }) {
  const router = useRouter();
  const [state, action, pending] = useActionState<FormState, FormData>(async (p, fd) => {
    const res = await createList(p, fd);
    if (res.id) { router.refresh(); onDone(res.id); }
    return res;
  }, {});
  const [name, setName] = useState(first ? "want to try" : "");
  return (
    <form action={action} className="flex flex-col gap-3 rounded-[20px] bg-ink-2 p-5 ring-1 ring-line ring-inset">
      <label htmlFor="nl-name" className="mono text-muted-2">{first ? "start your first list" : "a new list"}</label>
      <input id="nl-name" name="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="coffee shops, date night, hidden gems…" className={field} />
      {state.fieldErrors?.name || state.error ? <p className="mono text-lavender">{state.fieldErrors?.name ?? state.error}</p> : null}
      <button type="submit" disabled={pending} className="mono min-h-12 self-start rounded-full bg-bone px-6 text-[13px] text-ink hover:bg-lavender disabled:opacity-60">{pending ? "…" : "create list"}</button>
    </form>
  );
}

function AddPlace({ listId, onDone }: { listId: string; onDone: () => void }) {
  const router = useRouter();
  const [state, action, pending] = useActionState<FormState, FormData>(async (p, fd) => {
    const res = await addPlace(p, fd);
    if (res.ok) { router.refresh(); onDone(); }
    return res;
  }, {});
  const [name, setName] = useState("");
  const [hood, setHood] = useState("");
  const [note, setNote] = useState("");
  const [category, setCategory] = useState("restaurant");
  return (
    <form action={action} className="flex flex-col gap-3 rounded-[20px] bg-ink-2 p-5 ring-1 ring-line ring-inset">
      <input type="hidden" name="listId" value={listId} />
      <input name="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="the place" aria-label="the place" className={field} />
      <input name="neighborhood" value={hood} onChange={(e) => setHood(e.target.value)} maxLength={40} placeholder="neighborhood (optional)" aria-label="neighborhood" className={field} />
      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]" role="radiogroup" aria-label="what is it">
        {PLACE_CATEGORIES.map((c) => (
          <label key={c.id} className="shrink-0 cursor-pointer">
            <input type="radio" name="category" value={c.id} checked={category === c.id} onChange={() => setCategory(c.id)} className="peer sr-only" />
            <span className="mono flex min-h-10 items-center rounded-full border border-line px-4 text-[12px] text-bone peer-checked:border-lavender peer-checked:bg-lavender peer-checked:text-ink">{c.label}</span>
          </label>
        ))}
      </div>
      <input name="note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} placeholder="why (optional): the cacio e pepe, the patio…" aria-label="note" className={field} />
      {state.fieldErrors?.name || state.error ? <p className="mono text-lavender">{state.fieldErrors?.name ?? state.error}</p> : null}
      <button type="submit" disabled={pending} className="mono min-h-12 self-start rounded-full bg-bone px-6 text-[13px] text-ink hover:bg-lavender disabled:opacity-60">{pending ? "saving…" : "save place"}</button>
    </form>
  );
}

/** Paste a tiktok/reel link (optionally add the video) or your notes; pick which places to keep. */
function Import({ listId, listName, onDone }: { listId: string; listName: string; onDone: () => void }) {
  const router = useRouter();
  const [state, action, pending] = useActionState<ImportState, FormData>(importPlaces, {});
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [frames, setFrames] = useState<string[]>([]);
  const [reading, setReading] = useState(false);
  const [keep, setKeep] = useState<Record<number, boolean>>({});
  const [saving, start] = useTransition();
  const [err, setErr] = useState("");
  const found = state.places ?? [];

  if (found.length) {
    const chosen = found.filter((_, i) => keep[i] !== false);
    return (
      <div className="flex flex-col gap-3 rounded-[20px] bg-ink-2 p-5 ring-1 ring-line ring-inset">
        <p className="mono text-muted-2">{state.by === "ai" ? "orbi found these" : "one per line"} · pick what to keep</p>
        <ul className="flex flex-col gap-2">
          {found.map((p: NewPlace, i: number) => (
            <li key={i}>
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line px-4 py-3">
                <input type="checkbox" checked={keep[i] !== false} onChange={(e) => setKeep({ ...keep, [i]: e.target.checked })} className="mt-1 h-4 w-4 accent-[#8FA3F5]" />
                <span className="flex flex-col">
                  <span className="text-bone">{p.name}</span>
                  <span className="mono text-[12px] text-muted-2">
                    {PLACE_CATEGORIES.find((c) => c.id === p.category)?.label}
                    {p.neighborhood ? ` · ${p.neighborhood}` : ""}
                    {p.note ? ` · ${p.note}` : ""}
                  </span>
                </span>
              </label>
            </li>
          ))}
        </ul>
        {err ? <p role="alert" className="mono text-lavender">{err}</p> : null}
        <button
          type="button"
          disabled={saving || !chosen.length}
          onClick={() => start(async () => {
            const res = await savePlaces(listId, chosen);
            if (res.error) setErr(res.error);
            else { router.refresh(); onDone(); }
          })}
          className="mono min-h-12 self-start rounded-full bg-bone px-6 text-[13px] text-ink hover:bg-lavender disabled:opacity-60"
        >
          {saving ? "saving…" : `save ${chosen.length} to “${listName}”`}
        </button>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3 rounded-[20px] bg-ink-2 p-5 ring-1 ring-line ring-inset">
      <label htmlFor="im-url" className="mono text-muted-2">a tiktok or reel link</label>
      <input id="im-url" name="url" type="url" inputMode="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.tiktok.com/@…/video/…" className={field} />
      {url ? (
        <label className="mono flex flex-col gap-2 text-[12px] text-muted-2">
          add the video too (optional, better): orbi looks at the whole clip
          <input
            type="file"
            accept="video/*"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setReading(true);
              try { setFrames(await videoFrames(f)); } catch { setFrames([]); } finally { setReading(false); }
            }}
            className="text-muted file:mr-3 file:min-h-10 file:rounded-full file:border-0 file:bg-bone file:px-4 file:text-ink"
          />
        </label>
      ) : null}
      {frames.map((f, i) => <input key={i} type="hidden" name="frames" value={f} />)}
      <label htmlFor="im-text" className="mono text-muted-2">{url ? "caption (if we can't read it)" : "or paste your notes"}</label>
      <textarea id="im-text" name="text" rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder={"via carota - west village\nsey coffee, bushwick\nlittle island"} className={`${field} resize-none`} />
      {state.error ? <p role="alert" className="mono text-lavender">{state.error}</p> : null}
      <button type="submit" disabled={pending || reading || (!url && !text)} className="mono min-h-12 self-start rounded-full bg-bone px-6 text-[13px] text-ink hover:bg-lavender disabled:opacity-60">
        {reading ? "looking through the video…" : pending ? "finding places…" : "find the places"}
      </button>
    </form>
  );
}

function DeletePlace({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button type="button" aria-label="remove from list" disabled={pending} onClick={() => start(async () => { await deletePlace(id); router.refresh(); })} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-2 hover:text-lavender">
      ×
    </button>
  );
}

function DeleteList({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [ask, setAsk] = useState(false);
  const [pending, start] = useTransition();
  return ask ? (
    <span className="flex items-center gap-3">
      <button type="button" disabled={pending} onClick={() => start(async () => { await deleteList(id); router.refresh(); setAsk(false); })} className="mono min-h-10 rounded-full border border-lavender px-4 text-[12px] text-lavender">
        delete “{name}”
      </button>
      <button type="button" onClick={() => setAsk(false)} className="mono text-[12px] text-muted-2">cancel</button>
    </span>
  ) : (
    <button type="button" onClick={() => setAsk(true)} className="mono link-draw self-start text-[12px] text-muted-2">delete this list</button>
  );
}
