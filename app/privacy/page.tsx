import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "privacy · orbi" };

const ITEMS = [
  {
    t: "who sees your plans",
    b: "only people you're connected with. a shared plan link shows a preview to anyone who has it: what, where, when and how many are in. never who.",
  },
  {
    t: "who's going",
    b: "nobody sees who else said yes, not even the host. names show only to people in the plan, after they check in at the door.",
  },
  {
    t: "the host",
    b: "always anonymous. people see how many friends they share with the host, never a name. if you join from a link and aren't connected to the host yet, joining connects you two.",
  },
  {
    t: "plans from a video",
    b: "when you paste a tiktok or reel, we read its public caption and thumbnail and send the caption to claude (anthropic's ai) to suggest the place, price and a day. nothing is posted until you check it. places are looked up on openstreetmap.",
  },
  {
    t: "your lists",
    b: "the places you save are only yours. nobody else sees your lists.",
  },
  {
    t: "juno, the planner",
    b: "when you ask juno for a plan, your group size, budget, neighborhood and mood, your saved places and the places popular in your network are sent to claude to suggest one plan. never who went anywhere.",
  },
  {
    t: "the map",
    b: "shows only plans from your connections and plans shared with you. there's no city-wide feed.",
  },
  {
    t: "your data",
    b: "your email is how you sign in. no password, no contacts upload.",
  },
];

export default function Privacy() {
  return (
    <main id="main" className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-10 bg-ink px-5 py-16 text-bone">
      <Link href="/" className="display self-start text-[1.75rem] text-lavender">orbi</Link>
      <h1 className="display text-[clamp(2.75rem,7vw,4.5rem)] leading-[0.95]">privacy, plainly</h1>
      <ul className="flex flex-col gap-8 border-t border-line pt-8">
        {ITEMS.map((i) => (
          <li key={i.t} className="flex flex-col gap-2">
            <h2 className="mono text-lavender">{i.t}</h2>
            <p className="text-muted">{i.b}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
