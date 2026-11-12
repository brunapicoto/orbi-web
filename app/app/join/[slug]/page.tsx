import Link from "next/link";
import { redirect } from "next/navigation";
import { OrbitDial } from "@/components/OrbitDial";
import { JoinFromLinkButton } from "@/components/app/JoinFromLinkButton";
import { formatWhen } from "@/lib/app/kinds";
import { countLine, planTitle } from "@/lib/app/planText";
import { requireMe } from "@/lib/app/session";

export const dynamic = "force-dynamic";

/** Saying yes from a shared link, signed in. If you're not in the host's orbit yet, the link works as their invite. */
export default async function JoinFromLink({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9-]{4,40}$/.test(slug)) redirect("/app");
  const { store } = await requireMe(`/app/join/${slug}`);
  const t = await store.teaser(slug);
  if (!t || t.isHost || t.joined || t.status === "live") redirect(t ? `/p/${slug}` : "/app");
  const host = t.connected ? null : await store.linkHostName(slug);

  return (
    <div className="flex flex-col gap-8 pt-6">
      <div className="w-20">
        <OrbitDial phase="reveal" interactive={false} />
      </div>
      <div className="flex flex-col gap-3">
        <p className="mono text-muted-2">{formatWhen(t.startsAt)} · {countLine(t.going, t.minPeople, t.status)}</p>
        <h1 className="display text-[2.75rem] leading-[0.95]">{planTitle(t)}</h1>
        <p className="text-muted">{t.place}</p>
      </div>
      {host ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-line p-5">
          <p className="display text-[1.6rem] leading-tight">this plan is from {host.toLowerCase()}&apos;s orbit.</p>
          <p className="text-[15px] text-muted">
            saying yes connects you with {host.toLowerCase()}, so you&apos;ll see each other&apos;s plans. orbi is only ever people one step from you. nobody sees who else is in until it starts.
          </p>
        </div>
      ) : (
        <p className="text-[15px] text-muted">nobody sees who else is in until it starts.</p>
      )}
      <JoinFromLinkButton slug={slug} label={host ? `connect with ${host.toLowerCase()} and join` : "i'm in"} />
      <Link href={`/p/${slug}`} className="mono link-draw self-start text-muted-2">not now</Link>
    </div>
  );
}
