const PATHS: Record<string, string> = {
  dinner: "M12 18.7a6.2 6.2 0 1 0 0-12.4 6.2 6.2 0 0 0 0 12.4zM12 15.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3.2 4.5v15M20.8 4.5c-1.3.8-1.8 2.7-1.8 5.5h1.8v9.5",
  brunch: "M4.5 10h11v3.5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5zM15.5 11h1.6a2.4 2.4 0 0 1 0 4.8h-1.6M8.5 3.8c-.8 1 .8 2 0 3.2M12 3.8c-.8 1 .8 2 0 3.2M3.5 21h14",
  run: "M4 19.5c3.6 0 3.6-5.5 7.2-5.5s3.6-5 6.8-5M18 9V3.5l3.2 1.6L18 6.7",
  workout: "M7 6.5v11M17 6.5v11M3.8 9.5v5M20.2 9.5v5M7 12h10",
  painting: "M14.5 4.5l5 5-8.2 8.2a3 3 0 0 1-2.1.9H5.5v-3.7a3 3 0 0 1 .9-2.1zM12 7l5 5M5.5 18.6l2.2-2.2",
  sauna: "M4 20h16M6 20v-7h12v7M8.5 9.5c-.9-1.1.9-2.1 0-3.2M12 9.5c-.9-1.1.9-2.1 0-3.2M15.5 9.5c-.9-1.1.9-2.1 0-3.2",
  gallery: "M3.5 5h17v14h-17zM3.5 16l5-5 4 4 2.5-2.5 5.5 5.5",
  show: "M3.5 7.5h17v3a1.8 1.8 0 0 0 0 3.6v3.4h-17v-3.4a1.8 1.8 0 0 0 0-3.6zM14.5 8.2v1.6M14.5 11.4v1.2M14.5 14.2v1.6",
  bar: "M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17zM12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9z",
  drinks: "M4.5 5h15L12 13zM12 13v7M8.5 20h7M16 2.8l-2 4",
  networking: "M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2.8 20c.8-3.2 2.8-5 5.2-5s4.4 1.8 5.2 5M10.8 20c.8-3.2 2.8-5 5.2-5s4.4 1.8 5.2 5",
  other: "M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17zM12 14.6a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2z",
};

export function KindIcon({ kind, className = "h-5 w-5" }: { kind: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[kind] ?? PATHS.other} />
    </svg>
  );
}
