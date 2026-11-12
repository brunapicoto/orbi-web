import { redirect } from "next/navigation";
import { OrbitDial } from "@/components/OrbitDial";
import { LoginForm } from "@/components/app/Forms";
import { supabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  if (!supabaseConfigured()) redirect("/app");
  const { next = "/app", error } = await searchParams;
  return (
    <div className="flex flex-col gap-10 pt-6">
      <div className="w-20">
        <OrbitDial interactive={false} />
      </div>
      <header className="flex flex-col gap-3">
        <h1 className="display text-[4.5rem] leading-[0.85] text-lavender">orbi</h1>
        <p className="display text-[1.75rem]">from mutuals to real connections.</p>
      </header>
      {error ? (
        <p role="alert" className="mono text-lavender">
          that link expired or was already used. send yourself a new one.
        </p>
      ) : null}
      <LoginForm next={next.startsWith("/app") ? next : "/app"} />
    </div>
  );
}
