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

export function RunArt() {
  const runner = (x: number, y: number) => (
    <g fill={FG} stroke={FG} strokeLinecap="round">
      <circle cx={x + 6} cy={y} r={9} stroke="none" />
      <rect x={x - 6} y={y + 12} width={22} height={34} rx={11} stroke="none" transform={`rotate(14 ${x + 5} ${y + 29})`} />
      <line x1={x + 4} y1={y + 44} x2={x - 10} y2={y + 66} strokeWidth={5} />
      <line x1={x + 10} y1={y + 44} x2={x + 22} y2={y + 64} strokeWidth={5} />
      <line x1={x + 12} y1={y + 20} x2={x + 26} y2={y + 32} strokeWidth={4} />
    </g>
  );
  return (
    <svg viewBox="0 0 200 250" className="h-full w-full" role="img" aria-label="three friends running together at sunrise">
      <circle cx="150" cy="62" r="18" fill="none" stroke={FG} strokeWidth={1.4} />
      <circle cx="150" cy="62" r="34" fill="none" stroke={RING} strokeWidth={0.8} strokeDasharray="1 3" />
      {runner(36, 110)}
      {runner(82, 104)}
      {runner(128, 112)}
      <line x1="10" y1="184" x2="190" y2="184" stroke={FG} strokeWidth={1.2} />
      {[20, 56, 92, 128, 164].map((x) => (
        <line key={x} x1={x} y1="200" x2={x + 18} y2="200" stroke={RING} strokeWidth={2} strokeLinecap="round" />
      ))}
    </svg>
  );
}

export function SaunaArt() {
  return (
    <svg viewBox="0 0 200 250" className="h-full w-full" role="img" aria-label="four friends sitting together on a sauna bench">
      {[60, 96, 132].map((x) => (
        <path key={x} d={`M${x} 70c-8-9 8-15 0-24s8-15 0-24`} fill="none" stroke={RING} strokeWidth={2} strokeLinecap="round" />
      ))}
      <Person x={42} y={104} s={0.95} />
      <Person x={78} y={100} s={0.95} />
      <Person x={114} y={104} s={0.95} />
      <Person x={150} y={100} s={0.95} />
      <rect x="18" y="150" width="164" height="8" rx="3" fill={FG} />
      <rect x="18" y="164" width="164" height="8" rx="3" fill={FG} />
      <line x1="30" y1="172" x2="30" y2="212" stroke={FG} strokeWidth={2} />
      <line x1="170" y1="172" x2="170" y2="212" stroke={FG} strokeWidth={2} />
      <path d="M86 200h28l-4 22h-20z" fill="none" stroke={FG} strokeWidth={1.4} strokeLinejoin="round" />
      <line x1="100" y1="200" x2="112" y2="186" stroke={FG} strokeWidth={1.4} strokeLinecap="round" />
      <line x1="10" y1="226" x2="190" y2="226" stroke={RING} strokeWidth={1} />
    </svg>
  );
}

export function PaintArt() {
  return (
    <svg viewBox="0 0 200 250" className="h-full w-full" role="img" aria-label="three friends at a painting class around an easel">
      {/* easel and canvas with the orbit mark painted on it */}
      <line x1="100" y1="40" x2="74" y2="196" stroke={FG} strokeWidth={2} strokeLinecap="round" />
      <line x1="100" y1="40" x2="126" y2="196" stroke={FG} strokeWidth={2} strokeLinecap="round" />
      <rect x="70" y="56" width="60" height="72" rx="3" fill="none" stroke={FG} strokeWidth={1.4} />
      <circle cx="100" cy="92" r="8" fill={FG} />
      <circle cx="100" cy="78" r="3.5" fill={FG} />
      <circle cx="112" cy="99" r="3.5" fill={FG} />
      <circle cx="88" cy="99" r="3.5" fill={FG} />
      <line x1="66" y1="132" x2="134" y2="132" stroke={FG} strokeWidth={2} strokeLinecap="round" />
      {/* the class */}
      <Person x={36} y={126} s={0.9} />
      <Person x={164} y={122} s={0.9} />
      <Person x={150} y={170} s={0.75} />
      <line x1="48" y1="146" x2="66" y2="124" stroke={FG} strokeWidth={2} strokeLinecap="round" />
      <ellipse cx="38" cy="196" rx="16" ry="7" fill="none" stroke={FG} strokeWidth={1.2} />
      <circle cx="32" cy="195" r="2" fill={FG} />
      <circle cx="40" cy="193" r="2" fill={FG} />
      <circle cx="45" cy="197" r="2" fill={FG} />
      <line x1="10" y1="214" x2="190" y2="214" stroke={RING} strokeWidth={1} />
    </svg>
  );
}
