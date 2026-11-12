import "server-only";
import type { Store } from "@/lib/app/store";
import type { NewPlan, PlanStatus, PlanView } from "@/lib/app/types";

/**
 * Demo data, used only when Supabase keys are not set. Lives in server memory,
 * resets on restart, and follows the same rules as supabase/app.sql so the
 * preview behaves like the real thing. Everyone here is an example.
 */
type DemoPlan = NewPlan & { id: string; hostId: string; rsvps: string[]; photos: { id: string; url: string }[] };

type DemoState = {
  me: { id: string; firstName: string | null; inviteCode: string };
  people: Record<string, string>;
  connections: string[];
  plans: DemoPlan[];
};

const ME = "me";
const hours = (h: number) => new Date(Date.now() + h * 3600_000).toISOString();
/** a day from today at a New York clock time (demo only; assumes standard time, UTC-5) */
const nyAt = (days: number, hour: number) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(hour + 5, 0, 0, 0);
  return d.toISOString();
};

function seed(): DemoState {
  return {
    me: { id: ME, firstName: "alex", inviteCode: "demo4orbi" },
    people: { lena: "Lena", marcus: "Marcus", iris: "Iris", theo: "Theo", sofia: "Sofia", naomi: "Naomi", eva: "Eva" },
    connections: ["lena", "marcus", "iris", "theo", "sofia", "naomi"],
    plans: [
      // happening now: the reveal
      { id: "p-dinner", hostId: "lena", kind: "dinner", place: "Estela, Nolita", note: "late dinner, I've had this one saved for months.", startsAt: hours(-0.3), openSpots: 3, rsvps: [ME, "theo", "naomi"], photos: [] },
      // you're in, filling up
      { id: "p-run", hostId: "marcus", kind: "run", place: "East River loop", note: "easy 5k pace. coffee after.", startsAt: nyAt(3, 8), openSpots: 4, rsvps: [ME, "iris"], photos: [] },
      // open to you
      { id: "p-paint", hostId: "iris", kind: "painting", place: "Brooklyn Brush, Williamsburg", note: "", startsAt: nyAt(2, 19), openSpots: 4, rsvps: ["theo", "sofia"], photos: [] },
      { id: "p-sauna", hostId: "theo", kind: "sauna", place: "Bathhouse, Flatiron", note: "cold plunge is optional. mostly.", startsAt: nyAt(4, 17), openSpots: 3, rsvps: [], photos: [] },
      { id: "p-gallery", hostId: "sofia", kind: "gallery", place: "Chelsea, 24th st openings", note: "", startsAt: nyAt(3, 18), openSpots: 3, rsvps: ["naomi"], photos: [] },
      // not your mutual's plan: never shown
      { id: "p-hidden", hostId: "eva", kind: "drinks", place: "somewhere you can't see", note: "", startsAt: nyAt(2, 21), openSpots: 3, rsvps: [], photos: [] },
      // past
      { id: "p-past", hostId: "naomi", kind: "show", place: "Comedy Cellar", note: "", startsAt: nyAt(-3, 21), openSpots: 3, rsvps: [ME, "lena", "marcus"], photos: [] },
      // didn't reach 3: gone
      { id: "p-off", hostId: "lena", kind: "brunch", place: "a brunch that didn't happen", note: "", startsAt: nyAt(-2, 11), openSpots: 3, rsvps: [ME], photos: [] },
    ],
  };
}

const g = globalThis as unknown as { __orbiDemo?: DemoState };
const state = () => (g.__orbiDemo ??= seed());

const connected = (a: string, b: string) => a === ME ? state().connections.includes(b) : b === ME ? state().connections.includes(a) : false;

function status(p: DemoPlan): PlanStatus | "off" {
  const start = new Date(p.startsAt).getTime();
  const now = Date.now();
  const taken = p.rsvps.length;
  if (now < start) return taken < 2 ? "open" : "on";
  if (taken < 2) return "off";
  return now < start + 6 * 3600_000 ? "live" : "past";
}

function view(p: DemoPlan): PlanView {
  return {
    id: p.id, kind: p.kind, place: p.place, note: p.note || null, startsAt: p.startsAt, openSpots: p.openSpots,
    taken: p.rsvps.length, isHost: p.hostId === ME, joined: p.rsvps.includes(ME), status: status(p) as PlanStatus,
  };
}

function visible(p: DemoPlan) {
  const st = status(p);
  if (st === "off") return false;
  if (p.hostId === ME || p.rsvps.includes(ME)) return true;
  return connected(p.hostId, ME) && new Date(p.startsAt).getTime() > Date.now();
}

const find = (id: string) => {
  const p = state().plans.find((x) => x.id === id);
  if (!p || !visible(p)) throw new Error("plan not found");
  return p;
};

const nameOf = (id: string) => (id === ME ? state().me.firstName ?? "you" : state().people[id]);

export async function demoStore(): Promise<Store> {
  const s = state();
  return {
    demo: true,
    async me() {
      return { id: ME, email: "you@example.com", firstName: s.me.firstName, inviteCode: s.me.inviteCode };
    },
    async createProfile(firstName) { s.me.firstName = firstName; },
    async updateName(firstName) { s.me.firstName = firstName; },
    async plans() {
      return s.plans.filter(visible).map(view).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    },
    async plan(id) {
      const p = s.plans.find((x) => x.id === id);
      return p && visible(p) ? view(p) : null;
    },
    async people(id) {
      const p = find(id);
      const inPlan = p.hostId === ME || p.rsvps.includes(ME);
      if (!inPlan || new Date(p.startsAt).getTime() > Date.now() || p.rsvps.length < 2) return [];
      return [p.hostId, ...p.rsvps]
        .map((uid) => ({ id: uid, firstName: nameOf(uid), isHost: uid === p.hostId, isMe: uid === ME }))
        .sort((a, b) => Number(b.isHost) - Number(a.isHost) || a.firstName.localeCompare(b.firstName));
    },
    async createPlan(input) {
      if (new Date(input.startsAt).getTime() <= Date.now()) throw new Error("plan cannot start in the past");
      const id = `p-${Math.random().toString(36).slice(2, 8)}`;
      s.plans.push({ ...input, id, hostId: ME, rsvps: [], photos: [] });
      return id;
    },
    async cancelPlan(id) {
      const p = find(id);
      if (p.hostId === ME && new Date(p.startsAt).getTime() > Date.now()) s.plans = s.plans.filter((x) => x.id !== id);
    },
    async join(id) {
      const p = find(id);
      if (p.hostId === ME) throw new Error("you are hosting this plan");
      if (new Date(p.startsAt).getTime() <= Date.now()) throw new Error("this plan has started");
      if (p.rsvps.includes(ME)) return;
      if (p.rsvps.length >= p.openSpots) throw new Error("this plan is full");
      p.rsvps.push(ME);
    },
    async leave(id) {
      const p = find(id);
      if (new Date(p.startsAt).getTime() > Date.now()) p.rsvps = p.rsvps.filter((u) => u !== ME);
    },
    async mutuals() {
      return s.connections.map((id) => ({ id, firstName: s.people[id] })).sort((a, b) => a.firstName.localeCompare(b.firstName));
    },
    async inviteName(code) {
      return code === s.me.inviteCode ? s.me.firstName : code === "lena-demo" ? "Lena" : null;
    },
    async acceptInvite(code) {
      if (code === s.me.inviteCode) return "self";
      if (code === "lena-demo") return "Lena";
      throw new Error("this invite link does not work");
    },
    async photos(id) {
      return find(id).photos;
    },
    async uploadPhoto(id, file) {
      const p = find(id);
      if (new Date(p.startsAt).getTime() > Date.now()) throw new Error("not started");
      const buf = Buffer.from(await file.arrayBuffer());
      p.photos.push({ id: `ph-${p.photos.length + 1}`, url: `data:${file.type};base64,${buf.toString("base64")}` });
    },
    async signOut() {
      g.__orbiDemo = seed();
    },
  };
}
