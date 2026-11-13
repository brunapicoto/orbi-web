// Site-wide settings. Fill in the placeholders before launch.
export const SITE = {
  name: "orbi",
  title: "orbi · from mutuals to real connections",
  description: "any plan, three or more people, and nobody has to ask first. starting in new york.",
  // Set NEXT_PUBLIC_SITE_URL in Vercel once the domain is live.
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  // PLACEHOLDER: replace with the real address once the domain exists.
  contactEmail: "hello@[domain]",
  // PLACEHOLDER: replace with the real Instagram profile URL.
  instagramUrl: "",
} as const;

export const NAV_LINKS = [
  { href: "#how-it-works", label: "how it works" },
  { href: "#from-a-link", label: "from a link" },
  { href: "#memories", label: "memories" },
  { href: "#why", label: "why" },
  { href: "#faq", label: "faq" },
] as const;
