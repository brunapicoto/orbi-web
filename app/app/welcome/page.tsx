import { redirect } from "next/navigation";
import { WelcomeFlow } from "@/components/app/WelcomeFlow";
import { getStore } from "@/lib/app/store";

export const dynamic = "force-dynamic";

export default async function Welcome({ searchParams }: { searchParams: Promise<{ next?: string; intro?: string }> }) {
  const { next = "/app", intro } = await searchParams;
  const safeNext = next.startsWith("/app") ? next : "/app";
  const store = await getStore();
  const me = await store.me();
  if (!me) redirect("/app/login");
  const replay = Boolean(intro) && Boolean(me.firstName);
  if (me.firstName && !replay) redirect(safeNext);
  return <WelcomeFlow next={safeNext} replay={replay} />;
}
