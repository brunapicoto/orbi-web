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
  mutualsWithMe: Record<string, number>;
  plans: DemoPlan[];
  /** keep-in-orbit picks, keyed "planId:picker" */
  picks: Record<string, string[]>;
  prefs: import("@/lib/app/types").Prefs | null;
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
    // friends each person has in common with you (example numbers)
    mutualsWithMe: { lena: 42, marcus: 18, iris: 9, theo: 65, sofia: 23, naomi: 31, eva: 0 },
    // eva was at the comedy show and already picked you; pick her back and you connect
    picks: { "p-past:eva": [ME] },
    prefs: { kinds: ["run", "gallery", "sauna"], times: ["weekend-morning", "weekend-afternoon"], areas: ["brooklyn"], groupSize: "small" },
    plans: [
      // happening now: the reveal
      { id: "p-dinner", hostId: "lena", kind: "dinner", place: "Estela, Nolita", note: "late dinner, I've had this one saved for months.", startsAt: hours(-0.3), openSpots: 3, bringing: 0, rsvps: [ME, "theo", "naomi"], photos: [] },
      // you're in, filling up
      { id: "p-run", hostId: "marcus", kind: "run", place: "East River loop", note: "easy 5k pace. coffee after.", startsAt: nyAt(3, 8), openSpots: 4, bringing: 0, rsvps: [ME, "iris"], photos: [] },
      // open to you
      { id: "p-paint", hostId: "iris", kind: "painting", place: "Brooklyn Brush, Williamsburg", note: "", startsAt: nyAt(2, 19), openSpots: 4, bringing: 0, rsvps: ["theo", "sofia"], photos: [] },
      { id: "p-supper", hostId: "sofia", kind: "dinner", place: "Supper club, Bed-Stuy", note: "long table, family style. bring nothing.", startsAt: nyAt(5, 20), openSpots: 6, bringing: 0, rsvps: ["lena", "marcus", "naomi", "iris"], photos: [] },
      { id: "p-sauna", hostId: "theo", kind: "sauna", place: "Bathhouse, Flatiron", note: "cold plunge is optional. mostly.", startsAt: nyAt(4, 17), openSpots: 3, bringing: 0, rsvps: [], photos: [] },
      { id: "p-gallery", hostId: "sofia", kind: "gallery", place: "Chelsea, 24th st openings", note: "bringing my roommate, she knows everyone at these.", startsAt: nyAt(3, 18), openSpots: 3, bringing: 1, rsvps: ["naomi"], photos: [] },
      // not your mutual's plan: never shown
      { id: "p-hidden", hostId: "eva", kind: "drinks", place: "somewhere you can't see", note: "", startsAt: nyAt(2, 21), openSpots: 3, bringing: 0, rsvps: [], photos: [] },
      // past
      { id: "p-past", hostId: "naomi", kind: "show", place: "Comedy Cellar", note: "", startsAt: nyAt(-3, 21), openSpots: 4, bringing: 0, rsvps: [ME, "lena", "marcus", "eva"], photos: [{ id: "ph-c", url: "/demo/comedy.jpg" }] },
      { id: "p-past2", hostId: "theo", kind: "run", place: "Williamsburg Bridge loop", note: "", startsAt: nyAt(-10, 8), openSpots: 4, bringing: 0, rsvps: [ME, "marcus", "iris"], photos: [{ id: "ph-r", url: "/demo/run.jpg" }] },
      { id: "p-past3", hostId: "iris", kind: "gallery", place: "Dia Beacon", note: "", startsAt: nyAt(-24, 13), openSpots: 3, bringing: 0, rsvps: [ME, "sofia", "naomi"], photos: [{ id: "ph-g", url: "/demo/gallery.jpg" }] },
      // didn't reach 3: gone
      { id: "p-off", hostId: "lena", kind: "brunch", place: "a brunch that didn't happen", note: "", startsAt: nyAt(-2, 11), openSpots: 3, bringing: 0, rsvps: [ME], photos: [] },
    ],
  };
}

const g = globalThis as unknown as { __orbiDemo?: DemoState };
const state = () => (g.__orbiDemo ??= seed());

const connected = (a: string, b: string) => a === ME ? state().connections.includes(b) : b === ME ? state().connections.includes(a) : false;

function status(p: DemoPlan): PlanStatus | "off" {
  const start = new Date(p.startsAt).getTime();
  const now = Date.now();
  const count = p.rsvps.length + p.bringing;
  if (now < start) return count < 2 ? "open" : "on";
  if (count < 2) return "off";
  return now < start + 6 * 3600_000 ? "live" : "past";
}

function view(p: DemoPlan): PlanView {
  return {
    id: p.id, kind: p.kind, place: p.place, note: p.note || null, startsAt: p.startsAt, openSpots: p.openSpots,
    taken: p.rsvps.length, bringing: p.bringing, isHost: p.hostId === ME, joined: p.rsvps.includes(ME), status: status(p) as PlanStatus,
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

// same bands as mutual_band() in supabase/app.sql
function band(n: number) {
  if (n < 1) return null;
  if (n >= 40) return "40+";
  if (n >= 20) return "20+";
  if (n >= 10) return "10+";
  if (n >= 5) return "5+";
  return "a few";
}

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
      if (!inPlan || new Date(p.startsAt).getTime() > Date.now() || p.rsvps.length + p.bringing < 2) return [];
      return [p.hostId, ...p.rsvps]
        .map((uid) => ({ id: uid, firstName: nameOf(uid), isHost: uid === p.hostId, isMe: uid === ME }))
        .sort((a, b) => Number(b.isHost) - Number(a.isHost) || a.firstName.localeCompare(b.firstName));
    },
    async groupMutuals(id) {
      const p = find(id);
      const inPlan = p.hostId === ME || p.rsvps.includes(ME);
      if (!inPlan || new Date(p.startsAt).getTime() > Date.now() || p.rsvps.length + p.bringing < 2) return 0;
      // demo stand-in for "different friends in common with the group": overlaps shrink the sum
      const counts = [p.hostId, ...p.rsvps].filter((u) => u !== ME).map((u) => s.mutualsWithMe[u] ?? 0);
      return Math.max(Math.max(0, ...counts), Math.round(counts.reduce((a, b) => a + b, 0) * 0.6));
    },
    async prefs() {
      return s.prefs;
    },
    async savePrefs(p) {
      s.prefs = p;
    },
    async orbitState(id) {
      return { picked: s.picks[`${id}:${ME}`] ?? [], connected: [...s.connections] };
    },
    async keepInOrbit(id, target) {
      const p = find(id);
      if (new Date(p.startsAt).getTime() > Date.now() || ![p.hostId, ...p.rsvps].includes(target)) throw new Error("plan not found");
      if (s.connections.includes(target)) return "connected";
      const key = `${id}:${ME}`;
      s.picks[key] = Array.from(new Set([...(s.picks[key] ?? []), target]));
      const theirs = Object.entries(s.picks).some(([k, v]) => k.endsWith(`:${target}`) && v.includes(ME));
      if (theirs) {
        s.connections.push(target);
        return "connected";
      }
      return "picked";
    },
    async dropPick(id, target) {
      const key = `${id}:${ME}`;
      s.picks[key] = (s.picks[key] ?? []).filter((u) => u !== target);
    },
    async signal(id) {
      const p = s.plans.find((x) => x.id === id);
      if (!p || !visible(p)) return null;
      const others = [p.hostId, ...p.rsvps].filter((u) => u !== ME);
      const avg = others.reduce((t, u) => t + (s.mutualsWithMe[u] ?? 0), 0) / Math.max(others.length, 1);
      return { others: others.length, band: others.length >= 4 ? band(avg) : null };
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
