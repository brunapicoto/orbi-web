import Link from "next/link";
import { LinkPlanFlow } from "@/components/app/LinkPlanFlow";
import { requireMe } from "@/lib/app/session";

export const dynamic = "force-dynamic";

export default async function NewFromLink({ searchParams }: { searchParams: Promise<{ url?: string }> }) {
  await requireMe("/app/new/link");
  const { url } = await searchParams;
  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-2">
        <p className="mono text-muted-2">from a link</p>
        <h1 className="display text-[3rem] leading-[0.95]">saw it on tiktok? make it a plan.</h1>
      </header>
      <LinkPlanFlow initialUrl={typeof url === "string" && url.startsWith("https://") ? url.slice(0, 500) : ""} />
      <Link href="/app/new" className="mono link-draw self-start text-muted-2">
        or post a plan without a link
      </Link>
    </div>
  );
}
