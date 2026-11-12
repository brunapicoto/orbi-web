import Link from "next/link";
import { notFound } from "next/navigation";
import { answerMemory } from "@/app/app/actions";
import { KindIcon } from "@/components/app/KindIcon";
import { PhotoUpload } from "@/components/app/PhotoUpload";
import { kindLabel } from "@/lib/app/kinds";
import { requireMe } from "@/lib/app/session";

export const dynamic = "force-dynamic";

const day = (d: string) =>
  new Date(`${d}T12:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }).toLowerCase();

export default async function MemoryPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ added?: string }> }) {
  const { id } = await params;
  const { added } = await searchParams;
  const { store } = await requireMe(`/app/memories/${id}`);
  const m = await store.memory(id);
  if (!m) notFound();
  const invite = Boolean(m.invitedBy);
  const photos = invite ? [] : await store.memoryPhotos(id);

  return (
    <article className="flex flex-col gap-8">
      <Link href="/app/memories" className="mono link-draw self-start text-muted-2">
        ← memories
      </Link>

      {added ? (
        <p role="status" className="rounded-2xl bg-bordeaux px-5 py-4 text-[16px] text-bone">
          saved.{m.waiting ? " the people you tagged will see it once they accept." : ""}
        </p>
      ) : null}

      {invite ? (
        <section className="flex flex-col gap-4 rounded-3xl bg-bordeaux p-6">
          <p className="display text-[2rem] leading-tight text-bone">{m.invitedBy!.toLowerCase()} says you were there.</p>
          <p className="text-[16px] text-lavender-soft">accept to keep it in your memories. if you decline, it just goes away. nothing is sent back.</p>
          <div className="flex flex-wrap gap-3">
            <form action={answerMemory.bind(null, m.id, true)}>
              <button type="submit" className="mono min-h-12 rounded-full bg-bone px-6 text-bordeaux hover:bg-lavender hover:text-ink">
                yes, i was there
              </button>
            </form>
            <form action={answerMemory.bind(null, m.id, false)}>
              <button type="submit" className="mono min-h-12 rounded-full border border-lavender-soft/40 px-6 text-bone hover:border-lavender">
                not for me
              </button>
            </form>
          </div>
        </section>
      ) : null}

      {photos.length ? (
        <ul className="flex flex-col gap-2">
          {photos.map((p) => (
            <li key={p.id}>
              {/* signed, short-lived urls: next/image can't cache them */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={`photo from ${m.place}`} className="w-full rounded-3xl object-cover [filter:saturate(.85)]" />
            </li>
          ))}
        </ul>
      ) : null}

      <header className="flex flex-col gap-3">
        <span className="mono flex items-center gap-2 text-lavender">
          <KindIcon kind={m.kind} className="h-4 w-4" />
          {kindLabel(m.kind)} · {day(m.happenedOn)}
        </span>
        <h1 className="display text-[2.75rem] leading-[0.95]">{m.place}</h1>
        {m.note ? <p className="display text-[1.5rem] leading-snug">&ldquo;{m.note}&rdquo;</p> : null}
        {!invite ? (
          <p className="mono text-muted">
            {m.withNames.length ? `with ${m.withNames.map((n) => n.toLowerCase()).join(", ")}` : "just you so far"}
            {m.isMine && m.waiting ? ` · ${m.waiting} invited` : ""}
          </p>
        ) : null}
      </header>

      {!invite ? (
        <section className="flex flex-col gap-3" aria-label="add a photo">
          <PhotoUpload planId={m.id} memory />
          <p className="text-[15px] text-muted-2">only you and the people who accepted can see this memory.</p>
        </section>
      ) : null}
    </article>
  );
}
