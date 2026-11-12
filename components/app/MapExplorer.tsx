"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { KindIcon } from "@/components/app/KindIcon";
import { ViewToggle } from "@/components/app/ViewToggle";
import { PlansMap } from "@/components/app/map";
import type { Bounds } from "@/components/app/map/PlansMap";
import { CATEGORIES, categoryOf } from "@/lib/app/categories";
import { TIME_ZONE, formatWhen } from "@/lib/app/kinds";
import { PRICE_LABELS } from "@/lib/app/planText";
import type { PlanView } from "@/lib/app/types";

const WHEN = [
  { id: "today", label: "today" },
  { id: "tomorrow", label: "tomorrow" },
  { id: "week", label: "this week" },
  { id: "weekend", label: "weekend" },
] as const;
const STATUS = [
  { id: "needs", label: "needs people" },
  { id: "almost", label: "almost there" },
  { id: "confirmed", label: "confirmed" },
] as const;
const PRICE = [
  { id: "1", label: "$" },
  { id: "2", label: "$$" },
  { id: "3", label: "$$$" },
  { id: "0", label: "free" },
] as const;

type Filters = { cat: string | null; when: string | null; price: string | null; status: string | null };

const going = (p: PlanView) => p.taken + 1 + p.bringing;
function stage(p: PlanView) {
  if (p.status === "on" || p.status === "live") return "confirmed";
  return p.minPeople - going(p) <= 1 ? "almost" : "needs";
}

/** "YYYY-MM-DD" and weekday (0 sun) in New York */
function nyDay(d: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit", weekday: "short" }).formatToParts(d);
  const get = (t: string) => parts.find((x) => x.type === t)?.value ?? "";
  return { ymd: `${get("year")}-${get("month")}-${get("day")}`, dow: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday")) };
}
function matchesWhen(iso: string, when: string, now: Date) {
  const d = nyDay(new Date(iso));
  const today = nyDay(now);
  const dayMs = 86400_000;
  if (when === "today") return d.ymd === today.ymd;
  if (when === "tomorrow") return d.ymd === nyDay(new Date(now.getTime() + dayMs)).ymd;
  // this week: today through sunday
  const untilSunday = (7 - today.dow) % 7;
  const inWeek = Array.from({ length: untilSunday + 1 }, (_, i) => nyDay(new Date(now.getTime() + i * dayMs)).ymd);
  if (when === "week") return inWeek.includes(d.ymd);
  // weekend: the coming (or current) fri evening to sun
  const daysToFri = (5 - today.dow + 7) % 7;
  const start = today.dow === 6 || today.dow === 0 ? 0 : daysToFri;
  const end = today.dow === 0 ? 0 : today.dow === 6 ? 1 : daysToFri + 2;
  const days = Array.from({ length: end - start + 1 }, (_, i) => nyDay(new Date(now.getTime() + (start + i) * dayMs)).ymd);
  const hour = Number(new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, hour: "numeric", hour12: false }).format(new Date(iso)));
  return days.includes(d.ymd) && (d.dow !== 5 || hour >= 17);
}

export function MapExplorer({ plans, demo }: { plans: PlanView[]; demo: boolean }) {
  const [f, setF] = useState<Filters>({ cat: null, when: null, price: null, status: null });
  const [bounds, setBounds] = useState<Bounds | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [sheet, setSheet] = useState<"peek" | "open">("peek");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const now = useMemo(() => new Date(), []);

  // the same filters drive the map and the list
  const filtered = useMemo(
    () =>
      plans.filter(
        (p) =>
          (!f.cat || categoryOf(p.kind).id === f.cat) &&
          (!f.when || matchesWhen(p.startsAt, f.when, now)) &&
          (!f.price || String(p.priceLevel) === f.price) &&
          (!f.status || stage(p) === f.status),
      ),
    [plans, f, now],
  );
  const pinned = filtered.filter((p) => p.lat !== null && p.lng !== null);
  const inView = bounds
    ? pinned.filter((p) => p.lat! >= bounds.south && p.lat! <= bounds.north && p.lng! >= bounds.west && p.lng! <= bounds.east)
    : pinned;
  const noPin = filtered.filter((p) => p.lat === null || p.lng === null);
  const sel = selected ? filtered.find((p) => p.id === selected) ?? null : null;
  const activeCount = Object.values(f).filter(Boolean).length;
  const set = (k: keyof Filters, v: string) => setF((o) => ({ ...o, [k]: o[k] === v ? null : v }));
  const fitKey = JSON.stringify(f);

  return (
    <div className={`fixed inset-x-0 bottom-[68px] z-30 flex flex-col md:flex-row-reverse ${demo ? "top-[32px]" : "top-0"}`}>
      {/* map */}
      <div className="relative min-h-0 flex-1">
        <PlansMap
          plans={pinned.map((p) => ({ id: p.id, lat: p.lat!, lng: p.lng!, kind: p.kind, label: p.title || p.place }))}
          selected={selected}
          onSelect={(id) => {
            setSelected(id);
            if (id) setSheet("peek");
          }}
          onMove={setBounds}
          fitKey={fitKey}
        />
        {/* top bar over the map */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] flex flex-col gap-2 p-3" style={{ paddingTop: demo ? undefined : "max(12px, env(safe-area-inset-top, 0px))" }}>
          <div className="pointer-events-auto flex items-center justify-between gap-2">
            <ViewToggle current="map" />
            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              aria-expanded={filtersOpen}
              aria-controls="map-filters"
              className="mono rounded-full border border-line bg-ink/90 px-4 py-2 text-[12px] text-bone backdrop-blur-md"
            >
              filters{activeCount ? ` · ${activeCount}` : ""}
            </button>
          </div>
          <div className="pointer-events-auto -mx-3 flex gap-2 overflow-x-auto px-3 pb-1 [scrollbar-width:none]" role="group" aria-label="category">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={f.cat === c.id}
                onClick={() => set("cat", c.id)}
                className={`mono flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-[12px] backdrop-blur-md ${f.cat === c.id ? "border-bone bg-bone text-ink" : "border-line bg-ink/90 text-bone"}`}
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} aria-hidden="true" />
                {c.label}
              </button>
            ))}
          </div>
          {filtersOpen ? (
            <div id="map-filters" className="pointer-events-auto flex flex-col gap-3 rounded-2xl border border-line bg-ink/95 p-4 backdrop-blur-md">
              <FilterRow label="when" items={WHEN} value={f.when} onPick={(v) => set("when", v)} />
              <FilterRow label="price" items={PRICE} value={f.price} onPick={(v) => set("price", v)} />
              <FilterRow label="status" items={STATUS} value={f.status} onPick={(v) => set("status", v)} />
              {activeCount ? (
                <button type="button" onClick={() => setF({ cat: null, when: null, price: null, status: null })} className="mono self-start text-[12px] text-lavender">
                  clear filters
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
        {/* tapped pin */}
        {sel ? (
          <div className="absolute inset-x-3 bottom-3 z-[500] md:left-auto md:w-96">
            <PlanRow plan={sel} raised onClose={() => setSelected(null)} />
          </div>
        ) : null}
      </div>

      {/* list: a bottom sheet on phones, a side panel on larger screens */}
      <section
        aria-label="plans in this area"
        className={`flex min-h-0 flex-col border-t border-line bg-ink md:h-full md:w-[400px] md:border-r md:border-t-0 ${sheet === "open" ? "h-[62%]" : "h-[132px]"} transition-[height] duration-300 md:transition-none`}
      >
        <button
          type="button"
          onClick={() => setSheet((s) => (s === "open" ? "peek" : "open"))}
          aria-expanded={sheet === "open"}
          className="flex flex-col items-center gap-2 px-5 pb-2 pt-2.5 md:pointer-events-none md:items-start md:pt-5"
        >
          <span className="h-1 w-10 rounded-full bg-line md:hidden" aria-hidden="true" />
          <span className="flex w-full items-baseline justify-between gap-3">
            <span className="display text-[1.5rem]">
              {inView.length} {inView.length === 1 ? "plan" : "plans"} here
            </span>
            <span className="mono text-[12px] text-muted-2 md:hidden">{sheet === "open" ? "less" : "see list"}</span>
          </span>
        </button>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 md:block">
          {inView.length === 0 ? (
            <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-line p-5">
              <p className="text-muted">{activeCount ? "nothing matches here. try fewer filters or move the map." : "no plans in this area yet."}</p>
              <Link href="/app/new/link" className="mono self-start rounded-full bg-bordeaux px-5 py-3 text-[13px] text-bone hover:bg-lavender hover:text-ink">
                create the first plan here
              </Link>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {inView.map((p) => (
                <li key={p.id}>
                  <PlanRow plan={p} active={p.id === selected} />
                </li>
              ))}
            </ul>
          )}
          {noPin.length ? (
            <div className="mt-6 flex flex-col gap-3">
              <p className="mono text-muted-2">not on the map</p>
              <ul className="flex flex-col gap-3">
                {noPin.map((p) => (
                  <li key={p.id}>
                    <PlanRow plan={p} />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function FilterRow({ label, items, value, onPick }: { label: string; items: readonly { id: string; label: string }[]; value: string | null; onPick: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-2" role="group" aria-label={label}>
      <span className="mono text-[12px] text-muted-2">{label}</span>
      <div className="flex flex-wrap gap-2">
        {items.map((i) => (
          <button
            key={i.id}
            type="button"
            aria-pressed={value === i.id}
            onClick={() => onPick(i.id)}
            className={`mono min-h-10 rounded-full border px-3 text-[12px] ${value === i.id ? "border-lavender bg-lavender text-ink" : "border-line text-bone"}`}
          >
            {i.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function PlanRow({ plan, active, raised, onClose }: { plan: PlanView; active?: boolean; raised?: boolean; onClose?: () => void }) {
  const c = categoryOf(plan.kind);
  const st = stage(plan);
  const price = plan.priceLevel != null ? PRICE_LABELS[plan.priceLevel] : null;
  return (
    <div className={`relative flex gap-3 rounded-2xl bg-ink-2 p-4 ring-1 ring-inset ${active ? "ring-lavender" : "ring-line"} ${raised ? "shadow-2xl shadow-black/60" : ""}`}>
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: c.color, color: c.ink }} aria-hidden="true">
        <KindIcon kind={plan.kind} className="h-4 w-4" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Link href={`/app/plan/${plan.id}`} className="display text-[1.25rem] leading-tight text-bone after:absolute after:inset-0 [overflow-wrap:anywhere]">
          {plan.title || plan.place}
        </Link>
        <span className="truncate text-[14px] text-muted">
          {plan.title ? plan.place : plan.neighborhood ?? ""}
          {plan.title && plan.neighborhood ? ` · ${plan.neighborhood}` : ""}
        </span>
        <span className="mono flex flex-wrap gap-x-2 text-[12px] text-muted-2">
          <span>{formatWhen(plan.startsAt)}</span>
          {price ? <span>· {price}</span> : null}
        </span>
        <span className={`mono text-[12px] ${st === "confirmed" ? "text-lavender" : "text-lavender-soft"}`}>
          {st === "confirmed" ? "confirmed" : `${going(plan)} of ${plan.minPeople} in`}
          {st === "almost" ? " · almost there" : ""}
          {plan.joined ? " · you're in" : plan.isHost ? " · yours" : ""}
        </span>
      </div>
      {onClose ? (
        <button type="button" onClick={onClose} aria-label="close" className="relative z-10 -mr-1 -mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-2 hover:text-bone">
          ×
        </button>
      ) : null}
    </div>
  );
}
