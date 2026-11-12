import Link from "next/link";
import { NewPlanForm } from "@/components/app/NewPlanForm";
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
      <Link href="/app/new/link" className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-ink-2 px-5 py-4 transition-colors hover:border-lavender">
        <span className="flex flex-col gap-1">
          <span className="mono text-lavender">saw it on tiktok?</span>
          <span className="text-[15px] text-muted">paste the link and orbi fills in the plan.</span>
        </span>
        <span aria-hidden="true" className="mono text-lavender">→</span>
      </Link>
      <NewPlanForm initialKind={kind && KIND_IDS.includes(kind) ? kind : ""} />
    </div>
  );
}
