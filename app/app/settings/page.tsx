import Link from "next/link";
import { LeaveButton, Toggle, UnblockButton } from "@/components/app/ProfileBits";
import { requireMe } from "@/lib/app/session";

export const dynamic = "force-dynamic";

export default async function Settings() {
  const { store, me } = await requireMe("/app/settings");
  const blocked = await store.blocked();
  return (
    <div className="flex flex-col gap-10">
      <Link href="/app/you" className="mono link-draw self-start text-muted-2">← you</Link>
      <header className="flex flex-col gap-2">
        <p className="mono text-[11px] uppercase tracking-widest text-muted-2">settings</p>
        <h1 className="display text-[3rem]">how orbi knows you.</h1>
      </header>

      <Group kicker="privacy" title="what's yours">
        <Fixed label="who sees your face" value="people in your orbit" sub="your profile photo. nobody else, ever." />
        <Fixed label="who can join your orbit" value="mutuals only" sub="your invite link, a plan's link, or both of you picking each other after a plan." />
        <Fixed label="who hosts your plans" value="anonymous" sub="people see “someone with N mutuals is hosting”, never your name." />
        <Toggle on={me.appearInPicks} label="appear in “keep in orbit” after plans" sub="when others choose who to keep from a plan" />
      </Group>

      <Group kicker="off the wall" title="people you'd rather not see">
        {blocked.length ? (
          blocked.map((b) => (
            <div key={b.id} className="flex items-center justify-between gap-4 px-5 py-4">
              <span className="display text-[1.3rem]">{b.firstName.toLowerCase()}</span>
              <UnblockButton id={b.id} />
            </div>
          ))
        ) : (
          <p className="px-5 py-4 text-[15px] text-muted">nobody. you can hide someone from your orbit page.</p>
        )}
        <p className="px-5 py-3 text-[13px] text-muted-2">their plans and memories disappear for you, and yours for them. quietly, without telling them.</p>
      </Group>

      <Group kicker="what you see" title="how the feed leans">
        <Link href="/app/preferences" className="flex items-center justify-between px-5 py-4 hover:bg-ink">
          <span className="display text-[1.25rem]">what you&apos;re into</span>
          <span className="mono text-[13px] text-lavender">edit ›</span>
        </Link>
      </Group>

      <LeaveButton />
    </div>
  );
}

function Group({ kicker, title, children }: { kicker: string; title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <p className="mono text-[11px] uppercase tracking-widest text-muted-2">{kicker}</p>
        <h2 className="display text-[1.8rem]">{title}</h2>
      </div>
      <div className="flex flex-col divide-y divide-line overflow-hidden rounded-[20px] bg-ink-2 ring-1 ring-line ring-inset">{children}</div>
    </section>
  );
}

function Fixed({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <span className="flex flex-col">
        <span className="display text-[1.25rem]">{label}</span>
        <span className="text-[13px] text-muted-2">{sub}</span>
      </span>
      <span className="mono shrink-0 rounded-full bg-bone px-3 py-1.5 text-[12px] text-ink">{value}</span>
    </div>
  );
}
