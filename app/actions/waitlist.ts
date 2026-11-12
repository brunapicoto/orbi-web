"use server";

import { getSupabase } from "@/lib/supabase";

export type WaitlistState = {
  status: "idle" | "ok" | "duplicate" | "error";
  message?: string;
  fieldErrors?: { firstName?: string; email?: string; neighborhood?: string };
  values?: { firstName: string; email: string; neighborhood: string };
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function joinWaitlist(_prev: WaitlistState, formData: FormData): Promise<WaitlistState> {
  const firstName = String(formData.get("firstName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const neighborhood = String(formData.get("neighborhood") ?? "").trim();
  const values = { firstName, email, neighborhood };

  // honeypot: real people never fill this field
  if (String(formData.get("company") ?? "").length > 0) {
    return { status: "ok" };
  }

  const fieldErrors: WaitlistState["fieldErrors"] = {};
  if (!firstName) fieldErrors.firstName = "add your first name.";
  else if (firstName.length > 60) fieldErrors.firstName = "keep it under 60 characters.";
  if (!email) fieldErrors.email = "add your email.";
  else if (!EMAIL_RE.test(email) || email.length > 254) fieldErrors.email = "that email doesn't look right. check it and try again.";
  if (neighborhood.length > 80) fieldErrors.neighborhood = "keep it under 80 characters.";
  if (Object.keys(fieldErrors).length) return { status: "error", fieldErrors, values };

  const supabase = getSupabase();
  if (!supabase) {
    return {
      status: "error",
      message: "the waitlist isn't connected yet. please try again soon.",
      values,
    };
  }

  const { error } = await supabase
    .from("waitlist")
    .insert({ email, first_name: firstName, neighborhood: neighborhood || null });

  if (error) {
    // 23505: unique violation, the email is already on the list
    if (error.code === "23505") return { status: "duplicate", values };
    console.error("waitlist insert failed", error.code, error.message);
    return { status: "error", message: "something went wrong on our side. please try again in a minute.", values };
  }

  return { status: "ok", values };
}
