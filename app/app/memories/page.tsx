import Link from "next/link";
import { KindIcon } from "@/components/app/KindIcon";
import { RatingLine, Star } from "@/components/app/Rating";
import { KINDS, TIME_ZONE, formatWhen, kindLabel, planLabel } from "@/lib/app/kinds";
import { requireMe } from "@/lib/app/session";
import type { ExperienceSummary } from "@/lib/app/types";

export const dynamic = "force-dynamic";

/**
 * Memories: yours and your network's. Filter by an activity or a place to see how those experiences
 * were rated across your network: one overall score on top, each experience with its own below.
 */
type Search = { kind?: string; place?: string; q?: string; with?: string; occ?: string; hood?: string; browse?: string; view?: string; from?: string; to?: string; by?: string };

export default async function Memories({ searchParams }: { searchParams: Promise<Search> }) {
  const { store } = await requireMe("/app/memories");
  const sp = await searchParams;
  if (sp.view === "popular") return <Popular store={store} sp={sp} />;
  const { kind, place, q } = sp;
  const [plans, added, invites] = await Promise.all([store.plans(), store.memories(), store.memoryInvites()]);

  // places you can see, by key, with a readable name
  const places = new Map<string, string>();
  for (const m of added) if (!places.has(m.placeKey)) places.set(m.placeKey, m.place.split(",")[0].trim());
  const placeKey = place && places.has(place) ? place : null;
  const query = (q ?? "").trim().toLowerCase().slice(0, 60);

  // plans that happened through orbi, and memories added by hand, newest first
  const items: Item[] = [
    ...plans
      .filter((p) => p.status === "past" && (p.isHost || p.joined))
      .map((p) => ({ key: `p-${p.id}`, id: p.id, href: `/app/plan/${p.id}`, kind: p.kind, topic: p.topic, place: p.title || p.place, placeKey: null, when: p.startsAt, whenLabel: formatWhen(p.startsAt), count: `${p.taken + 1 + p.bringing} were there`, source: "plan" as const, rating: null, ratings: null })),
    ...added.map((m) => ({
      key: `m-${m.id}`, id: m.id, href: `/app/memories/${m.id}`, kind: m.kind, topic: null, place: m.place, placeKey: m.placeKey, when: `${m.happenedOn}T12:00:00`, whenLabel: dayLabel(m.happenedOn),
      count: `${m.inIt ? "" : "from your network · "}${m.withNames.length ? `with ${m.withNames.map((n) => n.toLowerCase()).join(", ")}` : "added by you"}`,
      source: "memory" as const, inIt: m.inIt, rating: m.rating, ratings: m.ratings,
    })),
  ].sort((a, b) => b.when.localeCompare(a.when));
  const kindsHere = KINDS.filter((k) => items.some((p) => p.kind === k.id));
  const active = !placeKey && kind && kindsHere.some((k) => k.id === kind) ? kind : null;

  // browse by people, occasions and neighborhoods (people are never rated)
  const people = new Map<string, { name: string; n: number }>();
  const occasions = new Map<string, number>();
  const hoods = new Map<string, number>();
  for (const m of added) {
    m.withIds.forEach((id, i) => people.set(id, { name: m.withNames[i] ?? "", n: (people.get(id)?.n ?? 0) + 1 }));
    if (m.occasion) occasions.set(m.occasion, (occasions.get(m.occasion) ?? 0) + 1);
    if (m.neighborhood) hoods.set(m.neighborhood, (hoods.get(m.neighborhood) ?? 0) + 1);
  }
  const withId = sp.with && people.has(sp.with) ? sp.with : null;
  const occ = sp.occ && occasions.has(sp.occ) ? sp.occ : null;
  const hood = sp.hood && hoods.has(sp.hood) ? sp.hood : null;
  const byMemory = new Map(added.map((m) => [m.id, m]));
  const browse = (["places", "people", "occasions", "neighborhoods"] as const).find((b) => b === sp.browse) ?? null;

  // what's shown: one place (its memories), one activity, a search, or everything
  const shown = withId
    ? items.filter((p) => byMemory.get(p.id)?.withIds.includes(withId))
    : occ
      ? items.filter((p) => byMemory.get(p.id)?.occasion === occ)
      : hood
        ? items.filter((p) => byMemory.get(p.id)?.neighborhood === hood)
        : placeKey
    ? items.filter((p) => p.placeKey === placeKey)
    : active
      ? items.filter((p) => p.kind === active)
      : query
        ? items.filter((p) => p.place.toLowerCase().includes(query))
        : items;
  const placeHits = query ? [...places].filter(([k, name]) => k.includes(query) || name.toLowerCase().includes(query)).slice(0, 8) : [];
  const summary: ExperienceSummary | null =
    placeKey || active ? await store.experienceSummary({ place: placeKey ?? undefined, kind: active ?? undefined }) : null;

  const photoLists = new Map(
    await Promise.all(shown.map(async (p) => [p.key, await (p.source === "plan" ? store.photos(p.id) : store.memoryPhotos(p.id))] as const)),
  );
  const covers = new Map([...photoLists].map(([k, list]) => [k, list[0]?.url ?? null]));
  const browseValues: [string, string, number][] =
    browse === "places"
      ? [...places].map(([k, name]) => [`place=${encodeURIComponent(k)}`, name.toLowerCase(), added.filter((m) => m.placeKey === k).length])
      : browse === "people"
        ? [...people].map(([id, v]) => [`with=${id}`, v.name.toLowerCase(), v.n])
        : browse === "occasions"
          ? [...occasions].map(([o, n]) => [`occ=${encodeURIComponent(o)}`, o, n])
          : browse === "neighborhoods"
            ? [...hoods].map(([h, n]) => [`hood=${encodeURIComponent(h)}`, h, n])
            : [];

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-3">
        <p className="mono text-[11px] uppercase tracking-widest text-muted-2">the wall · what actually happened</p>
        <h1 className="display text-[3.2rem]">memories from the city.</h1>
        <p className="text-[16px] text-muted">
          {added.length + items.filter((i) => i.source === "plan").length} plans that actually happened. no likes, no comments. people who were there rate the experience, anonymously. never the people.
        </p>
        <div className="mt-1 flex flex-wrap gap-2">
          <Link href="/app/memories/new" className="mono inline-flex min-h-12 items-center rounded-full border border-lavender/60 px-5 text-lavender hover:bg-lavender hover:text-ink">
            + add a memory
          </Link>
          <Link href="/app/memories?view=popular" className="mono inline-flex min-h-12 items-center rounded-full bg-bone px-5 text-ink hover:bg-lavender">
            popular this week →
          </Link>
        </div>
      </header>

      {invites.length ? (
        <ul className="flex flex-col gap-3" aria-label="memories waiting for you">
          {invites.map((i) => (
            <li key={i.id}>
              <Link href={`/app/memories/${i.id}`} className="flex items-center justify-between gap-4 rounded-3xl bg-bordeaux px-5 py-4 hover:bg-bordeaux/80">
                <span className="text-bone">
                  {i.fromName.toLowerCase()} added a memory with you · <span className="text-lavender-soft">{i.place}</span>
                </span>
                <span className="mono shrink-0 text-lavender">see it</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex flex-col gap-4">
        <form action="/app/memories" role="search" className="flex gap-2">
          <label htmlFor="mem-q" className="sr-only">search a place</label>
          <input
            id="mem-q"
            name="q"
            defaultValue={placeKey ? "" : q ?? ""}
            placeholder="search a place: via carota, central park…"
            className="min-h-12 w-full min-w-0 rounded-full border border-line bg-ink-2 px-5 text-[16px] text-bone placeholder:text-muted-2 outline-none focus-visible:border-lavender focus-visible:ring-2 focus-visible:ring-lavender"
          />
          <button type="submit" className="mono min-h-12 shrink-0 rounded-full bg-bone px-5 text-[13px] text-ink hover:bg-lavender">
            search
          </button>
        </form>
        {placeHits.length ? (
          <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]" aria-label="places">
            {placeHits.map(([k, name]) => (
              <FilterChip key={k} href={`/app/memories?place=${encodeURIComponent(k)}`} active={false} label={name.toLowerCase()} />
            ))}
          </div>
        ) : null}
        <div className="flex flex-col gap-2">
          <span className="mono text-[11px] uppercase tracking-widest text-muted-2">browse by</span>
          <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
            {([["places", places.size], ["people", people.size], ["occasions", occasions.size], ["neighborhoods", hoods.size]] as const).map(([b, n]) => (
              <FilterChip key={b} href={browse === b ? "/app/memories" : `/app/memories?browse=${b}`} active={browse === b} label={`${b} ${n}`} />
            ))}
          </div>
          {browseValues.length ? (
            <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
              {browseValues.map(([qs, label, n]) => (
                <FilterChip key={qs} href={`/app/memories?${qs}`} active={false} label={`${label} · ${n}`} />
              ))}
            </div>
          ) : null}
          {withId || occ || hood ? (
            <p className="mono text-lavender">
              {withId ? `with ${people.get(withId)!.name.toLowerCase()}` : occ ? `for ${occ}` : `in ${hood}`} · {shown.length} {shown.length === 1 ? "memory" : "memories"}{" "}
              <Link href="/app/memories" className="link-draw text-muted-2">clear</Link>
            </p>
          ) : null}
        </div>
        {kindsHere.length > 1 ? (
          <nav aria-label="filter memories by activity" className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
            <FilterChip href="/app/memories" active={!active && !placeKey && !query} label="everything" />
            {kindsHere.map((k) => (
              <FilterChip key={k.id} href={`/app/memories?kind=${k.id}`} active={active === k.id} label={k.label} kind={k.id} />
            ))}
          </nav>
        ) : null}
      </div>

      {summary ? (
        <Discovery
          title={placeKey ? places.get(placeKey)!.toLowerCase() : kindLabel(active!)}
          kind={placeKey ? null : active}
          summary={summary}
          scope={placeKey ? "at this place" : "of this kind"}
        />
      ) : null}

      {shown.length ? (
        <ul className="flex flex-col gap-4">
          {shown.map((p) => {
            const cover = covers.get(p.key);
            return (
              <li key={p.key}>
                <Link href={p.href} className="group block overflow-hidden rounded-3xl bg-ink-2 ring-1 ring-line ring-inset hover:ring-lavender/50">
                  <div className="relative flex aspect-square items-end overflow-hidden bg-bordeaux">
                    {cover ? (
                      // signed, short-lived urls: next/image can't cache them
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cover} alt={`photo from ${p.place}`} className="absolute inset-0 h-full w-full object-cover [filter:saturate(.85)]" />
                    ) : (
                      <KindIcon kind={p.kind} className="absolute right-6 top-6 h-14 w-14 text-lavender-soft/80" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
                    {(photoLists.get(p.key)?.length ?? 0) > 1 ? (
                      <span className="mono absolute right-4 top-4 rounded-full bg-ink/70 px-2.5 py-1 text-[11px] text-lavender-soft">1/{photoLists.get(p.key)!.length}</span>
                    ) : null}
                    <div className="relative flex flex-col gap-1 p-5">
                      <span className="mono text-lavender-soft">{p.whenLabel}</span>
                      <span className="display text-[2rem] leading-none text-bone">{p.place}</span>
                      {p.rating != null ? <RatingLine rating={p.rating} ratings={p.ratings} className="mt-1 text-[13px]" /> : null}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 px-5 py-3.5">
                    <span className="mono flex shrink-0 items-center gap-2 text-lavender">
                      <KindIcon kind={p.kind} className="h-4 w-4" />
                      {planLabel(p)}
                    </span>
                    <span className="mono truncate text-muted-2">
                      {p.count}
                      {cover || p.inIt === false ? "" : " · add a photo"}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-muted">
          {query || placeKey || active
            ? "nothing here yet."
            : "nothing here yet. after your first plan it shows up here, or add a memory of something that already happened."}
        </p>
      )}
    </div>
  );
}

/** The top of a filtered view: one score for a place or an activity, from everyone who was there. */
function Discovery({ title, kind, summary, scope }: { title: string; kind: string | null; summary: ExperienceSummary; scope: string }) {
  const scored = summary.average != null && summary.ratings;
  return (
    <section aria-label={`${title}, overall`} className="flex flex-col gap-4 rounded-3xl bg-ink-2 p-6 ring-1 ring-line ring-inset">
      <span className="mono flex items-center gap-2 text-lavender">
        {kind ? <KindIcon kind={kind} className="h-4 w-4" /> : null}
        in your network
      </span>
      <h2 className="display text-[2.5rem] leading-[0.95]">{title}</h2>
      {scored ? (
        <p className="flex items-end gap-3">
          <span className="display text-[4.5rem] leading-[0.8] text-lavender">{summary.average!.toFixed(1)}</span>
          <span className="mono flex items-center gap-1 pb-1 text-muted">
            <Star filled className="h-4 w-4 text-lavender" />
            /5
          </span>
        </p>
      ) : null}
      <p className="mono text-muted-2">
        {scored ? `${summary.ratings} ${summary.ratings === 1 ? "rating" : "ratings"} · ` : ""}
        {summary.experiences} {summary.experiences === 1 ? "experience" : "experiences"}
      </p>
      <p className="text-[14px] text-muted-2">
        {scored
          ? `every rating from people who were there, ${scope}, counts once. it's about the experiences in your network, not a score of the place or of anyone.`
          : "the score shows once 3 different people who were there have rated."}
      </p>
    </section>
  );
}

type Item = {
  key: string; id: string; href: string; kind: string; topic: string | null; place: string; placeKey: string | null; when: string; whenLabel: string;
  count: string; source: "plan" | "memory"; inIt?: boolean; rating: number | null; ratings: number | null;
};

const dayLabel = (d: string) =>
  new Date(`${d}T12:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }).toLowerCase().replace(",", " ·");

function FilterChip({ href, active, label, kind }: { href: string; active: boolean; label: string; kind?: string }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "true" : undefined}
      className={`mono flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-[13px] ${
        active ? "border-lavender bg-lavender text-ink" : "border-line text-bone hover:border-lavender"
      }`}
    >
      {kind ? <KindIcon kind={kind} className="h-4 w-4" /> : null}
      {label}
    </Link>
  );
}

/** what's popular between two days: places or activities ranked by how many experiences happened, never people */
async function Popular({ store, sp }: { store: Awaited<ReturnType<typeof requireMe>>["store"]; sp: Search }) {
  const day = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: TIME_ZONE });
  const today = new Date();
  const weekAgo = new Date(today.getTime() - 6 * 86400_000);
  const valid = (v?: string) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);
  let from = valid(sp.from) ?? day(weekAgo);
  let to = valid(sp.to) ?? day(today);
  if (from > to) [from, to] = [to, from];
  const by = sp.by === "kind" ? "kind" : "place";
  const rows = await store.popular(from, to, by);
  const ranges = [
    { label: "this week", from: day(weekAgo), to: day(today) },
    { label: "this month", from: day(new Date(today.getTime() - 29 * 86400_000)), to: day(today) },
    { label: "last 3 months", from: day(new Date(today.getTime() - 89 * 86400_000)), to: day(today) },
  ];
  const link = (o: Partial<{ from: string; to: string; by: string }>) =>
    `/app/memories?view=popular&from=${o.from ?? from}&to=${o.to ?? to}&by=${o.by ?? by}`;
  const pretty = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" }).toLowerCase();

  return (
    <div className="flex flex-col gap-8">
      <Link href="/app/memories" className="mono link-draw self-start text-muted-2">← memories</Link>
      <header className="flex flex-col gap-3">
        <p className="mono text-[11px] uppercase tracking-widest text-muted-2">in your network · {pretty(from)} to {pretty(to)}</p>
        <h1 className="display text-[3.2rem]">what&apos;s popular.</h1>
        <p className="text-[16px] text-muted">the places and plans people in your network actually went to, by how many times. a score shows once 3 people who were there have rated.</p>
      </header>

      <div className="flex flex-col gap-3">
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
          {ranges.map((r) => (
            <FilterChip key={r.label} href={link({ from: r.from, to: r.to })} active={r.from === from && r.to === to} label={r.label} />
          ))}
        </div>
        <form action="/app/memories" className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="view" value="popular" />
          <input type="hidden" name="by" value={by} />
          <label className="flex flex-col gap-1">
            <span className="mono text-[11px] text-muted-2">from</span>
            <input type="date" name="from" defaultValue={from} max={day(today)} className="min-h-11 rounded-full border border-line bg-ink-2 px-4 text-[15px] text-bone [color-scheme:dark]" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="mono text-[11px] text-muted-2">to</span>
            <input type="date" name="to" defaultValue={to} max={day(today)} className="min-h-11 rounded-full border border-line bg-ink-2 px-4 text-[15px] text-bone [color-scheme:dark]" />
          </label>
          <button type="submit" className="mono min-h-11 rounded-full bg-bone px-5 text-[13px] text-ink hover:bg-lavender">see</button>
        </form>
        <div className="flex gap-1 self-start rounded-full border border-line p-1" role="group" aria-label="group by">
          <Link href={link({ by: "place" })} aria-current={by === "place" ? "true" : undefined} className={`mono rounded-full px-4 py-2 text-[12px] ${by === "place" ? "bg-bone text-ink" : "text-muted-2 hover:text-bone"}`}>places</Link>
          <Link href={link({ by: "kind" })} aria-current={by === "kind" ? "true" : undefined} className={`mono rounded-full px-4 py-2 text-[12px] ${by === "kind" ? "bg-bone text-ink" : "text-muted-2 hover:text-bone"}`}>activities</Link>
        </div>
      </div>

      {rows.length ? (
        <ol className="flex flex-col divide-y divide-line overflow-hidden rounded-3xl bg-ink-2 ring-1 ring-line ring-inset">
          {rows.map((r, i) => (
            <li key={r.key}>
              <Link
                href={by === "kind" ? `/app/memories?kind=${encodeURIComponent(r.key)}` : `/app/memories?place=${encodeURIComponent(r.key)}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-ink"
              >
                <span className="display w-8 shrink-0 text-[1.8rem] text-lavender">{i + 1}</span>
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="display truncate text-[1.5rem] leading-tight">{by === "kind" ? kindLabel(r.key) : r.label.toLowerCase()}</span>
                  <span className="mono flex items-center gap-1.5 text-[12px] text-muted-2">
                    <KindIcon kind={r.kind} className="h-3.5 w-3.5" />
                    {r.experiences} {r.experiences === 1 ? "time" : "times"}
                  </span>
                </span>
                {r.average != null ? <RatingLine rating={r.average} ratings={r.ratings} className="shrink-0 text-[12px]" /> : null}
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-muted">nothing in your network between these days yet.</p>
      )}
    </div>
  );
}
