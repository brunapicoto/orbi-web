import Link from "next/link";
import { KindIcon } from "@/components/app/KindIcon";
import { RatingLine, Star } from "@/components/app/Rating";
import { KINDS, formatWhen, kindLabel, planLabel } from "@/lib/app/kinds";
import { requireMe } from "@/lib/app/session";
import type { ExperienceSummary } from "@/lib/app/types";

export const dynamic = "force-dynamic";

/**
 * Memories: yours and your network's. Filter by an activity or a place to see how those experiences
 * were rated across your network: one overall score on top, each experience with its own below.
 */
export default async function Memories({ searchParams }: { searchParams: Promise<{ kind?: string; place?: string; q?: string }> }) {
  const { store } = await requireMe("/app/memories");
  const { kind, place, q } = await searchParams;
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

  // what's shown: one place (its memories), one activity, a search, or everything
  const shown = placeKey
    ? items.filter((p) => p.placeKey === placeKey)
    : active
      ? items.filter((p) => p.kind === active)
      : query
        ? items.filter((p) => p.place.toLowerCase().includes(query))
        : items;
  const placeHits = query ? [...places].filter(([k, name]) => k.includes(query) || name.toLowerCase().includes(query)).slice(0, 8) : [];
  const summary: ExperienceSummary | null =
    placeKey || active ? await store.experienceSummary({ place: placeKey ?? undefined, kind: active ?? undefined }) : null;

  const covers = new Map(
    await Promise.all(
      shown.map(async (p) => [p.key, (await (p.source === "plan" ? store.photos(p.id) : store.memoryPhotos(p.id)))[0]?.url ?? null] as const),
    ),
  );

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-2">
        <p className="mono text-muted-2">memories</p>
        <h1 className="display text-[3rem]">the plans that actually happened.</h1>
        <p className="text-[16px] text-muted">no likes, no comments. yours, and the ones from your network. people who were there rate the experience, anonymously.</p>
        <Link href="/app/memories/new" className="mono mt-2 inline-flex min-h-12 items-center self-start rounded-full border border-lavender/60 px-5 text-lavender hover:bg-lavender hover:text-ink">
          + add a memory
        </Link>
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
