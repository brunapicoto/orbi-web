# orbi-web

The landing page, waitlist and app for orbi. Next.js (App Router), TypeScript, Tailwind CSS v4, Framer Motion, Supabase.

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

## The app (`/app`)

An installable web app (add to home screen) where people post plans and RSVP blind.

- **sign in:** magic link by email (Supabase Auth), no password
- **mutuals:** everyone has an invite link; accepting it connects two people
- **plans:** type, place, time, open spots (2 or more, so 3+ people)
- **blind rsvp:** people see "someone is hosting" and a count, never names
- **the rule of 3:** a plan is on once the host plus 2 say yes; if it doesn't reach 3 by start time it quietly disappears
- **the reveal:** at start time the people in the plan see who's coming
- **after:** who was there, a group photo, "host the next one"
- **from a link** (`/app/new/link`): paste a TikTok or Reel. TikTok's public oEmbed gives the caption and thumbnail (Instagram has no keyless option, so people paste the caption). Claude suggests title, place, neighborhood, price, category and a day; OpenStreetMap places the pin, which you can drag. You set the minimum (3 or more) and the group size.
- **share link** (`/p/<slug>`): a public teaser with the count ("2 of 4 in", live), a small map and a WhatsApp preview image. Never who's in; the host's name only if they turn it on. Saying "i'm in" from it signs you in and, if you're not connected to the host yet, connects you first (the link works as the host's invite), so plans stay mutuals-only.
- **map** (`/app/map`): your mutuals' plans and the ones you're in, pins by category, filters (category, when, price, status) shared by map and list; the list follows the visible area.

The privacy rules are enforced in the database (`supabase/app.sql`), not just in the UI.
`supabase/tests/` checks them against a local Postgres (113 checks).

**Demo mode:** without Supabase keys, `/app` runs on example data held in memory, with a banner that says so.

**Supabase setup for the app:**
1. Run `supabase/app.sql` in the SQL editor (after `waitlist.sql`). It also creates the private `plan-photos` storage bucket.
2. Authentication > URL Configuration: set the Site URL to your domain and add `https://<your-domain>/auth/callback` to the redirect URLs.
3. Authentication > Emails: the default sender works for testing but is heavily rate limited; set up custom SMTP (for example Resend) before inviting people.

Not built yet: email or SMS reminders, push notifications, chat, payments.

## Deploy (Vercel)

Import this repo in Vercel. Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `NEXT_PUBLIC_SITE_URL` (the live domain, used for Open Graph links).
For plans from links, also add `ANTHROPIC_API_KEY` (server-only) and `GEOCODER_CONTACT_EMAIL`. Map tiles come from OpenStreetMap (no key), darkened in CSS. To use another tile provider, set `NEXT_PUBLIC_MAP_TILE_URL` and `NEXT_PUBLIC_MAP_ATTRIBUTION`.

## Placeholders to fill

- `public/collage/01.jpg`, `02.jpg`, `03.jpg`: black-and-white cutout photos. Until they exist, the collage shows labelled frames. Rebuild after adding them.
- `lib/site.ts`: `contactEmail` and `instagramUrl`.

## Structure

- `app/page.tsx`: the sections, in order, with the copy
- `components/`: `OrbitDial`, `Section`, `PlanTicket`, `StatCard`, `WaitlistForm`, `Faq`, `HowItWorks`, `Collage`, `Nav`, `Footer`, `Reveal`
- `app/actions/waitlist.ts`: server action that validates and inserts into Supabase
- `app/icon.svg`, `app/opengraph-image.tsx`: favicon and share image
- `app/app/`: the app screens; `app/app/actions.ts`: everything the app writes
- `lib/app/store.ts`: data access (Supabase), `lib/app/demo.ts`: demo data
- `middleware.ts`: keeps the session fresh and sends signed-out visitors to `/app/login`
