// Plan types. Keep in sync with the check constraint on plans.kind in supabase/app.sql.
export const KINDS = [
  { id: "dinner", label: "dinner" },
  { id: "brunch", label: "brunch" },
  { id: "run", label: "run" },
  { id: "workout", label: "workout class" },
  { id: "painting", label: "painting" },
  { id: "sauna", label: "sauna" },
  { id: "gallery", label: "gallery" },
  { id: "show", label: "show" },
  { id: "bar", label: "game at the bar" },
  { id: "drinks", label: "drinks" },
  { id: "networking", label: "networking" },
  { id: "other", label: "something else" },
] as const;

export type KindId = (typeof KINDS)[number]["id"];

export const KIND_IDS = KINDS.map((k) => k.id) as string[];

// fields for networking plans. Keep in sync with plans_topic_check in supabase/app.sql.
export const TOPICS = [
  { id: "finance", label: "finance" },
  { id: "consulting", label: "consulting" },
  { id: "tech", label: "tech" },
  { id: "startups", label: "startups" },
  { id: "marketing", label: "marketing" },
  { id: "law", label: "law" },
  { id: "health", label: "health" },
  { id: "creative", label: "creative" },
  { id: "policy", label: "policy" },
  { id: "school", label: "school & mba" },
] as const;

export const TOPIC_IDS = TOPICS.map((t) => t.id) as string[];

export function topicLabel(id: string | null | undefined) {
  return TOPICS.find((t) => t.id === id)?.label ?? null;
}

/** "networking · finance", or just the kind. */
export function planLabel(p: { kind: string; topic?: string | null }) {
  const t = p.kind === "networking" ? topicLabel(p.topic) : null;
  return t ? `${kindLabel(p.kind)} · ${t}` : kindLabel(p.kind);
}

/** As a noun in a sentence: "a finance networking plan", "a dinner". */
export function planNoun(p: { kind: string; topic?: string | null }) {
  const t = p.kind === "networking" ? topicLabel(p.topic) : null;
  return p.kind === "networking" ? `${t ? `${t} ` : ""}networking plan` : kindLabel(p.kind);
}

export function kindLabel(id: string) {
  return KINDS.find((k) => k.id === id)?.label ?? id;
}

// Plans are in New York for now; show times there whatever the server's clock says.
export const TIME_ZONE = "America/New_York";

export function formatWhen(iso: string) {
  const d = new Date(iso);
  const day = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: TIME_ZONE }).format(d);
  const time = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: TIME_ZONE })
    .format(d)
    .replace(":00", "")
    .replace(" ", "")
    .toLowerCase();
  return `${day.toLowerCase()} · ${time}`;
}
