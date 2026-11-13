export type PlanStatus = "open" | "on" | "live" | "past";

/** A plan as the signed-in person is allowed to see it. Never carries the host. */
export type PlanView = {
  id: string;
  kind: string;
  place: string;
  note: string | null;
  startsAt: string; // ISO
  openSpots: number;
  taken: number;
  /** friends the host is bringing who are not on orbi */
  bringing: number;
  /** for networking plans: the field (finance, consulting...) */
  topic: string | null;
  isHost: boolean;
  joined: boolean;
  status: PlanStatus;
  /** set for plans made from a link, or given a title */
  title: string | null;
  /** the public link is /p/<shareSlug> */
  shareSlug: string | null;
  sourceUrl: string | null;
  sourceAuthor: string | null;
  thumbnailUrl: string | null;
  lat: number | null;
  lng: number | null;
  neighborhood: string | null;
  /** 0 free, 1 $, 2 $$, 3 $$$ */
  priceLevel: number | null;
  costNote: string | null;
  /** everyone counted, host included; 3 or more */
  minPeople: number;
  showHost: boolean;
};

/** What anyone with the public link sees. Never who is in; the host only if they chose to show it. */
export type PlanTeaser = {
  title: string | null; kind: string; topic: string | null; place: string; neighborhood: string | null; note: string | null;
  startsAt: string; lat: number | null; lng: number | null; thumbnailUrl: string | null; sourceAuthor: string | null;
  priceLevel: number | null; costNote: string | null;
  going: number; minPeople: number; maxPeople: number; status: PlanStatus;
  hostName: string | null; isHost: boolean; joined: boolean; connected: boolean;
};

export type Person = { id: string; firstName: string; isHost: boolean; isMe: boolean };

/** Group-level trust signal: never about one person. `band` is null below the anonymity threshold. */
export type PlanSignal = { others: number; band: string | null };

export type Me = { id: string; email: string | null; firstName: string | null; inviteCode: string | null };

export type Photo = { id: string; url: string };

/** What you're into. Private: only used to order plans you already see. */
export type Prefs = { kinds: string[]; times: string[]; areas: string[]; topics: string[]; groupSize: "small" | "medium" | "big" | null };

/** A memory someone added by hand. Names are only of people who accepted. */
export type MemoryView = {
  id: string;
  kind: string;
  place: string;
  happenedOn: string; // YYYY-MM-DD
  note: string | null;
  isMine: boolean;
  withNames: string[];
  waiting: number;
  /** set when you were tagged and haven't answered yet */
  invitedBy: string | null;
  /** you made it or accepted your tag (can add photos, blur yourself). otherwise you see it through your network. */
  inIt: boolean;
  /** the place as a key, to group memories at the same spot */
  placeKey: string;
  /** the experience's rating: null until 3 different people who were there have rated */
  rating: number | null;
  ratings: number | null;
  /** your own stars, if you were there and rated (only ever shown to you) */
  myRating: number | null;
};

/** All the ratings at a place, or of one activity, that you can see. null until 3 different people rated. */
export type ExperienceSummary = { average: number | null; ratings: number | null; experiences: number };

export type MemoryInvite = { id: string; kind: string; place: string; happenedOn: string; fromName: string };

export type NewMemory = { kind: string; place: string; happenedOn: string; note: string; tagged: string[] };

export type NewPlan = {
  kind: string; place: string; note: string; startsAt: string; openSpots: number; bringing: number; topic?: string | null;
  title?: string | null; sourceUrl?: string | null; sourceAuthor?: string | null; thumbnailUrl?: string | null;
  lat?: number | null; lng?: number | null; neighborhood?: string | null; priceLevel?: number | null; costNote?: string | null;
  minPeople?: number; showHost?: boolean;
};

/** After a plan: who you picked to keep in your orbit, and who you're already connected to. */
export type OrbitState = { picked: string[]; connected: string[] };
