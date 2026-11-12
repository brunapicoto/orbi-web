import Link from "next/link";

export default function PlanNotFound() {
  return (
    <main id="main" className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 bg-ink px-5 text-bone">
      <h1 className="display text-[2.75rem] leading-[0.95]">this plan isn&apos;t available.</h1>
      <p className="text-muted">it may have happened already, or it didn&apos;t get enough people. ask whoever sent it for the next one.</p>
      <Link href="/" className="mono link-draw self-start text-lavender">what is orbi?</Link>
    </main>
  );
}
