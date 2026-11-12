type Props = {
  value: string;
  label: string;
  source: string;
  href: string;
};

/** A number with its source in mono underneath, linking out. */
export function StatCard({ value, label, source, href }: Props) {
  return (
    <article className="flex h-full flex-col gap-4 rounded-3xl bg-ink-2 p-7 ring-1 ring-line ring-inset md:p-8">
      <p className="display text-[clamp(3rem,7vw,4.5rem)] text-lavender">{value}</p>
      <p className="text-bone">{label}</p>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="mono link-draw mt-auto self-start text-muted-2"
      >
        {source}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    </article>
  );
}
