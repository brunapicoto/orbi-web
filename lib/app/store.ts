import "server-only";
import { supabaseConfigured, supabaseServer } from "@/lib/supabase/server";
import { demoStore } from "@/lib/app/demo";
import type { Me, NewPlan, Person, Photo, PlanStatus, PlanView } from "@/lib/app/types";

/** Everything the app reads and writes. Two implementations: Supabase, or demo data. */
export interface Store {
  demo: boolean;
  me(): Promise<Me | null>;
  createProfile(firstName: string): Promise<void>;
  updateName(firstName: string): Promise<void>;
  plans(): Promise<PlanView[]>;
  plan(id: string): Promise<PlanView | null>;
  people(id: string): Promise<Person[]>;
  createPlan(input: NewPlan): Promise<string>;
  cancelPlan(id: string): Promise<void>;
  join(id: string): Promise<void>;
  leave(id: string): Promise<void>;
  mutuals(): Promise<{ id: string; firstName: string }[]>;
  inviteName(code: string): Promise<string | null>;
  acceptInvite(code: string): Promise<string>;
  photos(id: string): Promise<Photo[]>;
  uploadPhoto(id: string, file: File): Promise<void>;
  signOut(): Promise<void>;
}

export async function getStore(): Promise<Store> {
  return supabaseConfigured() ? supabaseStore() : demoStore();
}

/** Turns database errors into short, plain messages people can act on. */
export function friendly(err: unknown): string {
  const msg = err instanceof Error ? err.message : typeof err === "object" && err && "message" in err ? String((err as { message: unknown }).message) : "";
  if (/full/.test(msg)) return "this plan just filled up.";
  if (/started/.test(msg)) return "this plan has already started.";
  if (/hosting/.test(msg)) return "you're hosting this one.";
  if (/invite link/.test(msg)) return "this invite link doesn't work. ask for a new one.";
  if (/profile first/.test(msg)) return "add your first name first.";
  if (/not found/.test(msg)) return "this plan isn't available.";
  return "something went wrong. please try again.";
}

async function supabaseStore(): Promise<Store> {
  const sb = await supabaseServer();

  const uid = async () => {
    const { data } = await sb.auth.getUser();
    if (!data.user) throw new Error("not signed in");
    return data.user.id;
  };

  type Row = {
    id: string; kind: string; place: string; note: string | null; starts_at: string;
    open_spots: number; taken: number; is_host: boolean; joined: boolean; status: PlanStatus;
  };
  const toView = (r: Row): PlanView => ({
    id: r.id, kind: r.kind, place: r.place, note: r.note, startsAt: r.starts_at, openSpots: r.open_spots,
    taken: r.taken, isHost: r.is_host, joined: r.joined, status: r.status,
  });

  const store: Store = {
    demo: false,
    async me() {
      const { data } = await sb.auth.getUser();
      if (!data.user) return null;
      const { data: p } = await sb.from("profiles").select("first_name, invite_code").eq("id", data.user.id).maybeSingle();
      return { id: data.user.id, email: data.user.email ?? null, firstName: p?.first_name ?? null, inviteCode: p?.invite_code ?? null };
    },
    async createProfile(firstName) {
      const id = await uid();
      const { error } = await sb.from("profiles").upsert({ id, first_name: firstName });
      if (error) throw error;
    },
    async updateName(firstName) {
      const id = await uid();
      const { error } = await sb.from("profiles").update({ first_name: firstName }).eq("id", id);
      if (error) throw error;
    },
    async plans() {
      const { data, error } = await sb.rpc("my_plans");
      if (error) throw error;
      return (data as Row[]).map(toView);
    },
    async plan(id) {
      return (await store.plans()).find((p) => p.id === id) ?? null;
    },
    async people(id) {
      const { data, error } = await sb.rpc("plan_people", { p: id });
      if (error) throw error;
      return (data as { user_id: string; first_name: string; is_host: boolean; is_me: boolean }[]).map((r) => ({
        id: r.user_id, firstName: r.first_name, isHost: r.is_host, isMe: r.is_me,
      }));
    },
    async createPlan(input) {
      const { data, error } = await sb
        .from("plans")
        .insert({ kind: input.kind, place: input.place, note: input.note || null, starts_at: input.startsAt, open_spots: input.openSpots })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    async cancelPlan(id) {
      const { error } = await sb.from("plans").delete().eq("id", id);
      if (error) throw error;
    },
    async join(id) {
      const { error } = await sb.rpc("join_plan", { p: id });
      if (error) throw error;
    },
    async leave(id) {
      const { error } = await sb.rpc("leave_plan", { p: id });
      if (error) throw error;
    },
    async mutuals() {
      const me = await uid();
      const { data: rows, error } = await sb.from("connections").select("user_a, user_b");
      if (error) throw error;
      const ids = (rows ?? []).map((r) => (r.user_a === me ? r.user_b : r.user_a));
      if (!ids.length) return [];
      const { data: people, error: e2 } = await sb.from("profiles").select("id, first_name").in("id", ids).order("first_name");
      if (e2) throw e2;
      return (people ?? []).map((p) => ({ id: p.id, firstName: p.first_name }));
    },
    async inviteName(code) {
      const { data } = await sb.rpc("invite_name", { code });
      return (data as string | null) ?? null;
    },
    async acceptInvite(code) {
      const { data, error } = await sb.rpc("accept_invite", { code });
      if (error) throw error;
      return data as string;
    },
    async photos(id) {
      const { data, error } = await sb.from("plan_photos").select("id, path").eq("plan_id", id).order("created_at");
      if (error || !data?.length) return [];
      const { data: signed } = await sb.storage.from("plan-photos").createSignedUrls(data.map((d) => d.path), 60 * 60);
      return data
        .map((d, i) => ({ id: d.id, url: signed?.[i]?.signedUrl ?? "" }))
        .filter((p) => p.url);
    },
    async uploadPhoto(id, file) {
      const ext = (file.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
      const path = `${id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await sb.storage.from("plan-photos").upload(path, file, { contentType: file.type });
      if (error) throw error;
      const { error: e2 } = await sb.from("plan_photos").insert({ plan_id: id, path });
      if (e2) throw e2;
    },
    async signOut() {
      await sb.auth.signOut();
    },
  };
  return store;
}
