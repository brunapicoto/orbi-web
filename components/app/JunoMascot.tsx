/** Juno, ORBI's little astronaut planner, named after the NASA probe orbiting Jupiter. Drawn, so it stays crisp. */
export function JunoMascot({ className = "h-28 w-28", wave = false }: { className?: string; wave?: boolean }) {
  return (
    <svg viewBox="0 0 720 760" className={className} role="img" aria-label="juno, a little astronaut">
      {/* orbit ring, behind the helmet, with a small moon */}
      <ellipse cx="360" cy="350" rx="330" ry="105" transform="rotate(-14 360 350)" fill="none" stroke="#8FA3F5" strokeWidth="18" />
      {/* feet */}
      <rect x="252" y="664" width="90" height="74" rx="37" fill="#D9D3D4" />
      <rect x="378" y="664" width="90" height="74" rx="37" fill="#D9D3D4" />
      {/* body */}
      <rect x="216" y="474" width="288" height="240" rx="120" fill="#F2F0EF" />
      {/* arms: left down, right up (waving) */}
      <rect x="128" y="508" width="150" height="86" rx="43" fill="#F2F0EF" transform="rotate(28 203 551)" />
      <g className={wave ? "origin-[470px_520px] animate-[juno-wave_1.6s_ease-in-out_infinite]" : ""}>
        <rect x="440" y="458" width="150" height="86" rx="43" fill="#F2F0EF" transform="rotate(-34 515 501)" />
      </g>
      {/* the orbi mark on the chest */}
      <circle cx="360" cy="600" r="51" fill="#7A1428" />
      <circle cx="360" cy="603" r="16" fill="#F4F1F1" />
      <circle cx="360" cy="577" r="7" fill="#F4F1F1" />
      <circle cx="338" cy="615" r="7" fill="#F4F1F1" />
      <circle cx="382" cy="615" r="7" fill="#F4F1F1" />
      {/* antenna */}
      <rect x="352" y="40" width="16" height="40" rx="6" fill="#F2F0EF" />
      <circle cx="360" cy="28" r="24" fill="#8FA3F5" />
      {/* helmet */}
      <circle cx="360" cy="300" r="228" fill="#F2F0EF" />
      {/* the ring passes in front on the right */}
      <path d="M582 236 C 660 226, 700 250, 690 280 C 680 310, 620 340, 560 372" fill="none" stroke="#8FA3F5" strokeWidth="18" strokeLinecap="round" />
      <circle cx="672" cy="264" r="27" fill="#C9D2FA" />
      {/* visor */}
      <rect x="180" y="180" width="360" height="258" rx="129" fill="#1C1416" />
      <path d="M233 246 C 255 218, 290 204, 330 200" fill="none" stroke="#F4F1F1" strokeOpacity="0.38" strokeWidth="14" strokeLinecap="round" />
      {/* eyes */}
      <ellipse cx="294" cy="309" rx="33" ry="45" fill="#8FA3F5" />
      <ellipse cx="426" cy="309" rx="33" ry="45" fill="#8FA3F5" />
      <circle cx="306" cy="291" r="12" fill="#F4F1F1" />
      <circle cx="438" cy="291" r="12" fill="#F4F1F1" />
      {/* cheeks and smile */}
      <ellipse cx="234" cy="369" rx="24" ry="15" fill="#A0404F" />
      <ellipse cx="486" cy="369" rx="24" ry="15" fill="#A0404F" />
      <path d="M330 372 C 345 388, 375 388, 390 372" fill="none" stroke="#8FA3F5" strokeWidth="12" strokeLinecap="round" />
    </svg>
  );
}
