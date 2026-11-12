import Link from "next/link";
import { signOut } from "@/app/app/actions";
import { NameForm } from "@/components/app/Forms";
import { requireMe } from "@/lib/app/session";

export const dynamic = "force-dynamic";

const RULES = [
  "nobody can browse your profile.",
  "your plans are visible only to your mutuals.",
  "nobody sees who said yes until a plan starts.",
  "every plan has 3 or more people.",
];

export default async function You() {
  const { store, me } = await requireMe("/app/you");
  return (
    <div className="flex flex-col gap-12">
      <header className="flex flex-col gap-2">
        <p className="mono text-muted-2">{me.email ?? ""}</p>
        <h1 className="display text-[3rem]">{me.firstName.toLowerCase()}</h1>
      </header>

      <section className="flex flex-col gap-4" aria-label="your name">
        <NameForm current={me.firstName} cta="save name" />
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="rules-title">
        <h2 id="rules-title" className="mono text-muted-2">
          how orbi keeps it friendly
        </h2>
        <ul className="flex flex-col divide-y divide-line overflow-hidden rounded-3xl bg-ink-2 ring-1 ring-line ring-inset">
          {RULES.map((r) => (
            <li key={r} className="px-5 py-4 text-[16px] text-muted">
              {r}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3" aria-label="more">
        <Link href="/app/mutuals" className="flex items-center justify-between rounded-3xl bg-ink-2 px-5 py-4 ring-1 ring-line ring-inset hover:ring-lavender/50">
          <span className="text-bone">your orbit</span>
          <span className="mono text-lavender">invite link · mutuals</span>
        </Link>
        <Link href="/app/welcome?intro=1" className="mono link-draw self-start text-muted-2">
          replay the intro
        </Link>
      </section>

      <form action={signOut}>
        <button type="submit" className="mono link-draw text-muted-2">
          {store.demo ? "reset the demo" : "sign out"}
        </button>
      </form>
    </div>
  );
}
