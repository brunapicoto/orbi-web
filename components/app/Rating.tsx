/** "★ 4.8/5 · 12 ratings". Shown only when there is a score (3 or more people rated). */
export function RatingLine({ rating, ratings, className = "" }: { rating: number | null; ratings: number | null; className?: string }) {
  if (rating == null || !ratings) return null;
  return (
    <span className={`mono inline-flex items-center gap-1.5 text-lavender ${className}`} aria-label={`rated ${rating.toFixed(1)} out of 5 from ${ratings} ratings`}>
      <Star filled className="h-3.5 w-3.5" />
      <span className="text-bone">{rating.toFixed(1)}</span>/5 · {ratings} {ratings === 1 ? "rating" : "ratings"}
    </span>
  );
}

export function Star({ filled, className = "h-4 w-4" }: { filled?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </svg>
  );
}
