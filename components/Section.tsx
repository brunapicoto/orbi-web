type Props = {
  id?: string;
  tone?: "ink" | "bordeaux";
  label?: string;
  labelledBy?: string;
  className?: string;
  children: React.ReactNode;
};

/** A full-bleed band with the site's gutter and max width. */
export function Section({ id, tone = "ink", label, labelledBy, className = "", children }: Props) {
  const bg = tone === "bordeaux" ? "bg-bordeaux text-bone" : "bg-ink text-bone";
  return (
    <section id={id} aria-labelledby={labelledBy} className={`${bg} gutter py-24 md:py-36 ${className}`}>
      <div className="mx-auto w-full max-w-6xl">
        {label ? (
          <p className={`mono mb-8 ${tone === "bordeaux" ? "text-lavender-soft" : "text-muted-2"}`}>{label}</p>
        ) : null}
        {children}
      </div>
    </section>
  );
}
