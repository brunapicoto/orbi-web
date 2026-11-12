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
  isHost: boolean;
  joined: boolean;
  status: PlanStatus;
};

export type Person = { id: string; firstName: string; isHost: boolean; isMe: boolean };

/** Group-level trust signal: never about one person. `band` is null below the anonymity threshold. */
export type PlanSignal = { others: number; band: string | null };

export type Me = { id: string; email: string | null; firstName: string | null; inviteCode: string | null };

export type Photo = { id: string; url: string };

export type NewPlan = { kind: string; place: string; note: string; startsAt: string; openSpots: number; bringing: number };

/** After a plan: who you picked to keep in your orbit, and who you're already connected to. */
export type OrbitState = { picked: string[]; connected: string[] };
