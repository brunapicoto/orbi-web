import Link from "next/link";
import { notFound } from "next/navigation";
import { answerMemory } from "@/app/app/actions";
import { BlurEditor } from "@/components/app/BlurEditor";
import { KindIcon } from "@/components/app/KindIcon";
import { PhotoUpload } from "@/components/app/PhotoUpload";
import { RateExperience } from "@/components/app/RateExperience";
import { RatingLine } from "@/components/app/Rating";
import { kindLabel } from "@/lib/app/kinds";
import { requireMe } from "@/lib/app/session";

export const dynamic = "force-dynamic";

const day = (d: string) =>
  new Date(`${d}T12:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }).toLowerCase();

export default async function MemoryPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ added?: string; blur?: string }> }) {
  const { id } = await params;
  const { added, blur } = await searchParams;
  const { store } = await requireMe(`/app/memories/${id}`);
  const m = await store.memory(id);
  if (!m) notFound();
  const invite = Boolean(m.invitedBy);
  const photos = invite ? [] : await store.memoryPhotos(id);
  // ?blur=1 right after "accept and blur me"; ?blur=<photo id> from a single photo
  const blurAt = m.inIt && blur && photos.length ? Math.max(0, photos.findIndex((p) => p.id === blur)) : -1;

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
          <p className="text-[16px] text-lavender-soft">
            accept to keep it in your memories, as it is or with you blurred in the photos. if you decline, the tag just goes away. nothing is sent back.
          </p>
          <div className="flex flex-col gap-3">
            <form action={answerMemory.bind(null, m.id, true, false)}>
              <button type="submit" className="mono min-h-12 w-full rounded-full bg-bone px-6 text-bordeaux hover:bg-lavender hover:text-ink">
                accept, keep the photos as they are
              </button>
            </form>
            <form action={answerMemory.bind(null, m.id, true, true)}>
              <button type="submit" className="mono min-h-12 w-full rounded-full border border-lavender px-6 text-lavender hover:bg-lavender hover:text-ink">
                accept, and blur me in the photos
              </button>
            </form>
            <form action={answerMemory.bind(null, m.id, false, false)}>
              <button type="submit" className="mono min-h-12 w-full rounded-full border border-lavender-soft/40 px-6 text-bone hover:border-lavender">
                decline the tag
              </button>
            </form>
          </div>
        </section>
      ) : null}

      {blurAt >= 0 ? <BlurEditor memoryId={m.id} photos={photos} startAt={blurAt} /> : null}

      {photos.length && blurAt < 0 ? (
        <div className="flex flex-col gap-2">
          <ul aria-label={`${photos.length} ${photos.length === 1 ? "photo" : "photos"}`} className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 [scrollbar-width:none]">
            {photos.map((p, i) => (
              <li key={p.id} className={`relative shrink-0 snap-start ${photos.length === 1 ? "w-full" : "w-[84%]"}`}>
                {/* signed, short-lived urls: next/image can't cache them */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={`photo ${i + 1} from ${m.place}`} className="aspect-square w-full rounded-3xl object-cover [filter:saturate(.85)]" />
                {photos.length > 1 ? (
                  <span className="mono absolute bottom-3 left-3 rounded-full bg-ink/80 px-2.5 py-1 text-[11px] text-lavender-soft">{i + 1}/{photos.length}</span>
                ) : null}
                {m.inIt ? (
                  <Link href={`/app/memories/${m.id}?blur=${p.id}`} className="mono absolute bottom-3 right-3 rounded-full bg-ink/80 px-3 py-1.5 text-[11px] text-bone hover:bg-lavender hover:text-ink">
                    blur me
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
          {photos.length > 1 ? <p className="mono text-[12px] text-muted-2">swipe for more →</p> : null}
        </div>
      ) : null}

      <header className="flex flex-col gap-3">
        <span className="mono flex items-center gap-2 text-lavender">
          <KindIcon kind={m.kind} className="h-4 w-4" />
          {kindLabel(m.kind)} · {day(m.happenedOn)}
        </span>
        <h1 className="display text-[2.75rem] leading-[0.95]">
          {invite ? (
            m.place
          ) : (
            <Link href={`/app/memories?place=${encodeURIComponent(m.placeKey)}`} className="hover:text-lavender">
              {m.place}
            </Link>
          )}
        </h1>
        {!invite ? (
          m.rating != null ? (
            <RatingLine rating={m.rating} ratings={m.ratings} className="text-[15px]" />
          ) : (
            <p className="mono text-[12px] text-muted-2">the rating shows once 3 people who were there rate it.</p>
          )
        ) : null}
        {m.note ? <p className="display text-[1.5rem] leading-snug">&ldquo;{m.note}&rdquo;</p> : null}
        {!invite ? (
          <p className="mono text-muted">
            {m.withNames.length ? `with ${m.withNames.map((n) => n.toLowerCase()).join(", ")}` : "just you so far"}
            {m.isMine && m.waiting ? ` · ${m.waiting} invited` : ""}
          </p>
        ) : null}
        {!invite && !m.inIt ? <p className="mono text-[12px] text-lavender-soft">from your network</p> : null}
      </header>

      {!invite && m.inIt ? <RateExperience memoryId={m.id} mine={m.myRating} /> : null}

      {!invite ? (
        <section className="flex flex-col gap-3" aria-label={m.inIt ? "add a photo" : "who can see this"}>
          {m.inIt ? <PhotoUpload planId={m.id} memory /> : null}
          <p className="text-[15px] text-muted-2">your network and the networks of everyone tagged can see this memory.</p>
        </section>
      ) : null}
    </article>
  );
}
