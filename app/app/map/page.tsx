import { MapExplorer } from "@/components/app/MapExplorer";
import { requireMe } from "@/lib/app/session";

export const dynamic = "force-dynamic";

/** Plans on a map. Only what you can already see: your mutuals' plans and the ones you're in. */
export default async function PlansMapPage() {
  const { store } = await requireMe("/app/map");
  const plans = (await store.plans()).filter((p) => p.status === "open" || p.status === "on" || p.status === "live");
  return (
    <>
      <h1 className="sr-only">plans on a map</h1>
      <MapExplorer plans={plans} demo={store.demo} />
    </>
  );
}
