import { headers } from "next/headers";
import { CopyLink } from "@/components/app/Forms";
import { requireMe } from "@/lib/app/session";

export const dynamic = "force-dynamic";

async function siteOrigin() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export default async function Mutuals({ searchParams }: { searchParams: Promise<{ joined?: string }> }) {
  const { store, me } = await requireMe("/app/mutuals");
  const { joined } = await searchParams;
  const mutuals = await store.mutuals();
  const link = `${await siteOrigin()}/app/invite/${me.inviteCode}`;

  return (
    <div className="flex flex-col gap-12">
      <header className="flex flex-col gap-3">
        <p className="mono text-muted-2">mutuals</p>
        <h1 className="display text-[3rem]">your orbit</h1>
        <p className="text-muted">people you&apos;ve connected with see your plans, and you see theirs. send your link to friends you actually want to see more.</p>
      </header>

      {joined ? (
        <p role="status" className="rounded-2xl bg-bordeaux px-5 py-4 text-[16px] text-bone">
          you&apos;re connected. their plans will show up in your list.
        </p>
      ) : null}

      <section className="flex flex-col gap-4" aria-labelledby="invite-title">
        <h2 id="invite-title" className="mono text-muted-2">
          your invite link
        </h2>
        <CopyLink url={link} />
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="list-title">
        <h2 id="list-title" className="mono text-muted-2">
          connected · {mutuals.length}
        </h2>
        {mutuals.length ? (
          <ul className="flex flex-col divide-y divide-line overflow-hidden rounded-3xl bg-ink-2 ring-1 ring-line ring-inset">
            {mutuals.map((m) => (
              <li key={m.id} className="flex items-center gap-4 px-5 py-4">
                <span className="display flex h-10 w-10 items-center justify-center rounded-full bg-bordeaux text-[17px] text-bone" aria-hidden="true">
                  {m.firstName.slice(0, 1).toLowerCase()}
                </span>
                <span className="text-bone">{m.firstName.toLowerCase()}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">nobody yet. your first plan needs at least 2 mutuals to say yes.</p>
        )}
      </section>
    </div>
  );
}
