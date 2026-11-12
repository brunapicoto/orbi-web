import Link from "next/link";
import { KindIcon } from "@/components/app/KindIcon";
import { KINDS, formatWhen, kindLabel } from "@/lib/app/kinds";
import { requireMe } from "@/lib/app/session";

export const dynamic = "force-dynamic";

export default async function Memories({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const { store } = await requireMe("/app/memories");
  const { kind } = await searchParams;
  const past = (await store.plans()).filter((p) => p.status === "past" && (p.isHost || p.joined)).reverse();
  const kindsHere = KINDS.filter((k) => past.some((p) => p.kind === k.id));
  const active = kind && kindsHere.some((k) => k.id === kind) ? kind : null;
  const shown = active ? past.filter((p) => p.kind === active) : past;
  const covers = new Map(await Promise.all(shown.map(async (p) => [p.id, (await store.photos(p.id))[0]?.url ?? null] as const)));

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-2">
        <p className="mono text-muted-2">memories</p>
        <h1 className="display text-[3rem]">the plans that actually happened.</h1>
        <p className="text-[16px] text-muted">no likes, no comments. each one is visible only to the people who were there.</p>
      </header>

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
            const cover = covers.get(p.id);
            return (
              <li key={p.id}>
                <Link href={`/app/plan/${p.id}`} className="group block overflow-hidden rounded-3xl bg-ink-2 ring-1 ring-line ring-inset hover:ring-lavender/50">
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
                      <span className="mono text-lavender-soft">{formatWhen(p.startsAt)}</span>
                      <span className="display text-[2rem] leading-none text-bone">{p.place}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-5 py-3.5">
                    <span className="mono flex items-center gap-2 text-lavender">
                      <KindIcon kind={p.kind} className="h-4 w-4" />
                      {kindLabel(p.kind)}
                    </span>
                    <span className="mono text-muted-2">
                      {p.taken + 1 + p.bringing} were there{cover ? "" : " · add the photo"}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-muted">nothing here yet. after your first plan, it shows up here with the photo the group chose to keep.</p>
      )}
    </div>
  );
}

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
