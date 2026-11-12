import { PrefsForm } from "@/components/app/PrefsForm";
import { requireMe } from "@/lib/app/session";

export const dynamic = "force-dynamic";

export default async function Preferences({ searchParams }: { searchParams: Promise<{ first?: string; next?: string }> }) {
  const { store } = await requireMe("/app/preferences");
  const { first, next } = await searchParams;
  const prefs = await store.prefs();
  const isFirst = Boolean(first);
  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-2">
        <p className="mono text-muted-2">{isFirst ? "almost there" : "what you're into"}</p>
        <h1 className="display text-[3rem]">{isFirst ? "help us put the right plans first." : "your plans, in your order."}</h1>
        <p className="text-[16px] text-muted">change it whenever you like.</p>
      </header>
      <PrefsForm prefs={prefs} first={isFirst} next={isFirst ? (next?.startsWith("/app") ? next : "/app") : undefined} />
    </div>
  );
}
