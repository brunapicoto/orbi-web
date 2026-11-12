import { Collage } from "@/components/Collage";
import { Faq } from "@/components/Faq";
import { Footer } from "@/components/Footer";
import { HowItWorks } from "@/components/HowItWorks";
import { Nav } from "@/components/Nav";
import { OrbitDial } from "@/components/OrbitDial";
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

export default function Home() {
  return (
    <>
      <Nav />
      <main id="main">
        {/* 1. hero */}
        <section id="top" aria-labelledby="hero-title" className="gutter relative overflow-hidden bg-bordeaux pb-20 pt-28 md:pb-28 md:pt-36">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-12 md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
            <div className="flex flex-col gap-7">
              <h1 id="hero-title" className="display text-[clamp(120px,26vw,300px)] leading-[0.8] tracking-[-0.06em] text-lavender">
                orbi
              </h1>
              <p className="display text-[clamp(1.9rem,4.4vw,3.25rem)] text-bone">from mutuals to real connections.</p>
              <p className="max-w-[34ch] text-lavender-soft">any plan, three or more people, and nobody has to ask first.</p>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-2">
                <a
                  href="#waitlist"
                  className="mono inline-flex min-h-14 items-center rounded-full bg-bone px-8 text-[14px] text-bordeaux transition-colors hover:bg-lavender hover:text-ink"
                >
                  join the waitlist
                </a>
                <span className="mono text-lavender-soft">starting in new york</span>
              </div>
            </div>
            <div className="mx-auto w-[min(78vw,420px)] md:w-full md:max-w-[460px]">
              <OrbitDial ring="rgba(201,210,250,0.35)" label="the orbit dial: a plan in the middle with three people around it" />
            </div>
          </div>
        </section>

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
          <HowItWorks />
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
