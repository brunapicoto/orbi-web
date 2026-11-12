import fs from "node:fs";
import path from "node:path";
import { Collage } from "@/components/Collage";
import { Faq } from "@/components/Faq";
import { Footer } from "@/components/Footer";
import { Hero, type SceneSlot } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { Nav } from "@/components/Nav";
import { PlanTicket } from "@/components/PlanTicket";
import { Reveal } from "@/components/Reveal";
import { Section } from "@/components/Section";
import { StatCard } from "@/components/StatCard";
import { WaitlistForm } from "@/components/WaitlistForm";

const PROBLEMS = [
  {
    title: "social risk",
    body: "Asking first means risking a no, a slow reply, or looking needy. So nobody asks.",
  },
  {
    title: "coordination burden",
    body: "Calendars, group chats, five different apps. Organizing a simple plan is exhausting.",
  },
  {
    title: "more noise, less connection",
    body: "We follow hundreds of people and see very few of them.",
  },
];

const TICKETS = [
  { what: "painting class", when: "tue 7pm", spots: "2 spots left" },
  { what: "run club", when: "sat 8am" },
  { what: "sauna", when: "sun 5pm" },
  { what: "dinner", when: "thu 8pm" },
  { what: "gallery opening", when: "fri 6pm" },
];

const DIFFERENT = [
  { title: "nobody asks first", body: "The blind RSVP removes the risk of inviting." },
  { title: "mutuals, not strangers", body: "We activate the network you already have." },
  { title: "plans, not content", body: "No feed, no likes, no follower count." },
  { title: "groups by design", body: "3+ people per plan, every time." },
];

const STATS = [
  {
    value: "1 in 6",
    label: "people worldwide feel lonely.",
    source: "who commission on social connection, 2025",
    href: "https://www.who.int/groups/commission-on-social-connection",
  },
  {
    value: "3% → 12%",
    label: "of Americans with no close friends, 1990 to 2021.",
    source: "survey center on american life",
    href: "https://www.americansurveycenter.org/research/the-state-of-american-friendship/",
  },
  {
    value: "1 in 4",
    label: "Americans ate every meal alone the day before.",
    source: "world happiness report 2025",
    href: "https://worldhappiness.report/ed/2025/sharing-meals-with-others-how-sharing-meals-supports-happiness-and-social-connections/",
  },
  {
    value: "200 hours",
    label: "together to become close friends.",
    source: "hall, university of kansas, 2018",
    href: "https://news.ku.edu/2018/03/06/study-reveals-number-hours-it-takes-make-friend",
  },
];

const FAQ = [
  {
    q: "is this a dating app?",
    a: "No. Every plan has at least 3 people, and it's about friendship and real connection.",
  },
  {
    q: "who can see my plans?",
    a: "Only your accepted connections. Nobody sees who else is going until you meet.",
  },
  {
    q: "what if nobody joins?",
    a: "If a plan doesn't reach 3, it quietly doesn't happen. Nobody is notified of a no.",
  },
  { q: "where does it launch?", a: "New York first, starting with a few close-knit communities." },
  { q: "how much does it cost?", a: "Free for users." },
];

// Illustrations for the hero cards. PLACEHOLDER until the files exist in /public/scenes/.
function sceneSlots(): [SceneSlot, SceneSlot] {
  const has = (f: string) => fs.existsSync(path.join(process.cwd(), "public", "scenes", f));
  return [
    { file: "scene-3.jpg", label: "the same street, together", alt: "friends in small groups out together on a new york street", available: has("scene-3.jpg") },
    { file: "scene-1.jpg", label: "orbi café no. 1", alt: "friends gathered outside a corner café at night", available: has("scene-1.jpg") },
  ];
}

// How-it-works illustrations in /public/how/ (step-1.jpg, step-2.jpg, step-3.jpg).
function stepImages(): boolean[] {
  return [1, 2, 3].map((n) => fs.existsSync(path.join(process.cwd(), "public", "how", `step-${n}.jpg`)));
}

export default function Home() {
  return (
    <>
      <Nav />
      <main id="main">
        {/* 1. hero */}
        <Hero scenes={sceneSlots()} />

        {/* 2. the problem */}
        <Section id="problem" labelledBy="problem-title" label="the problem">
          <Reveal>
            <h2 id="problem-title" className="display text-[clamp(2.75rem,7vw,5.5rem)]">
              plans die before they happen
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <blockquote className="display mt-12 text-[clamp(2rem,5.5vw,4.25rem)] text-lavender">
              &ldquo;we should get dinner sometime.&rdquo;
            </blockquote>
          </Reveal>
          <ul className="mt-16 grid gap-10 border-t border-line pt-10 md:grid-cols-3 md:gap-12">
            {PROBLEMS.map((p, i) => (
              <Reveal as="li" key={p.title} delay={i * 0.08} className="flex flex-col gap-3">
                <h3 className="mono text-lavender">{p.title}</h3>
                <p className="text-muted">{p.body}</p>
              </Reveal>
            ))}
          </ul>
          <div className="mt-20">
            <Collage />
          </div>
        </Section>

        {/* 3. the insight */}
        <section aria-label="the insight" className="gutter bg-bordeaux py-28 md:py-44">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 md:gap-6">
            <Reveal as="p" className="display text-[clamp(2.1rem,6vw,5rem)] text-bone">
              your feed shows you other people&apos;s lives.
            </Reveal>
            <Reveal as="p" delay={0.12} className="display text-[clamp(2.1rem,6vw,5rem)] text-bone">
              dating apps put you in a window.
            </Reveal>
            <Reveal as="p" delay={0.24} className="display text-[clamp(2.1rem,6vw,5rem)] text-lavender">
              orbi gets you in the room.
            </Reveal>
          </div>
        </section>

        {/* 4. how it works */}
        <Section id="how-it-works" labelledBy="how-title" label="how it works">
          <h2 id="how-title" className="sr-only">
            how it works
          </h2>
          <HowItWorks images={stepImages()} />
        </Section>

        {/* 5. any plan */}
        <section aria-labelledby="plans-title" className="bg-ink pb-24 md:pb-36">
          <div className="gutter mx-auto mb-10 flex w-full max-w-6xl flex-wrap items-end justify-between gap-4">
            <h2 id="plans-title" className="display text-[clamp(2.75rem,7vw,5.5rem)]">
              any plan
            </h2>
            <p className="mono text-muted-2">examples</p>
          </div>
          <ul
            aria-label="example plans"
            className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 pl-[max(20px,calc((100vw-72rem)/2+20px))] pr-5 [scroll-padding-left:max(20px,calc((100vw-72rem)/2+20px))]"
            tabIndex={0}
          >
            {TICKETS.map((t) => (
              <PlanTicket key={t.what} {...t} />
            ))}
          </ul>
        </section>

        {/* 6. why it's different */}
        <Section id="why" labelledBy="why-title" label="why it's different" className="border-t border-line">
          <h2 id="why-title" className="sr-only">
            why it&apos;s different
          </h2>
          <ul className="grid gap-px overflow-hidden rounded-3xl bg-line ring-1 ring-line md:grid-cols-2">
            {DIFFERENT.map((d, i) => (
              <Reveal as="li" key={d.title} delay={(i % 2) * 0.08} className="flex flex-col gap-4 bg-ink-2 p-8 md:p-12">
                <h3 className="display text-[clamp(1.9rem,3.6vw,2.75rem)]">{d.title}</h3>
                <p className="text-muted">{d.body}</p>
              </Reveal>
            ))}
          </ul>
          <Reveal>
            <p className="display mt-16 max-w-[24ch] text-[clamp(1.9rem,4.4vw,3.25rem)]">
              group chats need consensus. <span className="text-lavender">orbi removes the need for it.</span>
            </p>
          </Reveal>
        </Section>

        {/* 7. why now */}
        <Section id="why-now" labelledBy="now-title" label="why now" className="border-t border-line">
          <h2 id="now-title" className="sr-only">
            why now
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {STATS.map((s, i) => (
              <Reveal as="li" key={s.value} delay={(i % 2) * 0.08}>
                <StatCard {...s} />
              </Reveal>
            ))}
          </ul>
        </Section>

        {/* 8. waitlist */}
        <Section id="waitlist" tone="bordeaux" labelledBy="waitlist-title">
          <div className="grid gap-12 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] md:gap-20">
            <div className="flex flex-col gap-6">
              <h2 id="waitlist-title" className="display text-[clamp(2.75rem,7vw,5.5rem)] text-lavender">
                be there when it starts
              </h2>
              <p className="max-w-[36ch] text-lavender-soft">we&apos;re launching in new york. join the list and bring your mutuals.</p>
            </div>
            <WaitlistForm />
          </div>
        </Section>

        {/* 9. faq */}
        <Section id="faq" labelledBy="faq-title" label="faq">
          <h2 id="faq-title" className="sr-only">
            frequently asked questions
          </h2>
          <Faq items={FAQ} />
        </Section>
      </main>
      <Footer />
    </>
  );
}
