import type { Metadata, Viewport } from "next";
import { TabBar } from "@/components/app/TabBar";
import { supabaseConfigured } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "orbi",
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "orbi", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#0E0C0D",
  viewportFit: "cover",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const demo = !supabaseConfigured();
  return (
    <div className="min-h-dvh bg-ink text-bone">
      {demo ? (
        <p className="mono bg-lavender px-4 py-2 text-center text-[12px] text-ink" style={{ paddingTop: "max(8px, env(safe-area-inset-top, 0px))" }}>
          demo mode · example data, nothing is saved
        </p>
      ) : null}
      <main
        id="main"
        className="mx-auto w-full max-w-md px-5 pb-32"
        style={{ paddingTop: demo ? "24px" : "max(24px, env(safe-area-inset-top, 0px))" }}
      >
        {children}
      </main>
      <TabBar />
    </div>
  );
}
