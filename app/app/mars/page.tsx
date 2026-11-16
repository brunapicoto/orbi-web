import { MarsPlanner } from "@/components/app/MarsPlanner";
import { requireMe } from "@/lib/app/session";

export const dynamic = "force-dynamic";

/** Mars, the little astronaut planner: for the moments nobody can decide. */
export default async function Mars() {
  await requireMe("/app/mars");
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="mono text-[11px] uppercase tracking-widest text-muted-2">mars · your planner</p>
        <h1 className="display text-[3.2rem]">nobody can decide?</h1>
      </header>
      <MarsPlanner />
    </div>
  );
}
