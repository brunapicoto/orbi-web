"use client";

import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { createPlan, findPlace, type FormState } from "@/app/app/actions";
import { KindIcon } from "@/components/app/KindIcon";
import { PinPicker } from "@/components/app/map";
import type { LinkSource, PlanDraft } from "@/lib/app/fromLink";
import { KINDS, TOPICS } from "@/lib/app/kinds";

const PRICES = [
  { v: "0", label: "free" },
  { v: "1", label: "$" },
  { v: "2", label: "$$" },
  { v: "3", label: "$$$" },
];

const field =
  "w-full rounded-2xl border border-line bg-ink-2 px-4 py-3.5 text-[17px] text-bone placeholder:text-muted-2 outline-none focus-visible:border-lavender focus-visible:ring-2 focus-visible:ring-lavender";

function defaultWhen() {
  const d = new Date(Date.now() + 2 * 86400_000);
  d.setHours(19, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function NewPlanForm({ initialKind = "", initialPlace = "", draft, source }: {
  initialKind?: string; initialPlace?: string; draft?: PlanDraft; source?: LinkSource;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(createPlan, {});
  const [kind, setKind] = useState(draft?.kind ?? initialKind);
  // controlled, so what you typed survives a validation error (React resets uncontrolled fields after an action)
  const [place, setPlace] = useState(draft?.place ?? initialPlace);
  const [title, setTitle] = useState(draft?.title ?? "");
  const [neighborhood, setNeighborhood] = useState(draft?.neighborhood ?? "");
  const [price, setPrice] = useState(draft?.priceLevel != null ? String(draft.priceLevel) : "");
  const [costNote, setCostNote] = useState("");
  const [showHost, setShowHost] = useState(false);
  const [pin, setPin] = useState<{ lat: number | null; lng: number | null }>({ lat: draft?.lat ?? null, lng: draft?.lng ?? null });
  const [mapOpen, setMapOpen] = useState(!!draft);
  const [searching, startSearch] = useTransition();
  const [searchMsg, setSearchMsg] = useState("");
  const findOnMap = () =>
    startSearch(async () => {
      setSearchMsg("");
      const hit = await findPlace([place, neighborhood, "new york"].filter(Boolean).join(", "));
      if (hit) setPin({ lat: hit.lat, lng: hit.lng });
      else setSearchMsg("couldn't find that. tap the map to drop the pin.");
    });
  const [minPeople, setMinPeople] = useState(3);

  // as you type the place, try to pin it: waits for a pause in typing (the geocoder allows ~1 lookup a second)
  const lastQuery = useRef(draft?.lat != null ? [draft.place, draft.neighborhood, "new york"].filter(Boolean).join(", ") : "");
  const [autoMsg, setAutoMsg] = useState("");
  useEffect(() => {
    const q = [place.trim(), neighborhood.trim(), "new york"].filter(Boolean).join(", ");
    if (place.trim().length < 3 || q === lastQuery.current) return;
    const t = setTimeout(async () => {
      lastQuery.current = q;
      setAutoMsg("looking for it on the map…");
      const hit = await findPlace(q);
      if (lastQuery.current !== q) return; // you kept typing
      if (hit) {
        setPin({ lat: hit.lat, lng: hit.lng });
        setMapOpen(true);
        setAutoMsg(`pinned: ${hit.label}. drag it if it's not quite right.`);
      } else {
        setAutoMsg("couldn't find that yet. keep typing, or tap the map to drop the pin.");
      }
    }, 900);
    return () => clearTimeout(t);
  }, [place, neighborhood]);
  const [note, setNote] = useState("");
  const [topic, setTopic] = useState("");
  // total group (you included) and spots opened to mutuals; the rest are friends you bring
  const [total, setTotal] = useState(4);
  const [spots, setSpots] = useState(3);
  const [warn, setWarn] = useState<"min" | "max" | null>(null);
  const bringing = total - 1 - spots;
  const minShown = Math.min(minPeople, total);
  const lessTotal = () => {
    if (total <= 3) return setWarn("min");
    setTotal(total - 1);
    setSpots(Math.min(spots, total - 2));
    setWarn(null);
  };
  const moreTotal = () => {
    if (total >= 12) return;
    setTotal(total + 1);
    setWarn(null);
  };
  const lessSpots = () => {
    if (spots <= 1) return;
    setSpots(spots - 1);
    setWarn(null);
  };
  const moreSpots = () => {
    if (spots >= total - 1) return setWarn("max");
    setSpots(spots + 1);
    setWarn(null);
  };
  const [local, setLocal] = useState(() => draft?.startsAt ?? defaultWhen());
  // the picker gives a local time with no zone; send the exact moment instead
  const iso = useMemo(() => {
    const d = new Date(local);
    return Number.isNaN(d.getTime()) ? "" : d.toISOString();
  }, [local]);
  const fe = state.fieldErrors ?? {};

  return (
    <form action={action} className="flex flex-col gap-8" noValidate>
      {source ? (
        <>
          <input type="hidden" name="sourceUrl" value={source.url} />
          <input type="hidden" name="sourceAuthor" value={source.author ?? ""} />
          <input type="hidden" name="thumbnailUrl" value={source.thumbnailUrl ?? ""} />
        </>
      ) : null}
      {draft ? (
        <div className="flex flex-col gap-2">
          <label htmlFor="np-title" className="mono text-muted-2">
            title
          </label>
          <input id="np-title" name="title" value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} className={`${field} display text-[22px]`} aria-invalid={!!fe.title} />
          {fe.title ? <p className="mono text-lavender">{fe.title}</p> : null}
        </div>
      ) : null}
      <fieldset className="flex flex-col gap-3">
        <legend className="mono mb-3 text-muted-2">what is it</legend>
        <div className="flex flex-wrap gap-2">
          {KINDS.map((k) => (
            <label key={k.id} className="cursor-pointer">
              <input
                type="radio"
                name="kind"
                value={k.id}
                checked={kind === k.id}
                onChange={() => setKind(k.id)}
                className="peer sr-only"
              />
              <span className="mono flex min-h-11 items-center gap-2 rounded-full border border-line px-4 text-bone transition-colors peer-checked:border-lavender peer-checked:bg-lavender peer-checked:text-ink peer-focus-visible:ring-2 peer-focus-visible:ring-lavender">
                <KindIcon kind={k.id} className="h-4 w-4" />
                {k.label}
              </span>
            </label>
          ))}
        </div>
        {kind === "networking" ? (
          <div className="mt-2 flex flex-col gap-3 rounded-2xl border border-line p-4">
            <span className="mono text-muted-2" id="np-topic">which field?</span>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby="np-topic">
              {TOPICS.map((t) => (
                <label key={t.id} className="cursor-pointer">
                  <input type="radio" name="topic" value={t.id} checked={topic === t.id} onChange={() => setTopic(t.id)} className="peer sr-only" />
                  <span className="mono flex min-h-11 items-center rounded-full border border-line px-4 text-bone transition-colors peer-checked:border-lavender peer-checked:bg-lavender peer-checked:text-ink peer-focus-visible:ring-2 peer-focus-visible:ring-lavender">
                    {t.label}
                  </span>
                </label>
              ))}
            </div>
            <p className="text-[15px] text-muted-2">still mutuals only, still 3 or more, still nobody knows who&apos;s coming until it starts.</p>
          </div>
        ) : null}
        {fe.kind ? <p className="mono text-lavender">{fe.kind}</p> : null}
      </fieldset>

      <div className="flex flex-col gap-2">
        <label htmlFor="np-place" className="mono text-muted-2">
          where
        </label>
        <input id="np-place" name="place" value={place} onChange={(e) => setPlace(e.target.value)} placeholder="Monkey Bar, Prospect Park, a friend's studio" className={field} aria-invalid={!!fe.place} aria-describedby={fe.place ? "np-place-e" : undefined} />
        {fe.place ? <p id="np-place-e" className="mono text-lavender">{fe.place}</p> : null}
        {draft?.placeUnclear ? (
          <p className="rounded-2xl border border-lavender/40 px-4 py-3 text-[15px] text-lavender">
            the place isn&apos;t clear from the video{draft.unclearWhy ? `: ${draft.unclearWhy.replace(/\.$/, "")}` : ""}. check it before you post.
          </p>
        ) : null}
        <label htmlFor="np-hood" className="sr-only">neighborhood</label>
        <input id="np-hood" name="neighborhood" value={neighborhood} maxLength={40} onChange={(e) => setNeighborhood(e.target.value)} placeholder="neighborhood (west village, williamsburg…)" className={field} />
        <input type="hidden" name="lat" value={pin.lat ?? ""} />
        <input type="hidden" name="lng" value={pin.lng ?? ""} />
        {mapOpen ? (
          <div className="mt-2 flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={findOnMap} disabled={searching || !place.trim()} className="mono min-h-11 rounded-full border border-line px-4 text-bone hover:border-lavender disabled:opacity-50">
                {searching ? "finding…" : "find it on the map"}
              </button>
              {pin.lat !== null ? (
                <button type="button" onClick={() => setPin({ lat: null, lng: null })} className="mono min-h-11 px-2 text-muted-2 hover:text-lavender">
                  remove pin
                </button>
              ) : null}
            </div>
            <PinPicker lat={pin.lat} lng={pin.lng} onChange={(lat, lng) => setPin({ lat, lng })} />
            <p className="text-[15px] text-muted-2" aria-live="polite">
              {searchMsg || autoMsg || (pin.lat !== null ? "drag the pin if it's not quite right." : "tap the map to drop a pin. only your mutuals see it.")}
            </p>
          </div>
        ) : (
          <>
            <button type="button" onClick={() => setMapOpen(true)} className="mono link-draw mt-1 self-start text-lavender">
              + put it on the map
            </button>
            {autoMsg ? <p className="text-[15px] text-muted-2" aria-live="polite">{autoMsg}</p> : null}
          </>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="np-when" className="mono text-muted-2">
          when
        </label>
        <input id="np-when" type="datetime-local" value={local} onChange={(e) => setLocal(e.target.value)} className={`${field} [color-scheme:dark]`} aria-invalid={!!fe.startsAt} aria-describedby={fe.startsAt ? "np-when-e" : undefined} />
        <input type="hidden" name="startsAt" value={iso} />
        {fe.startsAt ? <p id="np-when-e" className="mono text-lavender">{fe.startsAt}</p> : null}
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="mono mb-3 text-muted-2">the group</legend>
        <Stepper value={total} label="total group, you included" onLess={lessTotal} onMore={moreTotal} lessLabel="smaller group" moreLabel="bigger group" />
        <Stepper value={spots} label="open spots for your mutuals" accent onLess={lessSpots} onMore={moreSpots} lessLabel="fewer open spots" moreLabel="more open spots" />
        <input type="hidden" name="openSpots" value={spots} />
        <input type="hidden" name="bringing" value={bringing} />
        <Stepper
          value={minShown}
          label="minimum to happen, you included"
          onLess={() => setMinPeople(Math.max(3, minShown - 1))}
          onMore={() => setMinPeople(Math.min(total, minShown + 1))}
          lessLabel="lower minimum"
          moreLabel="higher minimum"
        />
        <input type="hidden" name="minPeople" value={minShown} />
        <p className="text-[15px] text-muted">
          {bringing > 0
            ? `you + ${bringing} ${bringing === 1 ? "friend" : "friends"} already coming · ${spots} open to mutuals`
            : `just you so far · ${spots} open to mutuals`}
        </p>
        {warn ? (
          <p role="alert" className="rounded-2xl border border-lavender/40 px-4 py-3 text-[15px] text-lavender">
            {warn === "min"
              ? "plans start at 3: you plus at least 2."
              : `with ${total} people you can open up to ${total - 1} spots. one of them is you.`}
          </p>
        ) : null}
        <p className="text-[15px] text-muted-2">it&apos;s confirmed when {minShown} are in. if it doesn&apos;t get there by start time, it quietly doesn&apos;t happen.</p>
        {fe.openSpots ? <p className="mono text-lavender">{fe.openSpots}</p> : null}
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="mono mb-3 text-muted-2">price (optional)</legend>
        <div className="flex flex-wrap gap-2">
          {PRICES.map((p) => (
            <label key={p.v} className="cursor-pointer">
              <input type="radio" name="priceLevel" value={p.v} checked={price === p.v} onChange={() => setPrice(p.v)} onClick={() => price === p.v && setPrice("")} className="peer sr-only" />
              <span className="mono flex min-h-11 min-w-14 items-center justify-center rounded-full border border-line px-4 text-bone transition-colors peer-checked:border-lavender peer-checked:bg-lavender peer-checked:text-ink peer-focus-visible:ring-2 peer-focus-visible:ring-lavender">
                {p.label}
              </span>
            </label>
          ))}
        </div>
        <label htmlFor="np-cost" className="sr-only">cost note</label>
        <input id="np-cost" name="costNote" value={costNote} maxLength={80} onChange={(e) => setCostNote(e.target.value)} placeholder="about $40 each, tickets $25…" className={field} />
        {fe.costNote ? <p className="mono text-lavender">{fe.costNote}</p> : null}
      </fieldset>

      <div className="flex flex-col gap-2">
        <label htmlFor="np-note" className="mono text-muted-2">
          a line for your mutuals (optional)
        </label>
        <textarea id="np-note" name="note" rows={3} maxLength={280} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Got a table for 4 at Monkey Bar? Open 3 spots to your mutuals." className={`${field} resize-none`} />
        {fe.note ? <p className="mono text-lavender">{fe.note}</p> : null}
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-line p-4 text-[15px] text-muted">
        <p>
          only your mutuals see this plan. {showHost ? "your first name shows on the share link." : "they see \u201csomeone is hosting,\u201d never your name,"} and nobody sees who else is in until it starts.
        </p>
        <label className="flex min-h-11 cursor-pointer items-center justify-between gap-4">
          <span className="text-bone">show my name on the share link</span>
          <input type="checkbox" name="showHost" checked={showHost} onChange={(e) => setShowHost(e.target.checked)} className="peer sr-only" />
          <span aria-hidden="true" className="relative h-7 w-12 shrink-0 rounded-full border border-line bg-ink-2 transition-colors after:absolute after:left-1 after:top-1 after:h-[18px] after:w-[18px] after:rounded-full after:bg-muted after:transition-transform peer-checked:bg-lavender peer-checked:after:translate-x-5 peer-checked:after:bg-ink peer-focus-visible:ring-2 peer-focus-visible:ring-lavender" />
        </label>
      </div>

      {state.error ? (
        <p role="alert" className="mono text-lavender">
          {state.error}
        </p>
      ) : null}

      <button type="submit" disabled={pending} className="mono min-h-14 rounded-full bg-bordeaux px-8 text-[15px] text-bone transition-colors hover:bg-lavender hover:text-ink disabled:opacity-60">
        {pending ? "posting…" : `open ${spots} ${spots === 1 ? "spot" : "spots"} to your mutuals`}
      </button>
    </form>
  );
}

function Stepper({ value, label, accent, onLess, onMore, lessLabel, moreLabel }: {
  value: number; label: string; accent?: boolean; onLess: () => void; onMore: () => void; lessLabel: string; moreLabel: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-line bg-ink-2 px-4 py-3">
      <div>
        <p className={`display text-[2.5rem] leading-none ${accent ? "text-lavender" : ""}`} aria-live="polite">{value}</p>
        <p className="mono mt-1 text-muted-2">{label}</p>
      </div>
      <div className="flex gap-2">
        <button type="button" aria-label={lessLabel} onClick={onLess} className="flex h-12 w-12 items-center justify-center rounded-full border border-line text-[22px] hover:border-lavender">
          −
        </button>
        <button type="button" aria-label={moreLabel} onClick={onMore} className="flex h-12 w-12 items-center justify-center rounded-full border border-line text-[22px] hover:border-lavender">
          +
        </button>
      </div>
    </div>
  );
}
