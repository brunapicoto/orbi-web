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
      <section aria-labelledby="signin-title" className="flex flex-col gap-4">
        <h2 id="signin-title" className="display text-[1.6rem] leading-tight">
          already have an account? <span className="text-lavender">sign in here:</span>
        </h2>
        <LoginForm next={next.startsWith("/app") ? next : "/app"} />
      </section>
      <p className="text-[15px] text-muted">new here? use the same form. you&apos;ll get a link to sign up, then a friend&apos;s invite puts you in their orbit.</p>
    </div>
  );
}
