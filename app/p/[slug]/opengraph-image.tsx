import { ImageResponse } from "next/og";
import { categoryOf } from "@/lib/app/categories";
import { formatWhen } from "@/lib/app/kinds";
import { countLine, planTitle } from "@/lib/app/planText";
import { getStore } from "@/lib/app/store";

export const alt = "a plan on orbi";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The WhatsApp / iMessage preview: what, when, and how many are in. Never who. */
export default async function PlanImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = /^[a-z0-9-]{4,40}$/.test(slug) ? await (await getStore()).teaser(slug) : null;
  const title = t ? planTitle(t) : "a plan on orbi";
  const when = t ? formatWhen(t.startsAt) : "";
  const count = t ? countLine(t.going, t.minPeople, t.status) : "";
  const where = t ? [t.place, t.neighborhood].filter(Boolean).join(" · ") : "";
  const color = t ? categoryOf(t.kind).color : "#C9D2FA";
  const dots = t ? Math.max(t.minPeople, Math.min(t.going, t.maxPeople)) : 0;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", background: "#7A1428", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "60px 72px", color: "#F4F1F1", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 44, color: "#C9D2FA", letterSpacing: -1 }}>orbi</span>
          <span style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 26, color: "#E4E8FC" }}>
            <span style={{ width: 18, height: 18, borderRadius: 9, background: color, display: "flex" }} />
            {when}
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <span style={{ fontSize: title.length > 28 ? 76 : 96, lineHeight: 1, letterSpacing: -3 }}>{title}</span>
          {where ? <span style={{ fontSize: 30, color: "#E4E8FC" }}>{where}</span> : null}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ display: "flex", gap: 10 }}>
            {Array.from({ length: Math.min(dots, 12) }).map((_, i) => (
              <span key={i} style={{ width: 30, height: 30, borderRadius: 15, display: "flex", background: t && i < t.going ? "#F4F1F1" : "transparent", border: "3px solid #C9D2FA" }} />
            ))}
          </div>
          <span style={{ fontSize: 40, color: "#C9D2FA" }}>{count}</span>
        </div>
      </div>
    ),
    size,
  );
}
