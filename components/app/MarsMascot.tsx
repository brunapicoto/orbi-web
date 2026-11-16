/** Mars, ORBI's little astronaut planner. Drawn, so it stays crisp and loads instantly. */
export function MarsMascot({ className = "h-28 w-28", wave = false }: { className?: string; wave?: boolean }) {
  return (
    <svg viewBox="0 0 160 160" className={className} role="img" aria-label="mars, a little astronaut">
      {/* orbit ring with a tiny moon */}
      <ellipse cx="80" cy="96" rx="70" ry="20" fill="none" stroke="#C9D2FA" strokeOpacity="0.45" strokeWidth="1.5" strokeDasharray="3 5" />
      <circle cx="146" cy="92" r="4" fill="#8FA3F5" />
      {/* backpack */}
      <rect x="48" y="86" width="64" height="48" rx="18" fill="#C9D2FA" />
      {/* body */}
      <rect x="54" y="84" width="52" height="54" rx="22" fill="#F4F1F1" />
      <rect x="68" y="104" width="24" height="14" rx="5" fill="#7A1428" />
      <circle cx="74" cy="111" r="2.4" fill="#C9D2FA" />
      <circle cx="86" cy="111" r="2.4" fill="#8FA3F5" />
      {/* arms */}
      <rect x="40" y="94" width="18" height="12" rx="6" fill="#F4F1F1" transform="rotate(-20 49 100)" />
      <g className={wave ? "origin-[110px_98px] animate-[mars-wave_1.6s_ease-in-out_infinite]" : ""}>
        <rect x="102" y="86" width="18" height="12" rx="6" fill="#F4F1F1" transform="rotate(-40 111 92)" />
      </g>
      {/* legs */}
      <rect x="62" y="130" width="14" height="16" rx="6" fill="#F4F1F1" />
      <rect x="84" y="130" width="14" height="16" rx="6" fill="#F4F1F1" />
      {/* helmet */}
      <circle cx="80" cy="58" r="38" fill="#F4F1F1" />
      <circle cx="80" cy="58" r="38" fill="none" stroke="#8FA3F5" strokeWidth="3" />
      {/* visor with a face */}
      <rect x="52" y="40" width="56" height="40" rx="20" fill="#2a0a12" />
      <path d="M60 50c4-6 12-8 18-7" stroke="#F4F1F1" strokeOpacity="0.55" strokeWidth="3" strokeLinecap="round" fill="none" />
      <ellipse cx="70" cy="60" rx="4" ry="5" fill="#F4F1F1" />
      <ellipse cx="90" cy="60" rx="4" ry="5" fill="#F4F1F1" />
      <circle cx="71.3" cy="58.6" r="1.4" fill="#2a0a12" />
      <circle cx="91.3" cy="58.6" r="1.4" fill="#2a0a12" />
      <path d="M75 68c3 3 7 3 10 0" stroke="#F4F1F1" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      <ellipse cx="62" cy="68" rx="4" ry="2.4" fill="#e36b84" fillOpacity="0.7" />
      <ellipse cx="98" cy="68" rx="4" ry="2.4" fill="#e36b84" fillOpacity="0.7" />
      {/* antenna */}
      <path d="M80 20v-8" stroke="#F4F1F1" strokeWidth="3" strokeLinecap="round" />
      <circle cx="80" cy="9" r="5" fill="#7A1428" stroke="#F4F1F1" strokeWidth="2" />
    </svg>
  );
}
