import { NewPlanScreen } from "@/components/app/NewPlanScreen";
import { KIND_IDS } from "@/lib/app/kinds";
import { requireMe } from "@/lib/app/session";

export const dynamic = "force-dynamic";

export default async function NewPlan({ searchParams }: { searchParams: Promise<{ kind?: string; again?: string }> }) {
  await requireMe("/app/new");
  const { kind, again } = await searchParams;
  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-2">
        <p className="mono text-muted-2">{again ? "host the next one" : "post a plan"}</p>
        <h1 className="display text-[3rem]">what are we doing?</h1>
      </header>
      <NewPlanScreen initialKind={kind && KIND_IDS.includes(kind) ? kind : ""} />
    </div>
  );
}
