import { JunoPlanner } from "@/components/app/JunoPlanner";
import { requireMe } from "@/lib/app/session";

export const dynamic = "force-dynamic";

/** Juno, the little astronaut planner: for the moments nobody can decide. */
export default async function Juno() {
  await requireMe("/app/juno");
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="mono text-[11px] uppercase tracking-widest text-muted-2">juno · your planner</p>
        <h1 className="display text-[3.2rem]">nobody can decide?</h1>
        <p className="text-[15px] text-muted">
          juno is named after the nasa probe orbiting jupiter. it keeps your plans in orbit, so your friends never drift too far.
        </p>
      </header>
      <JunoPlanner />
    </div>
  );
}
