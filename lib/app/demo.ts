import "server-only";
import type { Store } from "@/lib/app/store";
import type { NewPlan, PlanStatus, PlanTeaser, PlanView } from "@/lib/app/types";

/**
 * Demo data, used only when Supabase keys are not set. Lives in server memory,
 * resets on restart, and follows the same rules as supabase/app.sql so the
 * preview behaves like the real thing. Everyone here is an example.
 */
type DemoPlan = NewPlan & { id: string; hostId: string; rsvps: string[]; photos: { id: string; url: string }[]; shareSlug?: string };

type DemoState = {
  me: { id: string; firstName: string | null; inviteCode: string };
  people: Record<string, string>;
  connections: string[];
  mutualsWithMe: Record<string, number>;
  plans: DemoPlan[];
  /** keep-in-orbit picks, keyed "planId:picker" */
  picks: Record<string, string[]>;
  prefs: import("@/lib/app/types").Prefs | null;
  memories: (import("@/lib/app/types").NewMemory & { id: string; createdBy: string; accepted: string[]; pending: string[]; photos: { id: string; url: string }[] })[];
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
    // lena added a memory with you; accept it to see it (shows the consent flow)
    memories: [
      { id: "m-lena", createdBy: "lena", kind: "brunch", place: "Sunday in Brooklyn", happenedOn: new Date(Date.now() - 12 * 86400_000).toISOString().slice(0, 10), note: "the pancakes were worth the line.", tagged: [ME, "naomi"], accepted: ["naomi"], pending: [ME], photos: [] },
    ],
    prefs: { kinds: ["run", "gallery", "sauna"], times: ["weekend-morning", "weekend-afternoon"], areas: ["brooklyn"], topics: ["finance"], groupSize: "small" },
    plans: [
      // happening now: the reveal
      { id: "p-dinner", hostId: "lena", kind: "dinner", place: "Estela, Nolita", note: "late dinner, I've had this one saved for months.", startsAt: hours(-0.3), openSpots: 3, bringing: 0, rsvps: [ME, "theo", "naomi"], lat: 40.7212, lng: -73.9952, neighborhood: "nolita", priceLevel: 3, photos: [] },
      // you're in, filling up
      { id: "p-run", hostId: "marcus", kind: "run", place: "East River loop", note: "easy 5k pace. coffee after.", startsAt: nyAt(3, 8), openSpots: 4, bringing: 0, rsvps: [ME, "iris"], lat: 40.7108, lng: -73.9772, neighborhood: "lower east side", priceLevel: 0, photos: [] },
      // open to you
      { id: "p-paint", hostId: "iris", kind: "painting", place: "Brooklyn Brush, Williamsburg", note: "", startsAt: nyAt(2, 19), openSpots: 4, bringing: 0, rsvps: ["theo", "sofia"], lat: 40.7181, lng: -73.9578, neighborhood: "williamsburg", priceLevel: 2, photos: [] },
      { id: "p-supper", hostId: "sofia", kind: "dinner", place: "Supper club, Bed-Stuy", note: "long table, family style. bring nothing.", startsAt: nyAt(5, 20), openSpots: 6, bringing: 0, rsvps: ["lena", "marcus", "naomi", "iris"], lat: 40.6872, lng: -73.9418, neighborhood: "bed-stuy", priceLevel: 2, photos: [] },
      { id: "p-net", hostId: "marcus", kind: "networking", topic: "finance", place: "Bryant Park Grill, Midtown", note: "breakfast before the markets open. buy-side, banks, anyone curious.", startsAt: nyAt(2, 8), openSpots: 4, bringing: 0, rsvps: ["sofia", "lena"], lat: 40.7536, lng: -73.9832, neighborhood: "midtown", priceLevel: 1, photos: [] },
      { id: "p-sauna", hostId: "theo", kind: "sauna", place: "Bathhouse, Flatiron", note: "cold plunge is optional. mostly.", startsAt: nyAt(4, 17), openSpots: 3, bringing: 0, rsvps: [], lat: 40.7411, lng: -73.9897, neighborhood: "flatiron", priceLevel: 2, photos: [] },
      { id: "p-gallery", hostId: "sofia", kind: "gallery", place: "Chelsea, 24th st openings", note: "bringing my roommate, she knows everyone at these.", startsAt: nyAt(3, 18), openSpots: 3, bringing: 1, rsvps: ["naomi"], lat: 40.7479, lng: -74.0047, neighborhood: "chelsea", priceLevel: 0, photos: [] },
      // made from links, around manhattan and brooklyn (the map)
      { id: "p-pasta", hostId: "lena", kind: "dinner", title: "pasta bar in the west village", place: "Via Carota, Grove St", neighborhood: "west village", lat: 40.7331, lng: -74.0037, priceLevel: 2, costNote: "about $45 each", sourceUrl: "https://www.tiktok.com/@pastagirl.nyc/video/1", sourceAuthor: "@pastagirl.nyc", note: "saw this and couldn't stop thinking about the cacio e pepe.", startsAt: nyAt(2, 20), openSpots: 3, bringing: 0, minPeople: 4, rsvps: ["theo", "naomi"], photos: [], shareSlug: "pasta-demo" },
      { id: "p-study", hostId: "naomi", kind: "study", title: "finals study session", place: "Butler Library, 3rd floor", neighborhood: "morningside heights", lat: 40.8064, lng: -73.9632, priceLevel: 0, note: "quiet hours, then tacos.", startsAt: nyAt(1, 14), openSpots: 4, bringing: 0, minPeople: 3, rsvps: ["iris"], photos: [] },
      { id: "p-uws", hostId: "theo", kind: "run", title: "riverside sunset run", place: "Riverside Park at 79th", neighborhood: "upper west side", lat: 40.7843, lng: -73.9845, priceLevel: 0, note: "6 miles, chatty pace.", startsAt: nyAt(1, 18), openSpots: 5, bringing: 0, minPeople: 3, rsvps: ["sofia", "marcus"], photos: [] },
      { id: "p-met", hostId: "iris", kind: "gallery", title: "the met after work", place: "The Met, 5th Ave", neighborhood: "upper east side", lat: 40.7794, lng: -73.9632, priceLevel: 1, costNote: "pay what you wish for ny residents", note: "", startsAt: nyAt(4, 18), openSpots: 4, bringing: 0, minPeople: 4, rsvps: ["lena", "theo"], photos: [] },
      { id: "p-soccer", hostId: "marcus", kind: "sport", title: "pickup soccer", place: "McCarren Park turf", neighborhood: "williamsburg", lat: 40.7205, lng: -73.9515, priceLevel: 0, note: "bring a light and a dark shirt.", startsAt: nyAt(5, 10), openSpots: 9, bringing: 0, minPeople: 8, rsvps: ["theo", "lena", "iris"], photos: [] },
      { id: "p-cook", hostId: "sofia", kind: "class", title: "handmade dumpling class", place: "Home Cooking NY, 117 W 26th", neighborhood: "midtown", lat: 40.7454, lng: -73.9925, priceLevel: 3, costNote: "$95, ingredients included", sourceUrl: "https://www.instagram.com/reel/demo", sourceAuthor: "@homecookingny", note: "", startsAt: nyAt(6, 19), openSpots: 5, bringing: 1, minPeople: 4, rsvps: ["naomi", "marcus"], photos: [] },
      // not in your orbit: never shown in the app. its link (/p/dumplings-demo) shows how a friend of a friend joins
      { id: "p-hidden", hostId: "eva", kind: "dinner", title: "dumplings in chinatown", place: "Nom Wah Tea Parlor", neighborhood: "chinatown", lat: 40.7142, lng: -73.9981, priceLevel: 1, costNote: "cash is easiest", note: "", startsAt: nyAt(2, 19), openSpots: 3, bringing: 0, minPeople: 3, rsvps: [], photos: [], shareSlug: "dumplings-demo" },
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
  const need = (p.minPeople ?? 3) - 1;
  const count = p.rsvps.length + p.bringing;
  if (now < start) return count < need ? "open" : "on";
  if (count < need) return "off";
  return now < start + 6 * 3600_000 ? "live" : "past";
}

function view(p: DemoPlan): PlanView {
  return {
    id: p.id, kind: p.kind, place: p.place, note: p.note || null, startsAt: p.startsAt, openSpots: p.openSpots,
    taken: p.rsvps.length, bringing: p.bringing, topic: p.topic ?? null, isHost: p.hostId === ME, joined: p.rsvps.includes(ME), status: status(p) as PlanStatus,
    title: p.title ?? null, shareSlug: slugOf(p), sourceUrl: p.sourceUrl ?? null, sourceAuthor: p.sourceAuthor ?? null,
    thumbnailUrl: p.thumbnailUrl ?? null, lat: p.lat ?? null, lng: p.lng ?? null, neighborhood: p.neighborhood ?? null,
    priceLevel: p.priceLevel ?? null, costNote: p.costNote ?? null, minPeople: p.minPeople ?? 3, showHost: p.showHost ?? false,
  };
}

const slugOf = (p: DemoPlan) => p.shareSlug ?? `${p.id.replace(/^p-/, "")}-demo`;

function teaserOf(p: DemoPlan): PlanTeaser | null {
  const st = status(p);
  if (st !== "open" && st !== "on" && st !== "live") return null;
  return {
    title: p.title ?? null, kind: p.kind, topic: p.topic ?? null, place: p.place, neighborhood: p.neighborhood ?? null, note: p.note || null,
    startsAt: p.startsAt, lat: p.lat ?? null, lng: p.lng ?? null, thumbnailUrl: p.thumbnailUrl ?? null, sourceAuthor: p.sourceAuthor ?? null,
    priceLevel: p.priceLevel ?? null, costNote: p.costNote ?? null, going: 1 + p.rsvps.length + p.bringing, minPeople: p.minPeople ?? 3,
    maxPeople: 1 + p.bringing + p.openSpots, status: st, hostName: p.showHost ? nameOf(p.hostId) : null,
    isHost: p.hostId === ME, joined: p.rsvps.includes(ME), connected: p.hostId === ME || connected(p.hostId, ME),
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

function memView(m: DemoState["memories"][number], invitedBy: string | null) {
  const names = [m.createdBy, ...m.accepted].filter((u) => u !== ME).map((u) => nameOf(u)).sort();
  return {
    id: m.id, kind: m.kind, place: m.place, happenedOn: m.happenedOn, note: m.note || null, isMine: m.createdBy === ME,
    withNames: names, waiting: m.createdBy === ME ? m.pending.length : 0, invitedBy,
  };
}

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
      if (!inPlan || new Date(p.startsAt).getTime() > Date.now() || p.rsvps.length + p.bringing < (p.minPeople ?? 3) - 1) return [];
      return [p.hostId, ...p.rsvps]
        .map((uid) => ({ id: uid, firstName: nameOf(uid), isHost: uid === p.hostId, isMe: uid === ME }))
        .sort((a, b) => Number(b.isHost) - Number(a.isHost) || a.firstName.localeCompare(b.firstName));
    },
    async groupMutuals(id) {
      const p = find(id);
      const inPlan = p.hostId === ME || p.rsvps.includes(ME);
      if (!inPlan || new Date(p.startsAt).getTime() > Date.now() || p.rsvps.length + p.bringing < (p.minPeople ?? 3) - 1) return 0;
      // demo stand-in for "different friends in common with the group": overlaps shrink the sum
      const counts = [p.hostId, ...p.rsvps].filter((u) => u !== ME).map((u) => s.mutualsWithMe[u] ?? 0);
      return Math.max(Math.max(0, ...counts), Math.round(counts.reduce((a, b) => a + b, 0) * 0.6));
    },
    async memories() {
      return s.memories
        .filter((m) => m.createdBy === ME || m.accepted.includes(ME))
        .map((m) => memView(m, null))
        .sort((a, b) => b.happenedOn.localeCompare(a.happenedOn));
    },
    async memoryInvites() {
      return s.memories
        .filter((m) => m.pending.includes(ME))
        .map((m) => ({ id: m.id, kind: m.kind, place: m.place, happenedOn: m.happenedOn, fromName: nameOf(m.createdBy) }));
    },
    async memory(id) {
      const m = s.memories.find((x) => x.id === id);
      if (!m) return null;
      if (m.createdBy === ME || m.accepted.includes(ME)) return memView(m, null);
      if (m.pending.includes(ME)) return { ...memView(m, nameOf(m.createdBy)), withNames: [], note: null };
      return null;
    },
    async addMemory(input) {
      if (input.happenedOn > new Date().toISOString().slice(0, 10)) throw new Error("a memory is something that already happened");
      const id = `m-${Math.random().toString(36).slice(2, 8)}`;
      const tagged = input.tagged.filter((t) => s.connections.includes(t));
      s.memories.push({ ...input, tagged, id, createdBy: ME, accepted: [], pending: tagged, photos: [] });
      return id;
    },
    async answerMemory(id, accept) {
      const m = s.memories.find((x) => x.id === id);
      if (!m || !m.pending.includes(ME)) return;
      m.pending = m.pending.filter((u) => u !== ME);
      if (accept) m.accepted.push(ME);
    },
    async memoryPhotos(id) {
      const m = s.memories.find((x) => x.id === id);
      return m && (m.createdBy === ME || m.accepted.includes(ME)) ? m.photos : [];
    },
    async uploadMemoryPhoto(id, file) {
      const m = s.memories.find((x) => x.id === id);
      if (!m || !(m.createdBy === ME || m.accepted.includes(ME))) throw new Error("not found");
      const buf = Buffer.from(await file.arrayBuffer());
      m.photos.push({ id: `mp-${m.photos.length + 1}`, url: `data:${file.type};base64,${buf.toString("base64")}` });
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
    async teaser(slug) {
      const p = s.plans.find((x) => slugOf(x) === slug);
      return p ? teaserOf(p) : null;
    },
    async linkHostName(slug) {
      const p = s.plans.find((x) => slugOf(x) === slug);
      return p && new Date(p.startsAt).getTime() > Date.now() ? nameOf(p.hostId) : null;
    },
    async joinViaLink(slug) {
      const p = s.plans.find((x) => slugOf(x) === slug);
      if (!p) throw new Error("plan not found");
      if (p.hostId === ME) throw new Error("you are hosting this plan");
      if (new Date(p.startsAt).getTime() <= Date.now()) throw new Error("this plan has started");
      if (!s.connections.includes(p.hostId)) s.connections.push(p.hostId);
      if (p.rsvps.includes(ME)) return p.id;
      if (p.rsvps.length >= p.openSpots) throw new Error("this plan is full");
      p.rsvps.push(ME);
      return p.id;
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
