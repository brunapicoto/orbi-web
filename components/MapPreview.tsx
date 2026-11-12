import { CATEGORIES } from "@/lib/app/categories";

/**
 * A drawn, static preview of the plans map for the website. No map library or tiles:
 * it keeps the homepage light. Pins are example plans.
 */
const PINS = [
  { x: 172, y: 70, cat: "study", label: "study session · morningside" },
  { x: 150, y: 132, cat: "sport", label: "run · upper west side" },
  { x: 214, y: 168, cat: "culture", label: "the met · 5th ave" },
  { x: 168, y: 236, cat: "dinner", label: "pasta bar · west village" },
  { x: 222, y: 214, cat: "culture", label: "cooking class · midtown" },
  { x: 300, y: 262, cat: "sport", label: "soccer · williamsburg" },
  { x: 268, y: 300, cat: "dinner", label: "dinner · dumbo" },
] as const;

export function MapPreview() {
  const color = (cat: string) => CATEGORIES.find((c) => c.id === cat)!;
  return (
    <figure className="m-0 overflow-hidden rounded-[28px] bg-ink ring-1 ring-line">
      <svg viewBox="0 0 400 340" className="block h-auto w-full" role="img" aria-label="a map of manhattan and brooklyn with plan pins">
        <rect width="400" height="340" fill="#0E0C0D" />
        {/* rivers */}
        <path d="M110 0c-10 70-20 140-40 210s-40 110-50 130H0V0z" fill="#1A1618" />
        <path d="M260 0c-8 60-20 120-34 170s-40 90-58 170h232V0z" fill="#1A1618" />
        {/* manhattan */}
        <path d="M130 0h120c-6 60-16 112-30 158s-36 100-56 140c-14 24-26 36-40 42-8-30-6-74 0-122s10-120 6-218z" fill="#211C1E" stroke="#2E2729" />
        {/* brooklyn */}
        <path d="M258 196c30 4 70 16 100 40s42 60 42 104H190c18-46 42-90 68-144z" fill="#211C1E" stroke="#2E2729" />
        {/* central park */}
        <path d="M168 92l40 6-14 64-40-6z" fill="#2E2729" />
        {/* streets */}
        <g stroke="#2E2729" strokeWidth="1">
          <path d="M140 40l100 14M136 80l96 14M140 200l80 12M146 250l60 10M150 290l40 8" />
          <path d="M150 20l-26 290M180 20l-24 300M210 20l-30 280" />
        </g>
        {/* pins */}
        {PINS.map((p) => {
          const c = color(p.cat);
          return (
            <g key={p.label} transform={`translate(${p.x} ${p.y})`}>
              <circle r="16" fill={c.color} opacity="0.18" />
              <path d="M0 6c-6-7-9-11-9-15a9 9 0 0 1 18 0c0 4-3 8-9 15z" fill={c.color} stroke="#0E0C0D" strokeWidth="1.2" />
              <circle cy="-9" r="3" fill={c.ink} />
            </g>
          );
        })}
        {/* the open card */}
        <g transform="translate(206 112)">
          <rect width="160" height="52" rx="12" fill="#F4F1F1" />
          <text x="12" y="21" fontSize="11.5" fill="#0E0C0D" style={{ fontFamily: "var(--font-display), sans-serif", fontWeight: 500 }}>
            pasta bar · west village
          </text>
          <text x="12" y="39" fontSize="9.5" fill="#7A1428" style={{ fontFamily: "var(--font-mono), monospace" }}>
            thu 8pm · 3 of 4 in
          </text>
        </g>
        <path d="M206 140l-34 92" stroke="#F4F1F1" strokeWidth="1" strokeDasharray="2 3" />
      </svg>
      <figcaption className="flex flex-wrap gap-x-4 gap-y-2 border-t border-line px-5 py-4">
        {CATEGORIES.slice(0, 5).map((c) => (
          <span key={c.id} className="mono flex items-center gap-2 text-[12px] text-muted">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} aria-hidden="true" />
            {c.label}
          </span>
        ))}
        <span className="mono text-[12px] text-muted-2">only plans from your mutuals</span>
      </figcaption>
    </figure>
  );
}
