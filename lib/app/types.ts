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
  isHost: boolean;
  joined: boolean;
  status: PlanStatus;
};

export type Person = { id: string; firstName: string; isHost: boolean; isMe: boolean };

export type Me = { id: string; email: string | null; firstName: string | null; inviteCode: string | null };

export type Photo = { id: string; url: string };

export type NewPlan = { kind: string; place: string; note: string; startsAt: string; openSpots: number };
