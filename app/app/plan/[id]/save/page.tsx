import { notFound, redirect } from "next/navigation";
import { SaveSpot } from "@/components/app/SaveSpot";
import { formatWhen } from "@/lib/app/kinds";
import { requireMe } from "@/lib/app/session";

export const dynamic = "force-dynamic";

export default async function SavePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { store } = await requireMe(`/app/plan/${id}/save`);
  const plan = await store.plan(id);
  if (!plan) notFound();
  if (plan.isHost || plan.status === "live" || plan.status === "past") redirect(`/app/plan/${id}`);
  // everyone else the group will hold: the host, friends they bring, the other spots
  const others = plan.openSpots + plan.bringing;
  return (
    <SaveSpot
      planId={plan.id}
      place={(plan.title || plan.place).split(",")[0].toLowerCase()}
      when={formatWhen(plan.startsAt)}
      unknown={Math.max(others, 2)}
      saved={plan.joined}
    />
  );
}
