import Link from "next/link";
import type { Metadata } from "next";
import { Faq } from "@/components/Faq";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { Section } from "@/components/Section";
import { FAQ } from "@/lib/faq";

export const metadata: Metadata = { title: "faq · orbi" };

export default function FaqPage() {
  return (
    <>
      <Nav />
      <main id="main" className="pt-24">
        <Section id="faq" labelledBy="faq-title" label="faq">
          <h1 id="faq-title" className="display mb-12 text-[clamp(2.75rem,7vw,5.5rem)]">
            questions, answered
          </h1>
          <Faq items={FAQ} />
          <Link
            href="/#waitlist"
            className="mono mt-14 inline-flex min-h-14 items-center rounded-full bg-bone px-8 text-[14px] text-bordeaux transition-colors hover:bg-lavender hover:text-ink"
          >
            join the waitlist
          </Link>
        </Section>
      </main>
      <Footer />
    </>
  );
}
