"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { geocode, parseFrames, platformOf, readLink, suggestPlan, type LinkSource, type PlanDraft } from "@/lib/app/fromLink";
import { askJuno, extractPlaces, placesFromLink, type JunoAsk, type JunoPick } from "@/lib/app/juno";
import type { NewPlace } from "@/lib/app/types";
import { KIND_IDS, TOPIC_IDS } from "@/lib/app/kinds";
import { friendly, getStore } from "@/lib/app/store";
import { supabaseConfigured, supabaseServer } from "@/lib/supabase/server";

export type FormState = { error?: string; fieldErrors?: Record<string, string>; ok?: boolean; sentTo?: string; id?: string };

const cleanName = (v: FormDataEntryValue | null) => String(v ?? "").trim().replace(/\s+/g, " ");

// ---------------------------------------------------------------- sign in

export async function sendMagicLink(_prev: FormState, fd: FormData): Promise<FormState> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const next = String(fd.get("next") ?? "/app");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { fieldErrors: { email: "that email doesn't look right." } };
  if (!supabaseConfigured()) redirect("/app");
  const sb = await supabaseServer();
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const safeNext = next.startsWith("/app") ? next : "/app";
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${site}/auth/callback?next=${encodeURIComponent(safeNext)}` },
  });
  if (error) return { error: "we couldn't send the link. wait a minute and try again." };
  return { ok: true, sentTo: email };
}

export async function signOut() {
  const store = await getStore();
  await store.signOut();
  redirect(store.demo ? "/app" : "/app/login");
}

// ---------------------------------------------------------------- profile

export async function saveName(_prev: FormState, fd: FormData): Promise<FormState> {
  const firstName = cleanName(fd.get("firstName"));
  const next = String(fd.get("next") ?? "");
  if (!firstName) return { fieldErrors: { firstName: "add your first name." } };
  if (firstName.length > 40) return { fieldErrors: { firstName: "keep it under 40 characters." } };
  const store = await getStore();
  try {
    const me = await store.me();
    if (me?.firstName) await store.updateName(firstName);
    else await store.createProfile(firstName);
  } catch (e) {
    return { error: friendly(e) };
  }
  revalidatePath("/app", "layout");
  if (next.startsWith("/app")) redirect(next);
  return { ok: true };
}

// ---------------------------------------------------------------- plans

export async function createPlan(_prev: FormState, fd: FormData): Promise<FormState> {
  const kind = String(fd.get("kind") ?? "");
  const place = cleanName(fd.get("place"));
  const note = String(fd.get("note") ?? "").trim();
  const startsAt = String(fd.get("startsAt") ?? "");
  const openSpots = Number(fd.get("openSpots"));
  const bringing = Number(fd.get("bringing") ?? 0);
  const topic = String(fd.get("topic") ?? "");
  const title = cleanName(fd.get("title")).toLowerCase();
  const minPeople = Number(fd.get("minPeople") ?? 3);
  const priceRaw = String(fd.get("priceLevel") ?? "");
  const priceLevel = priceRaw === "" ? null : Number(priceRaw);
  const costNote = cleanName(fd.get("costNote"));
  const neighborhood = cleanName(fd.get("neighborhood")).toLowerCase();
  const lat = fd.get("lat") ? Number(fd.get("lat")) : null;
  const lng = fd.get("lng") ? Number(fd.get("lng")) : null;
  const sourceUrl = String(fd.get("sourceUrl") ?? "").trim();
  const sourceAuthor = cleanName(fd.get("sourceAuthor"));
  const thumbnailUrl = String(fd.get("thumbnailUrl") ?? "").trim();
  const occasion = cleanName(fd.get("occasion")).toLowerCase().slice(0, 40);

  const fieldErrors: Record<string, string> = {};
  if (!KIND_IDS.includes(kind)) fieldErrors.kind = "pick what kind of plan it is.";
  else if (kind === "networking" && !TOPIC_IDS.includes(topic)) fieldErrors.kind = "pick the field for your networking plan.";
  if (title.length > 80) fieldErrors.title = "keep the title under 80 characters.";
  if (!place) fieldErrors.place = "add a place.";
  else if (place.length > 80) fieldErrors.place = "keep it under 80 characters.";
  if (note.length > 280) fieldErrors.note = "keep it under 280 characters.";
  if (costNote.length > 80) fieldErrors.costNote = "keep it under 80 characters.";
  const when = new Date(startsAt);
  if (!startsAt || Number.isNaN(when.getTime())) fieldErrors.startsAt = "pick a day and time.";
  else if (when.getTime() < Date.now() + 30 * 60_000) fieldErrors.startsAt = "pick a time at least 30 minutes from now.";
  if (!Number.isInteger(openSpots) || openSpots < 1) fieldErrors.openSpots = "open at least 1 spot for your mutuals.";
  else if (openSpots > 11) fieldErrors.openSpots = "11 open spots at most.";
  else if (!Number.isInteger(bringing) || bringing < 0 || bringing > 10) fieldErrors.openSpots = "check the group size.";
  else if (1 + bringing + openSpots < 3) fieldErrors.openSpots = "plans start at 3: you plus at least 2.";
  else if (!Number.isInteger(minPeople) || minPeople < 3 || minPeople > 1 + bringing + openSpots) fieldErrors.openSpots = "the minimum is between 3 and the size of the group.";
  if (priceLevel !== null && !(Number.isInteger(priceLevel) && priceLevel >= 0 && priceLevel <= 3)) fieldErrors.costNote = "pick a price.";
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  // the map pin: only kept if it's a real point around new york
  const pin = lat !== null && lng !== null && lat > 40.3 && lat < 41.2 && lng > -74.6 && lng < -73.4 ? { lat, lng } : { lat: null, lng: null };
  const fromLink = sourceUrl && platformOf(sourceUrl) ? sourceUrl.slice(0, 500) : null;

  const store = await getStore();
  let id: string;
  try {
    id = await store.createPlan({
      kind, place, note, startsAt: when.toISOString(), openSpots, bringing, topic: kind === "networking" ? topic : null,
      title: title || null, minPeople, priceLevel, costNote: costNote || null, neighborhood: neighborhood.slice(0, 40) || null, ...pin,
      sourceUrl: fromLink, sourceAuthor: fromLink ? sourceAuthor.slice(0, 60) || null : null,
      thumbnailUrl: fromLink && thumbnailUrl.startsWith("https://") && thumbnailUrl.length <= 1000 ? thumbnailUrl : null,
      occasion: occasion || null,
    });
  } catch (e) {
    return { error: friendly(e) };
  }
  revalidatePath("/app");
  redirect(`/app/plan/${id}?posted=1`);
}

// ---------------------------------------------------------------- plans from a link

export type DraftState = { error?: string; draft?: PlanDraft; source?: LinkSource; needsCaption?: boolean };

/** Paste a link: read it, ask for a draft. Nothing is saved until the person posts the plan. */
export async function draftFromLink(_prev: DraftState, fd: FormData): Promise<DraftState> {
  const url = String(fd.get("url") ?? "").trim();
  const caption = String(fd.get("caption") ?? "").trim().slice(0, 2000);
  const platform = platformOf(url);
  if (!platform) return { error: "paste a tiktok or instagram link (it starts with https://)." };
  const store = await getStore();
  if (!(await store.me())) return { error: "sign in first." };
  const frames = parseFrames(fd.getAll("frames").map(String));
  const source = await readLink(url, caption);
  if (!source.caption && !frames.length) {
    return {
      needsCaption: true,
      error: platform === "instagram"
        ? "instagram doesn't share captions with other apps. add the video below, or paste the caption."
        : "we couldn't read this video. add the video file below, or paste its caption.",
    };
  }
  const draft = await suggestPlan(source, frames);
  return { draft, source };
}

/** The pin picker's search box. */
export async function findPlace(query: string) {
  const store = await getStore();
  if (!(await store.me())) return null;
  return geocode(query);
}

/** "i'm in" from a public link: connect with the host, then join. */
export async function joinFromLink(slug: string): Promise<FormState> {
  const store = await getStore();
  try {
    await store.joinViaLink(slug);
  } catch (e) {
    return { error: friendly(e) };
  }
  revalidatePath("/app");
  revalidatePath(`/p/${slug}`);
  return { ok: true };
}

export async function cancelPlan(id: string) {
  const store = await getStore();
  await store.cancelPlan(id);
  revalidatePath("/app");
  redirect("/app");
}

export async function joinPlan(id: string): Promise<FormState> {
  const store = await getStore();
  try {
    await store.join(id);
  } catch (e) {
    return { error: friendly(e) };
  }
  revalidatePath("/app");
  revalidatePath(`/app/plan/${id}`);
  return { ok: true };
}

export async function leavePlan(id: string): Promise<FormState> {
  const store = await getStore();
  try {
    await store.leave(id);
  } catch (e) {
    return { error: friendly(e) };
  }
  revalidatePath("/app");
  revalidatePath(`/app/plan/${id}`);
  return { ok: true };
}

// ---------------------------------------------------------------- invites

export async function acceptInvite(code: string): Promise<FormState> {
  const store = await getStore();
  try {
    await store.acceptInvite(code);
  } catch (e) {
    return { error: friendly(e) };
  }
  revalidatePath("/app", "layout");
  redirect("/app/mutuals?joined=1");
}

// ---------------------------------------------------------------- photos

export async function uploadPhoto(_prev: FormState, fd: FormData): Promise<FormState> {
  const id = String(fd.get("planId") ?? "");
  const file = fd.get("photo");
  if (!(file instanceof File) || file.size === 0) return { error: "choose a photo first." };
  if (!/^image\/(jpeg|png|webp|heic|heif)$/.test(file.type)) return { error: "use a jpg, png, webp or heic photo." };
  if (file.size > 8 * 1024 * 1024) return { error: "that photo is over 8 mb. try a smaller one." };
  const store = await getStore();
  try {
    await store.uploadPhoto(id, file);
  } catch (e) {
    return { error: friendly(e) };
  }
  revalidatePath(`/app/plan/${id}`);
  return { ok: true };
}

// ---------------------------------------------------------------- keep in orbit

export async function keepInOrbit(id: string, target: string): Promise<FormState & { result?: "picked" | "connected" }> {
  const store = await getStore();
  try {
    const result = await store.keepInOrbit(id, target);
    revalidatePath(`/app/plan/${id}`);
    if (result === "connected") revalidatePath("/app/mutuals");
    return { ok: true, result };
  } catch (e) {
    return { error: friendly(e) };
  }
}

export async function dropOrbitPick(id: string, target: string): Promise<FormState> {
  const store = await getStore();
  try {
    await store.dropPick(id, target);
  } catch (e) {
    return { error: friendly(e) };
  }
  revalidatePath(`/app/plan/${id}`);
  return { ok: true };
}

// ---------------------------------------------------------------- what you're into

export async function savePrefs(_prev: FormState, fd: FormData): Promise<FormState> {
  const pick = (name: string, allowed: string[]) => fd.getAll(name).map(String).filter((v) => allowed.includes(v));
  const { TIMES, AREAS } = await import("@/lib/app/rank");
  const size = String(fd.get("groupSize") ?? "");
  const prefs = {
    kinds: pick("kinds", KIND_IDS.filter((k) => k !== "other")),
    times: pick("times", TIMES.map((t) => t.id)),
    areas: pick("areas", AREAS.map((a) => a.id)),
    topics: pick("topics", TOPIC_IDS),
    groupSize: (["small", "medium", "big"].includes(size) ? size : null) as "small" | "medium" | "big" | null,
  };
  const store = await getStore();
  try {
    await store.savePrefs(prefs);
  } catch (e) {
    return { error: friendly(e) };
  }
  revalidatePath("/app");
  const next = String(fd.get("next") ?? "");
  if (next.startsWith("/app")) redirect(next);
  return { ok: true };
}

// ---------------------------------------------------------------- memories you add yourself

export async function addMemory(_prev: FormState, fd: FormData): Promise<FormState> {
  const kind = String(fd.get("kind") ?? "");
  const place = cleanName(fd.get("place"));
  const happenedOn = String(fd.get("happenedOn") ?? "");
  const note = String(fd.get("note") ?? "").trim();
  const tagged = fd.getAll("tagged").map(String);
  const photo = fd.get("photo");

  const fieldErrors: Record<string, string> = {};
  if (!KIND_IDS.includes(kind)) fieldErrors.kind = "pick what it was.";
  if (!place) fieldErrors.place = "add where it was.";
  else if (place.length > 80) fieldErrors.place = "keep it under 80 characters.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(happenedOn)) fieldErrors.happenedOn = "pick the day.";
  if (note.length > 280) fieldErrors.note = "keep it under 280 characters.";
  if (photo instanceof File && photo.size > 0) {
    if (!/^image\/(jpeg|png|webp|heic|heif)$/.test(photo.type)) fieldErrors.photo = "use a jpg, png, webp or heic photo.";
    else if (photo.size > 8 * 1024 * 1024) fieldErrors.photo = "that photo is over 8 mb. try a smaller one.";
  }
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const store = await getStore();
  let id: string;
  try {
    const occasion = cleanName(fd.get("occasion")).toLowerCase().slice(0, 40) || null;
    const neighborhood = cleanName(fd.get("neighborhood")).toLowerCase().slice(0, 40) || null;
    id = await store.addMemory({ kind, place, happenedOn, note, tagged, occasion, neighborhood });
    if (photo instanceof File && photo.size > 0) await store.uploadMemoryPhoto(id, photo);
  } catch (e) {
    return { error: friendly(e) };
  }
  revalidatePath("/app/memories");
  // more photos to send: the page uploads them one by one, then opens the memory
  if (fd.get("stay") === "1") return { ok: true, id };
  redirect(`/app/memories/${id}?added=1`);
}

// ---------------------------------------------------------------- arriving, profile, privacy

/** "i'm at the door": after this, you see who's there */
export async function checkIn(planId: string): Promise<FormState> {
  const store = await getStore();
  try {
    await store.checkIn(planId);
  } catch (e) {
    return { error: friendly(e) };
  }
  revalidatePath(`/app/plan/${planId}`);
  revalidatePath("/app");
  return { ok: true };
}

export async function saveProfile(_prev: FormState, fd: FormData): Promise<FormState> {
  const bio = String(fd.get("bio") ?? "").trim().replace(/\s+/g, " ");
  const neighborhood = cleanName(fd.get("neighborhood")).toLowerCase();
  if (bio.length > 160) return { fieldErrors: { bio: "keep it under 160 characters." } };
  if (neighborhood.length > 40) return { fieldErrors: { neighborhood: "keep it under 40 characters." } };
  const store = await getStore();
  const me = await store.me();
  try {
    await store.updateProfile({ bio, neighborhood, appearInPicks: me?.appearInPicks ?? true });
  } catch (e) {
    return { error: friendly(e) };
  }
  revalidatePath("/app/you");
  return { ok: true };
}

export async function setAppearInPicks(on: boolean): Promise<FormState> {
  const store = await getStore();
  const me = await store.me();
  if (!me) return { error: "sign in first." };
  try {
    await store.updateProfile({ bio: me.bio ?? "", neighborhood: me.neighborhood ?? "", appearInPicks: on });
  } catch (e) {
    return { error: friendly(e) };
  }
  revalidatePath("/app/settings");
  return { ok: true };
}

export async function uploadAvatar(fd: FormData): Promise<FormState> {
  const file = fd.get("photo");
  if (!(file instanceof File) || file.size === 0) return { error: "choose a photo first." };
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return { error: "use a jpg, png or webp photo." };
  if (file.size > 4 * 1024 * 1024) return { error: "that photo is too big." };
  const store = await getStore();
  try {
    await store.uploadAvatar(file);
  } catch (e) {
    return { error: friendly(e) };
  }
  revalidatePath("/app/you");
  return { ok: true };
}

/** quietly: their plans and memories disappear for you, yours for them. they are never told. */
export async function blockPerson(userId: string): Promise<FormState> {
  const store = await getStore();
  try {
    await store.block(userId);
  } catch (e) {
    return { error: friendly(e) };
  }
  revalidatePath("/app", "layout");
  return { ok: true };
}

export async function unblockPerson(userId: string): Promise<FormState> {
  const store = await getStore();
  await store.unblock(userId);
  revalidatePath("/app/settings");
  return { ok: true };
}

export async function leaveOrbi() {
  const store = await getStore();
  await store.deleteMe();
  redirect(store.demo ? "/app" : "/");
}

/** decline, accept, or accept and blur yourself in the photos */
export async function answerMemory(id: string, accept: boolean, blur = false) {
  const store = await getStore();
  await store.answerMemory(id, accept);
  revalidatePath("/app/memories");
  revalidatePath("/app/pings");
  redirect(accept ? `/app/memories/${id}${blur ? "?blur=1" : ""}` : "/app/memories");
}

/** stars for an experience you were at. anonymous; the rating is about the experience, never the people. */
export async function rateMemory(id: string, stars: number): Promise<FormState> {
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) return { error: "pick 1 to 5 stars." };
  const store = await getStore();
  try {
    await store.rateMemory(id, stars);
  } catch (e) {
    return { error: friendly(e) };
  }
  revalidatePath(`/app/memories/${id}`);
  revalidatePath("/app/memories");
  return { ok: true };
}

/** a copy of a photo with you blurred, made on your phone, replaces the original */
export async function replaceMemoryPhoto(fd: FormData): Promise<FormState> {
  const memoryId = String(fd.get("memoryId") ?? "");
  const photoId = String(fd.get("photoId") ?? "");
  const file = fd.get("photo");
  if (!(file instanceof File) || file.size === 0 || file.type !== "image/jpeg") return { error: "something went wrong. please try again." };
  if (file.size > 4 * 1024 * 1024) return { error: "that photo is too big." };
  const store = await getStore();
  try {
    await store.replaceMemoryPhoto(memoryId, photoId, file);
  } catch (e) {
    return { error: friendly(e) };
  }
  revalidatePath(`/app/memories/${memoryId}`);
  revalidatePath("/app/memories");
  return { ok: true };
}

export async function uploadMemoryPhoto(_prev: FormState, fd: FormData): Promise<FormState> {
  const id = String(fd.get("planId") ?? "");
  const file = fd.get("photo");
  if (!(file instanceof File) || file.size === 0) return { error: "choose a photo first." };
  if (!/^image\/(jpeg|png|webp|heic|heif)$/.test(file.type)) return { error: "use a jpg, png, webp or heic photo." };
  if (file.size > 8 * 1024 * 1024) return { error: "that photo is over 8 mb. try a smaller one." };
  const store = await getStore();
  try {
    await store.uploadMemoryPhoto(id, file);
  } catch (e) {
    return { error: friendly(e) };
  }
  revalidatePath(`/app/memories/${id}`);
  return { ok: true };
}

// ---------------------------------------------------------------- your lists, and juno

const PLACE_CAT_IDS = ["coffee", "bar", "restaurant", "park", "gem", "activity", "other"];

export async function createList(_prev: FormState, fd: FormData): Promise<FormState> {
  const name = cleanName(fd.get("name")).toLowerCase();
  if (!name) return { fieldErrors: { name: "name your list." } };
  if (name.length > 40) return { fieldErrors: { name: "keep it under 40 characters." } };
  const store = await getStore();
  try {
    const id = await store.createList(name);
    revalidatePath("/app/lists");
    return { ok: true, id };
  } catch (e) {
    return { error: friendly(e) };
  }
}

export async function deleteList(id: string) {
  const store = await getStore();
  await store.deleteList(id);
  revalidatePath("/app/lists");
}

export async function deletePlace(id: string) {
  const store = await getStore();
  await store.deletePlace(id);
  revalidatePath("/app/lists");
}

export type ImportState = { error?: string; places?: NewPlace[]; by?: "ai" | "basic"; needsCaption?: boolean };

/** read places out of a tiktok/reel link (+ stills) or pasted notes. nothing is saved yet. */
export async function importPlaces(_prev: ImportState, fd: FormData): Promise<ImportState> {
  const store = await getStore();
  if (!(await store.me())) return { error: "sign in first." };
  const url = String(fd.get("url") ?? "").trim();
  const text = String(fd.get("text") ?? "").trim().slice(0, 6000);
  const frames = parseFrames(fd.getAll("frames").map(String));
  if (url) {
    if (!platformOf(url)) return { error: "paste a tiktok or instagram link (it starts with https://)." };
    const src = await readLink(url, text);
    if (!src.caption && !frames.length) return { needsCaption: true, error: "we couldn't read this video. add the video file, or paste its caption." };
    const res = await placesFromLink(src, frames);
    return res.places.length ? res : { error: "no specific place in this one. try another, or add it by hand." };
  }
  if (!text) return { error: "paste a link or your notes." };
  const res = await extractPlaces(text);
  return res.places.length ? res : { error: "we couldn't find places in that. one per line works best." };
}

/** save the places you picked to a list */
export async function savePlaces(listId: string, places: NewPlace[]): Promise<FormState> {
  const clean = places
    .slice(0, 40)
    .map((p) => ({
      name: String(p.name ?? "").trim().slice(0, 80),
      neighborhood: String(p.neighborhood ?? "").trim().toLowerCase().slice(0, 40) || null,
      category: (PLACE_CAT_IDS.includes(p.category) ? p.category : "other") as NewPlace["category"],
      note: String(p.note ?? "").trim().slice(0, 200) || null,
      sourceUrl: p.sourceUrl && platformOf(p.sourceUrl) ? p.sourceUrl.slice(0, 500) : null,
    }))
    .filter((p) => p.name);
  if (!clean.length) return { error: "pick at least one place." };
  const store = await getStore();
  try {
    await store.addPlaces(listId, clean);
  } catch (e) {
    return { error: friendly(e) };
  }
  revalidatePath("/app/lists");
  return { ok: true };
}

export async function addPlace(_prev: FormState, fd: FormData): Promise<FormState> {
  const listId = String(fd.get("listId") ?? "");
  const name = cleanName(fd.get("name"));
  if (!name) return { fieldErrors: { name: "add the place's name." } };
  return savePlaces(listId, [{ name, neighborhood: String(fd.get("neighborhood") ?? ""), category: String(fd.get("category") ?? "other") as NewPlace["category"], note: String(fd.get("note") ?? "") }]);
}

export type JunoState = { error?: string; pick?: JunoPick };

/** ask juno for a plan: small, medium or big, budget, neighborhood and mood. uses your lists and what's popular. */
export async function planWithJuno(_prev: JunoState, fd: FormData): Promise<JunoState> {
  const store = await getStore();
  if (!(await store.me())) return { error: "sign in first." };
  const size = fd.get("size") === "big" ? "big" : fd.get("size") === "medium" ? "medium" : "small";
  const budget = (["free", "$", "$$", "$$$"].includes(String(fd.get("budget"))) ? String(fd.get("budget")) : "$$") as JunoAsk["budget"];
  const when = fd.get("when") === "day" ? "day" : "night";
  const ask: JunoAsk = {
    size, budget, when,
    neighborhood: cleanName(fd.get("neighborhood")).toLowerCase().slice(0, 40),
    vibe: cleanName(fd.get("vibe")).toLowerCase().slice(0, 40),
    extra: String(fd.get("extra") ?? "").trim().slice(0, 200),
  };
  const day = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  const [lists, popular] = await Promise.all([store.lists(), store.popular(day(new Date(Date.now() - 60 * 86400_000)), day(new Date()), "place")]);
  const pick = await askJuno(ask, lists.flatMap((l) => l.places), popular);
  return { pick };
}
