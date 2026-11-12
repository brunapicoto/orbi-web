# orbi-web

The landing page and waitlist for orbi. Next.js (App Router), TypeScript, Tailwind CSS v4, Framer Motion, Supabase.

## Run locally

```bash
npm install
cp .env.example .env.local   # then fill in the Supabase keys
npm run dev
```

## Supabase

1. Create a project, open the SQL editor and run `supabase/waitlist.sql`. It creates the `waitlist` table with a case-insensitive unique email, turns on row level security and allows anon to insert only (no reads).
2. Copy the project URL and the anon key into `.env.local` and into the Vercel project's environment variables.

Without the keys the site still builds and runs; the form shows "the waitlist isn't connected yet."

## Deploy (Vercel)

Import this repo in Vercel. Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `NEXT_PUBLIC_SITE_URL` (the live domain, used for Open Graph links).

## Placeholders to fill

- `public/collage/01.jpg`, `02.jpg`, `03.jpg`: black-and-white cutout photos. Until they exist, the collage shows labelled frames. Rebuild after adding them.
- `lib/site.ts`: `contactEmail` and `instagramUrl`.

## Structure

- `app/page.tsx`: the sections, in order, with the copy
- `components/`: `OrbitDial`, `Section`, `PlanTicket`, `StatCard`, `WaitlistForm`, `Faq`, `HowItWorks`, `Collage`, `Nav`, `Footer`, `Reveal`
- `app/actions/waitlist.ts`: server action that validates and inserts into Supabase
- `app/icon.svg`, `app/opengraph-image.tsx`: favicon and share image
