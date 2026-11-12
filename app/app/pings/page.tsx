import Link from "next/link";
import { KindIcon } from "@/components/app/KindIcon";
import { formatWhen, planNoun } from "@/lib/app/kinds";
import { requireMe } from "@/lib/app/session";

export const dynamic = "force-dynamic";

type Ping = { key: string; href: string; kind: string; title: string; text: string };

/** The few things worth telling you, worked out from your plans. Nothing about who said yes. */
export default async function Pings() {
  const { store } = await requireMe("/app/pings");
  const [plans, invites] = await Promise.all([store.plans(), store.memoryInvites()]);
  const mine = plans.filter((p) => p.isHost || p.joined);
  const pings: Ping[] = [];

  for (const i of invites) {
    pings.push({ key: `mem-${i.id}`, href: `/app/memories/${i.id}`, kind: i.kind, title: `${i.fromName.toLowerCase()} added a memory with you`, text: `${i.place}. accept to keep it, or let it go. nothing is sent back.` });
  }
  for (const p of mine.filter((p) => p.status === "live")) {
    pings.push({ key: `live-${p.id}`, href: `/app/plan/${p.id}`, kind: p.kind, title: `it's starting: ${p.place}`, text: "the list is open. see who's here." });
  }
  for (const p of mine.filter((p) => p.status === "on")) {
    pings.push({ key: `on-${p.id}`, href: `/app/plan/${p.id}`, kind: p.kind, title: `${p.place} is on`, text: `it reached 3. names stay sealed until ${formatWhen(p.startsAt)}.` });
  }
  for (const p of mine.filter((p) => p.status === "open")) {
    const need = Math.max(0, 2 - p.taken - p.bringing);
    pings.push({
      key: `open-${p.id}`,
      href: `/app/plan/${p.id}`,
      kind: p.kind,
      title: p.isHost ? `your ${planNoun(p)} is out` : `you saved a spot at ${p.place}`,
      text: `${need} more ${need === 1 ? "yes" : "yeses"} and it's on. ${formatWhen(p.startsAt)}.`,
    });
  }
  const photoless = await Promise.all(
    mine.filter((p) => p.status === "past").slice(-3).map(async (p) => ((await store.photos(p.id)).length ? null : p)),
  );
  for (const p of photoless) {
    if (p) pings.push({ key: `photo-${p.id}`, href: `/app/plan/${p.id}`, kind: p.kind, title: `add the group photo from ${p.place}`, text: "only the people who were there will see it." });
  }
  const fresh = plans.filter((p) => !p.isHost && !p.joined && (p.status === "open" || p.status === "on") && p.taken < p.openSpots).slice(0, 3);
  for (const p of fresh) {
    pings.push({ key: `new-${p.id}`, href: `/app/plan/${p.id}`, kind: p.kind, title: `someone opened a ${planNoun(p)}`, text: `${p.place} · ${formatWhen(p.startsAt)}.` });
  }

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-2">
        <p className="mono text-muted-2">pings</p>
        <h1 className="display text-[3rem]">the few things worth telling you.</h1>
      </header>
      {pings.length ? (
        <ul className="flex flex-col gap-3">
          {pings.map((g) => (
            <li key={g.key}>
              <Link href={g.href} className="flex items-start gap-4 rounded-3xl bg-ink-2 p-5 ring-1 ring-line ring-inset hover:ring-lavender/50">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-bordeaux text-lavender">
                  <KindIcon kind={g.kind} className="h-5 w-5" />
                </span>
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="text-bone">{g.title}</span>
                  <span className="text-[15px] text-muted">{g.text}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted">a quiet week. sometimes that&apos;s the point.</p>
      )}
      <p className="display text-center text-[1.4rem] text-muted-2">we don&apos;t buzz. we whisper.</p>
    </div>
  );
}
