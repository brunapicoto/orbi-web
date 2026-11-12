type Props = {
  what: string;
  when: string;
  spots?: string;
};

/** An illustrative plan, styled as a tear-off ticket. */
export function PlanTicket({ what, when, spots }: Props) {
  return (
    <li className="ticket flex w-[260px] shrink-0 snap-start flex-col justify-between gap-10 rounded-2xl bg-ink-2 px-7 py-6 ring-1 ring-line ring-inset md:w-[300px]">
      <div className="flex items-start justify-between gap-4">
        <span className="display text-[2rem] leading-none text-bone">{what}</span>
        <svg viewBox="0 0 120 120" className="mt-1 h-6 w-6 shrink-0" aria-hidden="true">
          <circle cx="60" cy="60" r="19" fill="#8FA3F5" />
          <circle cx="60" cy="29" r="8" fill="#8FA3F5" />
          <circle cx="86.8" cy="75.5" r="8" fill="#8FA3F5" />
          <circle cx="33.2" cy="75.5" r="8" fill="#8FA3F5" />
        </svg>
      </div>
      <div className="flex flex-col gap-1 border-t border-dashed border-line pt-4">
        <span className="mono text-muted">{when}</span>
        <span className="mono text-lavender">{spots ?? "open spots"}</span>
      </div>
    </li>
  );
}
