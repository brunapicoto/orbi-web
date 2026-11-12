import { NextResponse } from "next/server";
import { getStore } from "@/lib/app/store";

export const dynamic = "force-dynamic";

/** The live count on the public plan page. Numbers only, never who. */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9-]{4,40}$/.test(slug)) return NextResponse.json({ error: "not found" }, { status: 404 });
  const store = await getStore();
  const t = await store.teaser(slug);
  if (!t) return NextResponse.json({ error: "not found" }, { status: 404, headers: { "Cache-Control": "no-store" } });
  return NextResponse.json(
    { going: t.going, min: t.minPeople, max: t.maxPeople, status: t.status, joined: t.joined },
    { headers: { "Cache-Control": "no-store" } },
  );
}
