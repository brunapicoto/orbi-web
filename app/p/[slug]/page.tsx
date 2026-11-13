import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { KindIcon } from "@/components/app/KindIcon";
import { LinkJoin } from "@/components/app/LinkJoin";
import { LiveCount } from "@/components/app/LiveCount";
import { MiniMap } from "@/components/app/map";
import { formatWhen, planLabel } from "@/lib/app/kinds";
import { countLine, planTitle, priceLabel } from "@/lib/app/planText";
import { getStore } from "@/lib/app/store";

export const dynamic = "force-dynamic";

const load = cache(async (slug: string) => {
  if (!/^[a-z0-9-]{4,40}$/.test(slug)) return null;
  const store = await getStore();
  const [teaser, me] = await Promise.all([store.teaser(slug), store.me()]);
  return teaser ? { teaser, signedIn: !!me, demo: store.demo } : null;
});

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await load(slug);
  if (!data) return { title: "orbi", robots: { index: false } };
  const t = data.teaser;
  const title = planTitle(t);
  const description = `${countLine(t.going, t.minPeople, t.status)} · ${formatWhen(t.startsAt)}${t.neighborhood ? ` · ${t.neighborhood}` : ""}. a small plan on orbi: it happens when enough people are in.`;
  return {
    title: `${title} · orbi`,
    description,
    robots: { index: false, follow: false },
    openGraph: { title, description, type: "website", siteName: "orbi" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function PublicPlan({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await load(slug);
  if (!data) notFound();
  const t = data.teaser;
  const title = planTitle(t);
  const price = priceLabel(t.priceLevel);

  return (
    <div className="app-theme min-h-dvh text-bone">
      {data.demo ? (
        <p className="mono bg-lavender px-4 py-2 text-center text-[12px] text-ink">demo mode · example data, nothing is saved</p>
      ) : null}
      <main id="main" className="mx-auto flex w-full max-w-md flex-col gap-8 px-5 pb-16 pt-6">
        <Link href="/" className="display self-start text-[1.75rem] text-lavender" aria-label="orbi home">
          orbi
        </Link>

        <article className="flex flex-col gap-6">
          {t.thumbnailUrl ? (
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-line bg-ink-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={t.thumbnailUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
              {t.sourceAuthor ? (
                <span className="mono absolute bottom-3 left-3 rounded-full bg-ink/80 px-3 py-1 text-[11px] text-lavender-soft">from {t.sourceAuthor}</span>
              ) : null}
            </div>
          ) : null}

          <header className="flex flex-col gap-3">
            <span className="mono flex items-center gap-2 text-lavender">
              <KindIcon kind={t.kind} className="h-4 w-4" />
              {[planLabel(t), price].filter(Boolean).join(" · ")}
            </span>
            <h1 className="display text-[2.75rem] leading-[0.95]">{title}</h1>
            <p className="mono text-muted">{formatWhen(t.startsAt)}</p>
            <p className="text-muted">
              {t.place}
              {t.neighborhood ? <span className="text-muted-2"> · {t.neighborhood}</span> : null}
            </p>
            {t.costNote ? <p className="text-[15px] text-muted-2">{t.costNote}</p> : null}
          </header>

          {t.lat !== null && t.lng !== null ? <MiniMap lat={t.lat} lng={t.lng} kind={t.kind} label={t.place} /> : null}

          <LiveCount slug={slug} initial={{ going: t.going, min: t.minPeople, max: t.maxPeople, status: t.status, joined: t.joined }} />

          {t.note ? <p className="border-l-2 border-lavender/50 pl-4 text-muted">{t.note}</p> : null}

          <p className="mono text-muted-2">{t.hostName ? `hosted by ${t.hostName.toLowerCase()}` : "someone is hosting"} · names show when it starts</p>

          <LinkJoin slug={slug} signedIn={data.signedIn} isHost={t.isHost} joined={t.joined} connected={t.connected} status={t.status} />
        </article>

        <footer className="flex flex-col gap-2 border-t border-line pt-6 text-[15px] text-muted-2">
          <p>orbi is for small plans with people one step from you. no app download needed. small groups, real plans.</p>
          <Link href="/privacy" className="mono link-draw self-start">privacy</Link>
        </footer>
      </main>
    </div>
  );
}
