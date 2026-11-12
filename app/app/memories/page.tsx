import Link from "next/link";
import { KindIcon } from "@/components/app/KindIcon";
import { KINDS, formatWhen, planLabel } from "@/lib/app/kinds";
import { requireMe } from "@/lib/app/session";

export const dynamic = "force-dynamic";

export default async function Memories({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const { store } = await requireMe("/app/memories");
  const { kind } = await searchParams;
  const [plans, added, invites] = await Promise.all([store.plans(), store.memories(), store.memoryInvites()]);
  // plans that happened through orbi, and memories added by hand, newest first
  const items: Item[] = [
    ...plans
      .filter((p) => p.status === "past" && (p.isHost || p.joined))
      .map((p) => ({ key: `p-${p.id}`, id: p.id, href: `/app/plan/${p.id}`, kind: p.kind, topic: p.topic, place: p.place, when: p.startsAt, whenLabel: formatWhen(p.startsAt), count: `${p.taken + 1 + p.bringing} were there`, source: "plan" as const })),
    ...added.map((m) => ({ key: `m-${m.id}`, id: m.id, href: `/app/memories/${m.id}`, kind: m.kind, topic: null, place: m.place, when: `${m.happenedOn}T12:00:00`, whenLabel: dayLabel(m.happenedOn), count: m.withNames.length ? `with ${m.withNames.map((n) => n.toLowerCase()).join(", ")}` : "added by you", source: "memory" as const })),
  ].sort((a, b) => b.when.localeCompare(a.when));
  const kindsHere = KINDS.filter((k) => items.some((p) => p.kind === k.id));
  const active = kind && kindsHere.some((k) => k.id === kind) ? kind : null;
  const shown = active ? items.filter((p) => p.kind === active) : items;
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
        <p className="text-[16px] text-muted">no likes, no comments. each one is visible only to the people who were there.</p>
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

      {kindsHere.length > 1 ? (
        <nav aria-label="filter memories by type" className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
          <FilterChip href="/app/memories" active={!active} label="everything" />
          {kindsHere.map((k) => (
            <FilterChip key={k.id} href={`/app/memories?kind=${k.id}`} active={active === k.id} label={k.label} kind={k.id} />
          ))}
        </nav>
      ) : null}

      {shown.length ? (
        <ul className="flex flex-col gap-4">
          {shown.map((p) => {
            const cover = covers.get(p.key);
            return (
              <li key={p.key}>
                <Link href={p.href} className="group block overflow-hidden rounded-3xl bg-ink-2 ring-1 ring-line ring-inset hover:ring-lavender/50">
                  <div className="relative flex aspect-[4/3] items-end overflow-hidden bg-bordeaux">
                    {cover ? (
                      // signed, short-lived urls: next/image can't cache them
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cover} alt={`group photo from ${p.place}`} className="absolute inset-0 h-full w-full object-cover [filter:saturate(.85)]" />
                    ) : (
                      <KindIcon kind={p.kind} className="absolute right-6 top-6 h-14 w-14 text-lavender-soft/80" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
                    <div className="relative flex flex-col gap-1 p-5">
                      <span className="mono text-lavender-soft">{p.whenLabel}</span>
                      <span className="display text-[2rem] leading-none text-bone">{p.place}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-5 py-3.5">
                    <span className="mono flex items-center gap-2 text-lavender">
                      <KindIcon kind={p.kind} className="h-4 w-4" />
                      {planLabel(p)}
                    </span>
                    <span className="mono text-muted-2">
                      {p.count}{cover ? "" : " · add a photo"}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-muted">nothing here yet. after your first plan it shows up here, or add a memory of something that already happened.</p>
      )}
    </div>
  );
}

type Item = {
  key: string; id: string; href: string; kind: string; topic: string | null; place: string; when: string; whenLabel: string; count: string; source: "plan" | "memory";
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
