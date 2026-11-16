import Link from "next/link";
import { signOut } from "@/app/app/actions";
import { NameForm } from "@/components/app/Forms";
import { AvatarPicker, ProfileForm } from "@/components/app/ProfileBits";
import { requireMe } from "@/lib/app/session";

export const dynamic = "force-dynamic";

export default async function You() {
  const { store, me } = await requireMe("/app/you");
  const [plans, mutuals] = await Promise.all([store.plans(), store.mutuals()]);
  const went = plans.filter((p) => p.status === "past" && (p.isHost || p.joined)).length;
  const hosted = plans.filter((p) => p.isHost).length;
  const upcoming = plans.filter((p) => p.joined && (p.status === "open" || p.status === "on")).length;
  const hosting = plans.filter((p) => p.isHost && (p.status === "open" || p.status === "on")).length;
  const since = me.since ? new Date(me.since).toLocaleDateString("en-US", { month: "long", year: "numeric" }).toLowerCase() : null;

  return (
    <div className="flex flex-col gap-10">
      <header className="flex items-center gap-5">
        <AvatarPicker url={me.photoUrl} initial={me.firstName.slice(0, 1).toLowerCase()} />
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="display text-[2.6rem]">{me.firstName.toLowerCase()}</h1>
          <p className="mono text-[11px] uppercase tracking-widest text-muted-2">
            {[me.neighborhood, since ? `since ${since}` : null].filter(Boolean).join(" · ") || me.email}
          </p>
        </div>
      </header>

      <ul className="grid grid-cols-3 gap-3" aria-label="your numbers">
        {[
          [went, "plans"],
          [hosted, "hosted"],
          [mutuals.length, "in orbit"],
        ].map(([v, k]) => (
          <li key={k} className="flex flex-col items-center gap-1 rounded-2xl bg-ink-2 px-2 py-4 ring-1 ring-line ring-inset">
            <span className="display text-[2.2rem] leading-none">{v}</span>
            <span className="mono text-[10px] uppercase tracking-widest text-muted-2">{k}</span>
          </li>
        ))}
      </ul>

      {me.bio ? <p className="display rounded-[20px] bg-ink-2 px-5 py-4 text-[1.3rem] leading-snug ring-1 ring-line ring-inset">&ldquo;{me.bio}&rdquo;</p> : null}

      <section className="flex flex-col gap-3" aria-labelledby="plans-title">
        <h2 id="plans-title" className="mono text-[11px] uppercase tracking-widest text-muted-2">your plans</h2>
        <ul className="flex flex-col divide-y divide-line overflow-hidden rounded-[20px] bg-ink-2 ring-1 ring-line ring-inset">
          <Row href="/app?show=going" label="upcoming" value={String(upcoming)} />
          <Row href="/app?show=going" label="hosting" value={String(hosting)} />
          <Row href="/app/memories" label="past" value={String(went)} />
          <Row href="/app/lists" label="your lists" value="places worth a plan" />
        </ul>
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="orbit-title">
        <h2 id="orbit-title" className="mono text-[11px] uppercase tracking-widest text-muted-2">your orbit</h2>
        <ul className="flex flex-col divide-y divide-line overflow-hidden rounded-[20px] bg-ink-2 ring-1 ring-line ring-inset">
          <Row href="/app/mutuals" label="in your orbit" value={`${mutuals.length} ${mutuals.length === 1 ? "person" : "people"}`} />
          <Row href="/app/mutuals" label="invite from outside" value="your link" />
        </ul>
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="about-title">
        <h2 id="about-title" className="mono text-[11px] uppercase tracking-widest text-muted-2">about you</h2>
        <NameForm current={me.firstName} cta="save name" />
        <ProfileForm bio={me.bio ?? ""} neighborhood={me.neighborhood ?? ""} />
      </section>

      <section className="flex flex-col gap-3" aria-label="more">
        <ul className="flex flex-col divide-y divide-line overflow-hidden rounded-[20px] bg-ink-2 ring-1 ring-line ring-inset">
          <Row href="/app/settings" label="settings" value="privacy · blocked" />
          <Row href="/app/preferences" label="what you're into" value="orders your plans" />
        </ul>
        <Link href="/app/welcome?intro=1" className="mono link-draw self-start text-muted-2">replay the intro</Link>
      </section>

      <form action={signOut}>
        <button type="submit" className="mono link-draw text-muted-2">{store.demo ? "reset the demo" : "sign out"}</button>
      </form>
    </div>
  );
}

function Row({ href, label, value }: { href: string; label: string; value: string }) {
  return (
    <li>
      <Link href={href} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-ink">
        <span className="text-bone">{label}</span>
        <span className="mono flex items-center gap-2 text-[13px] text-lavender">
          {value} <span aria-hidden="true" className="text-muted-2">›</span>
        </span>
      </Link>
    </li>
  );
}
