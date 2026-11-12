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
  { id: "other", label: "something else" },
] as const;

export type KindId = (typeof KINDS)[number]["id"];

export const KIND_IDS = KINDS.map((k) => k.id) as string[];

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
