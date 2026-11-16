import Link from "next/link";
import { ListsClient } from "@/components/app/ListsClient";
import { MarsMascot } from "@/components/app/MarsMascot";
import { requireMe } from "@/lib/app/session";

export const dynamic = "force-dynamic";

/** Your lists: places you want to remember or try. Only you see them. */
export default async function Lists() {
  const { store } = await requireMe("/app/lists");
  const lists = await store.lists();
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <p className="mono text-[11px] uppercase tracking-widest text-muted-2">your lists · only you see them</p>
        <h1 className="display text-[3.2rem]">places worth a plan.</h1>
        <p className="text-[16px] text-muted">coffee shops, bars, restaurants, parks, hidden gems. save them by hand, or bring them over from tiktok, instagram or your notes.</p>
      </header>
      <ListsClient lists={lists} />
      <Link href="/app/mars" className="flex items-center gap-4 rounded-[22px] bg-ink-2 p-4 ring-1 ring-line ring-inset hover:ring-lavender/50">
        <MarsMascot className="h-16 w-16 shrink-0" />
        <span className="flex flex-col">
          <span className="display text-[1.4rem]">can&apos;t decide? ask mars.</span>
          <span className="text-[14px] text-muted">it turns your lists into a plan for your group.</span>
        </span>
      </Link>
    </div>
  );
}
