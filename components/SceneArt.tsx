/**
 * White line-and-shape illustrations in the orbit dial's language:
 * people as circles and pills, faint rings, one dashed shape for the open spot.
 */
const FG = "#F4F1F1";
const RING = "rgba(244,241,241,0.22)";

function Person({ x, y, s = 1, empty = false }: { x: number; y: number; s?: number; empty?: boolean }) {
  const head = 10 * s;
  const w = 26 * s;
  const h = 34 * s;
  if (empty) {
    return (
      <g fill="none" stroke={FG} strokeWidth={1.4} strokeDasharray="3 3" opacity={0.7}>
        <circle cx={x} cy={y} r={head} />
        <rect x={x - w / 2} y={y + head + 3 * s} width={w} height={h} rx={w / 2} />
      </g>
    );
  }
  return (
    <g fill={FG}>
      <circle cx={x} cy={y} r={head} />
      <rect x={x - w / 2} y={y + head + 3 * s} width={w} height={h} rx={w / 2} />
    </g>
  );
}

export function DinnerArt() {
  return (
    <svg viewBox="0 0 200 250" className="h-full w-full" role="img" aria-label="three friends at a dinner table with one open seat, under a hanging lamp">
      {/* lamp and its glow */}
      <line x1="100" y1="0" x2="100" y2="44" stroke={FG} strokeWidth={1.2} />
      <path d="M86 58a14 14 0 0 1 28 0z" fill={FG} />
      <circle cx="100" cy="64" r="46" fill="none" stroke={RING} strokeWidth={0.8} strokeDasharray="1 3" />
      <circle cx="100" cy="64" r="74" fill="none" stroke={RING} strokeWidth={0.6} />
      {/* people behind the table */}
      <Person x={48} y={116} />
      <Person x={84} y={110} />
      <Person x={118} y={114} />
      <Person x={154} y={116} empty />
      {/* table, glasses, a candle */}
      <rect x="22" y="156" width="156" height="9" rx="4.5" fill={FG} />
      <line x1="36" y1="165" x2="36" y2="214" stroke={FG} strokeWidth={2} strokeLinecap="round" />
      <line x1="164" y1="165" x2="164" y2="214" stroke={FG} strokeWidth={2} strokeLinecap="round" />
      <rect x="60" y="143" width="6" height="13" rx="2" fill={FG} />
      <rect x="128" y="143" width="6" height="13" rx="2" fill={FG} />
      <rect x="97" y="140" width="5" height="16" rx="2" fill={FG} />
      <circle cx="99.5" cy="135" r="3" fill={FG} />
      <line x1="10" y1="222" x2="190" y2="222" stroke={RING} strokeWidth={1} />
    </svg>
  );
}

export function CafeArt() {
  const stripes = Array.from({ length: 8 }, (_, i) => i);
  return (
    <svg viewBox="0 0 200 250" className="h-full w-full" role="img" aria-label="a group of friends outside a corner café called orbi café no. 1">
      {/* sign */}
      <rect x="34" y="14" width="132" height="22" rx="4" fill="none" stroke={FG} strokeWidth={1.2} />
      <text x="100" y="29" textAnchor="middle" fill={FG} fontSize="10" letterSpacing="0.6" style={{ fontFamily: "var(--font-mono), monospace" }}>
        orbi café no. 1
      </text>
      {/* awning */}
      <rect x="20" y="44" width="160" height="16" rx="2" fill={FG} />
      {stripes.map((i) => (
        <rect key={i} x={30 + i * 20} y="44" width="10" height="16" fill="#0E0C0D" />
      ))}
      <path d="M20 60h160" stroke={FG} strokeWidth={1.2} />
      {/* storefront */}
      <rect x="24" y="60" width="152" height="122" fill="none" stroke={RING} strokeWidth={1} />
      <rect x="34" y="76" width="82" height="70" rx="3" fill="none" stroke={FG} strokeWidth={1.2} />
      <circle cx="58" cy="104" r="7" fill={FG} />
      <rect x="49" y="114" width="18" height="22" rx="9" fill={FG} />
      <circle cx="90" cy="102" r="7" fill={FG} />
      <rect x="81" y="112" width="18" height="24" rx="9" fill={FG} />
      <rect x="128" y="84" width="38" height="98" rx="3" fill="none" stroke={FG} strokeWidth={1.2} />
      <circle cx="158" cy="134" r="2" fill={FG} />
      {/* the group outside */}
      <Person x={44} y={176} s={0.9} />
      <Person x={74} y={172} s={0.9} />
      <Person x={104} y={178} s={0.9} />
      <Person x={150} y={174} s={0.9} />
      <circle cx="100" cy="200" r="70" fill="none" stroke={RING} strokeWidth={0.6} strokeDasharray="1 3" />
      <line x1="8" y1="226" x2="192" y2="226" stroke={RING} strokeWidth={1} />
    </svg>
  );
}
