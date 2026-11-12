"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { KIND_IDS } from "@/lib/app/kinds";
import { friendly, getStore } from "@/lib/app/store";
import { supabaseConfigured, supabaseServer } from "@/lib/supabase/server";

export type FormState = { error?: string; fieldErrors?: Record<string, string>; ok?: boolean; sentTo?: string };

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

  const fieldErrors: Record<string, string> = {};
  if (!KIND_IDS.includes(kind)) fieldErrors.kind = "pick what kind of plan it is.";
  if (!place) fieldErrors.place = "add a place.";
  else if (place.length > 80) fieldErrors.place = "keep it under 80 characters.";
  if (note.length > 280) fieldErrors.note = "keep it under 280 characters.";
  const when = new Date(startsAt);
  if (!startsAt || Number.isNaN(when.getTime())) fieldErrors.startsAt = "pick a day and time.";
  else if (when.getTime() < Date.now() + 30 * 60_000) fieldErrors.startsAt = "pick a time at least 30 minutes from now.";
  if (!Number.isInteger(openSpots) || openSpots < 1) fieldErrors.openSpots = "open at least 1 spot for your mutuals.";
  else if (openSpots > 11) fieldErrors.openSpots = "11 open spots at most.";
  else if (!Number.isInteger(bringing) || bringing < 0 || bringing > 10) fieldErrors.openSpots = "check the group size.";
  else if (1 + bringing + openSpots < 3) fieldErrors.openSpots = "plans start at 3: you plus at least 2.";
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const store = await getStore();
  let id: string;
  try {
    id = await store.createPlan({ kind, place, note, startsAt: when.toISOString(), openSpots, bringing });
  } catch (e) {
    return { error: friendly(e) };
  }
  revalidatePath("/app");
  redirect(`/app/plan/${id}?posted=1`);
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
