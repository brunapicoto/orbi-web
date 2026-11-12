import { redirect } from "next/navigation";
import { NameForm } from "@/components/app/Forms";
import { getStore } from "@/lib/app/store";

export const dynamic = "force-dynamic";

export default async function Welcome({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "/app" } = await searchParams;
  const store = await getStore();
  const me = await store.me();
  if (!me) redirect("/app/login");
  if (me.firstName) redirect(next.startsWith("/app") ? next : "/app");
  return (
    <div className="flex flex-col gap-10 pt-6">
      <header className="flex flex-col gap-3">
        <p className="mono text-muted-2">welcome to orbi</p>
        <h1 className="display text-[3rem]">what should your mutuals call you?</h1>
        <p className="text-muted">only your accepted connections see your name, and only once a plan starts.</p>
      </header>
      <NameForm next={next.startsWith("/app") ? next : "/app"} />
    </div>
  );
}
