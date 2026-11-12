// The six map/filter categories, and which plan types fall in each.
// Plan types stay detailed (lib/app/kinds.ts); categories group them for the map, filters and the AI.
export const CATEGORIES = [
  { id: "dinner", label: "dinner", kinds: ["dinner", "brunch"], color: "#7A1428", ink: "#F4F1F1" },
  { id: "drinks", label: "drinks", kinds: ["drinks", "bar"], color: "#C9D2FA", ink: "#0E0C0D" },
  { id: "sport", label: "sport", kinds: ["run", "workout", "sport", "sauna"], color: "#8FA3F5", ink: "#0E0C0D" },
  { id: "study", label: "study", kinds: ["study", "networking"], color: "#F4F1F1", ink: "#0E0C0D" },
  { id: "culture", label: "culture", kinds: ["gallery", "show", "painting", "class"], color: "#B9B3B5", ink: "#0E0C0D" },
  { id: "other", label: "other", kinds: ["other"], color: "#9C9597", ink: "#0E0C0D" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export function categoryOf(kind: string): (typeof CATEGORIES)[number] {
  return CATEGORIES.find((c) => (c.kinds as readonly string[]).includes(kind)) ?? CATEGORIES[CATEGORIES.length - 1];
}

/** The closest plan type for a category the AI suggests. */
export function kindForCategory(category: string, hint = ""): string {
  const h = hint.toLowerCase();
  switch (category) {
    case "dinner":
      return /brunch|breakfast|coffee/.test(h) ? "brunch" : "dinner";
    case "drinks":
      return /arcade|darts|trivia|game|bowling|pool/.test(h) ? "bar" : "drinks";
    case "sport":
      return /run|5k|10k|jog/.test(h) ? "run" : /yoga|pilates|class|spin|gym|barre/.test(h) ? "workout" : /sauna|spa|bathhouse/.test(h) ? "sauna" : "sport";
    case "study":
      return /network|career|coffee chat|industry/.test(h) ? "networking" : "study";
    case "culture":
      return /museum|gallery|exhibit|met\b|moma/.test(h) ? "gallery" : /cook|class|workshop|pottery/.test(h) ? "class" : /paint/.test(h) ? "painting" : "show";
    default:
      return "other";
  }
}
