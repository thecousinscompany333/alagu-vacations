# Alagu Vacations: Travel & Van Booking Website

A premium, mobile-first website for **Alagu Vacations** (Dindigul, Tamil Nadu). It showcases the business's actual Force Urbania 16-seater van and turns visitors into **booking enquiries**. Enquiries are saved in a database with a reference number and can be sent on WhatsApp. A secure **admin dashboard** manages enquiries and website content.

- Business research and sources: [`research/Alagu_Vacations_Research.md`](research/Alagu_Vacations_Research.md)
- Items still needing the owner's confirmation: see [§9](#9-business-information-that-still-needs-confirmation)


## Screenshots

| Home | Vehicles |
|---|---|
| ![Home](docs/screenshots/01-home-hero.jpg) | ![Vehicles](docs/screenshots/02-vehicles.jpg) |
| **Trip types** | **Gallery** |
| ![Trip types](docs/screenshots/03-trip-types.jpg) | ![Gallery](docs/screenshots/04-gallery.jpg) |
| **Booking form** | **Booking confirmation** |
| ![Booking form](docs/screenshots/05-booking-form.jpg) | ![Confirmation](docs/screenshots/06-booking-confirmation.jpg) |
| **Admin: enquiries** | **Admin: enquiry detail** |
| ![Admin enquiries](docs/screenshots/07-admin-enquiries.jpg) | ![Admin detail](docs/screenshots/08-admin-enquiry-detail.jpg) |
| **Private preview gate (demo mode)** | **Mobile** |
| ![Preview gate](docs/screenshots/09-private-preview-gate.jpg) | ![Mobile](docs/screenshots/10-mobile.jpg) |

## Quick start (new developer)

1. Install **Node 20+** and **Docker**, then clone this repo.
2. Run `npm install`, then `npx supabase start` (local DB, auth and storage; the schema and seed load automatically).
3. Run `cp .env.example .env.local` and fill it in from `npx supabase status -o env` (API_URL, ANON_KEY, SERVICE_ROLE_KEY).
4. Create an admin: `node --env-file=.env.local scripts/create-admin.mjs you@example.com 'strong-password'`.
5. Run `npm run dev` and open http://localhost:3000 (admin at `/admin`).

## Private demo deployment (Vercel + Supabase)

1. **Supabase:** create a *separate* demo project (region Mumbai). Then:
   - run `npx supabase link --project-ref <ref>` and `npx supabase db push`;
   - run `supabase/seed.sql` in the SQL editor;
   - disable sign-ups under Authentication;
   - create the demo admin with `scripts/create-admin.mjs`, using the demo project's URL and service key on your machine only.
2. **Vercel:** import the repo, set **Function Region = Mumbai (bom1)**, and add these environment variables:

   | Variable | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | demo project values |
   | `NEXT_PUBLIC_SITE_URL` | the `*.vercel.app` URL |
   | `DEMO_MODE` | `true` |
   | `DEMO_PASSWORD` | a shared preview password |
   | `DEMO_SESSION_SECRET` | 40+ random characters |
   | `DEMO_SESSION_VERSION` | `1` |
   | `DEMO_SESSION_HOURS` | `72` |

3. Deploy. Every page, Server Action and API then needs the preview password: signed HTTP-only cookie, `noindex`, and a "Preview Website – Alagu Vacations" notice.
4. **Revoke access:** change `DEMO_PASSWORD` or bump `DEMO_SESSION_VERSION`, then redeploy.
5. Never put `SUPABASE_SERVICE_ROLE_KEY` in Vercel. Vercel Hobby is non-commercial only, so use a Pro (trial) team for client work.

---

## 1. Features

### Public website

| Area | What it does |
|---|---|
| Home | Sticky navigation; hero with real van photos; quick-booking widget (pickup, destination, dates, passengers, trip type → *Check Availability*); About; Our Vehicles; Packages / Trip types; Why Choose Us; Instagram-style gallery with lightbox; booking CTA; contact with click-to-call, WhatsApp, Instagram and Google Map; footer |
| `/book` | Full booking enquiry form, pre-filled from the quick-booking widget or any *Enquire Now* button. Server-side validation, spam protection (Cloudflare Turnstile + honeypot + timing + per-mobile rate limit), consent checkbox. |
| Confirmation | Shows a unique reference (e.g. `AV-261118-34049`), a trip summary, a clear "enquiry, not a confirmed booking" notice, and a **Send details on WhatsApp** button with every detail pre-filled |
| WhatsApp | Floating button, *Enquire on WhatsApp instead* (sends the form contents without saving), and a post-submit message. Uses the verified number only. |
| Mobile | Sticky *Call Now / Book Your Trip* bar, full-screen menu, responsive layouts |
| SEO | Per-page metadata, Open Graph image, `sitemap.xml`, `robots.txt` (admin excluded), semantic HTML, optimised images |
| Other | Branded 404 page; draft Privacy Policy and Booking Terms pages, clearly marked as needing business approval |

### Admin dashboard (`/admin`)

| Page | What it does |
|---|---|
| Enquiries | Counts by status; search by name, mobile, reference or destination; filter by status; call / WhatsApp the customer in one tap |
| Enquiry detail | Full trip details; set status (**pending → contacted → confirmed / cancelled**); internal notes |
| Vehicles | Add, edit or hide vehicles: seats, facilities, trip types, photos (direct upload) |
| Packages | Add, edit or hide packages: destination, duration, highlights, optional price, photo. Destinations appear automatically in "Popular Destinations". |
| Gallery | Upload, caption, hide or delete photos |
| Business details | Phone, WhatsApp, email, address, Instagram, map location, about text, "since" line |

Content changes appear on the public site immediately (cache tag invalidation).

---

## 2. Technology

| Layer | Choice |
|---|---|
| Framework | **Next.js 16** (App Router, Cache Components, Server Actions, `proxy.ts`), React 19, TypeScript |
| Styling | Tailwind CSS 4 (brand tokens in `src/app/globals.css`), Playfair Display + Manrope, lucide-react icons |
| Database | **Supabase Postgres** with Row Level Security |
| Auth | **Supabase Auth** (email + password), admin role checked in Postgres (`is_admin()`) |
| Storage | **Supabase Storage** bucket `media` (public read, admin-only write) |
| Validation | zod (server) + native HTML constraints (client) |
| Hosting | Vercel (recommended: region **Mumbai `bom1`**) + Supabase (region **Mumbai `ap-south-1`**) |

---

## 3. Project structure

```
src/
  app/
    (site)/            public pages: page.tsx (home), book/, privacy/, terms/, layout (nav/footer)
    admin/login/       admin sign-in
    admin/(dash)/      enquiries, enquiries/[id], vehicles, packages, gallery, settings
    layout.tsx, globals.css, not-found.tsx, sitemap.ts, robots.ts
  actions/             Server Actions: enquiry.ts (public), admin.ts (admin, every action re-checks admin)
  components/site/     Navbar, QuickBooking, BookingForm, VehicleCard, Gallery, Footer, FloatingActions …
  components/admin/    form helpers, image uploader, UI bits
  lib/                 data.ts (cached public reads), auth.ts (admin guard), validation.ts, site.ts (WhatsApp/phone helpers),
                       fallback.ts (verified defaults if DB is unavailable), supabase/ clients
  proxy.ts             refreshes the auth session and redirects signed-out users away from /admin
supabase/
  migrations/          full schema, RLS policies, submit_enquiry() function, storage bucket
  seed.sql             verified business content only
scripts/create-admin.mjs  creates/promotes an admin user (service-role key, local use only)
research/              business research document + raw Instagram captures
public/images/         logo and photos (interim captures from Instagram; replace with originals)
```

---

## 4. Database schema

| Table | Purpose | Public access |
|---|---|---|
| `site_settings` (single row) | Business name, phone, WhatsApp, email, address, Instagram, about text … | read |
| `vehicles` | Fleet with seats, facilities, trip types, photos | read active rows |
| `packages` | Travel packages (none seeded) | read active rows |
| `gallery_items` | Gallery photos | read active rows |
| `enquiries` | Booking enquiries with `reference`, status and admin notes | **none**: insert only via `submit_enquiry()` |
| `admin_users` | Which auth users are admins | none |

- `submit_enquiry(...)` (security definer) validates dates, limits 5 enquiries per mobile per hour, generates the reference `AV-YYMMDD-XXXXX`, and inserts the row. The public can never read enquiries.
- All writes to content tables, and all enquiry reads and updates, require `is_admin()`.
- Storage bucket `media`: public read; upload, update and delete for admins only; 5 MB limit; JPG/PNG/WebP only.

The full SQL is in `supabase/migrations/20261118000000_initial_schema.sql`.

---

## 5. Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel + local | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel + local | Anon / publishable key (RLS-protected) |
| `NEXT_PUBLIC_SITE_URL` | Vercel + local | Canonical site URL for sitemap and Open Graph |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Vercel + local + Render | Cloudflare Turnstile site key (CAPTCHA on booking / login / preview) |
| `TURNSTILE_SECRET_KEY` | Vercel + Render only | Turnstile secret — never expose to the browser |
| `SUPABASE_SERVICE_ROLE_KEY` | **Your machine only** | Used only by `scripts/create-admin.mjs`. Never add to Vercel. |

Copy `.env.example` to `.env.local`. No secrets are hard-coded.

If the Supabase variables are missing, the public site still renders using verified fallback content. The booking form then asks visitors to call or WhatsApp instead of failing silently.

---

## 6. Run locally

Requirements: Node 20+ (tested on Node 23), Docker (for local Supabase).

```bash
npm install
npx supabase start                       # starts local Postgres/Auth/Storage, applies migration + seed
npx supabase status -o env               # copy API_URL / ANON_KEY / SERVICE_ROLE_KEY into .env.local
node --env-file=.env.local scripts/create-admin.mjs you@example.com 'a-strong-password'
npm run dev                              # http://localhost:3000  (admin: /admin)
```

Other commands:

| Command | Purpose |
|---|---|
| `npm run build` | Production build |
| `npm run lint` | Lint |
| `npx supabase db reset` | Rebuild the local DB from migration + seed (removes local admin users; re-run the script afterwards) |
| Supabase Studio | http://127.0.0.1:54323 |

---

## 7. Deploy (Vercel + Supabase)

1. **Create the Supabase project.**
   - Region **South Asia (Mumbai)**.
   - Use a paid plan for production. The Free plan pauses after a week of inactivity and has no backups.
2. **Push the schema and seed:**
   ```bash
   npx supabase login
   npx supabase link --project-ref <project-ref>
   npx supabase db push            # applies supabase/migrations
   psql "<connection string>" -f supabase/seed.sql   # or paste seed.sql into the SQL editor once
   ```
3. **Harden Auth** (Supabase dashboard → Authentication):
   - **Disable sign-ups** (Sign In / Providers → "Allow new users to sign up" off).
   - Set **Site URL** to your domain.
   - Add `https://<domain>/**` to redirect URLs.
4. **Create the owner's admin account** from your machine:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… node scripts/create-admin.mjs owner@… '<password>'
   ```
5. **Deploy to Vercel:**
   - Import the repo.
   - Set the three `NEXT_PUBLIC_*` variables.
   - Under Settings → Functions, set the **Function Region to Mumbai (`bom1`)**.
   - Note: Vercel Hobby is for non-commercial use only; a client website needs **Pro**.
6. **Connect the domain** (DNS in the client's own registrar or Cloudflare account) and update `NEXT_PUBLIC_SITE_URL`.
7. **Smoke test:**
   - Submit an enquiry and see it in `/admin`.
   - Click the WhatsApp button and check the number.
   - Upload a gallery photo.

**Backups:** Supabase paid plans include daily backups. Optionally schedule `supabase db dump` (for example a nightly GitHub Action) to off-site storage.

---

## 8. Tested (18 Nov 2026, local Supabase + Chrome)

- ✅ `npm run build`, `tsc`, ESLint: all pass (0 warnings)
- ✅ All routes respond: `/`, `/book`, `/privacy`, `/terms`, `/sitemap.xml`, `/robots.txt`, branded 404; `/admin` redirects to login when signed out
- ✅ Quick-booking widget pre-fills the booking form
- ✅ Validation: missing name and invalid mobile are highlighted, and other values are kept
- ✅ Valid enquiry saved to the database with reference `AV-YYMMDD-XXXXX`; confirmation screen shown
- ✅ WhatsApp message contains reference and all trip details and opens `wa.me/917010998586`
- ✅ RLS: the anon key **cannot** read enquiries, insert directly, or edit vehicles; public sign-up is **blocked**
- ✅ Admin: sign in, list, search, open enquiry, change status and notes; add a package with image upload, which appears on the public site immediately; delete with confirmation (image removed from storage); gallery, vehicles and settings pages load
- ✅ Responsive layouts checked at 390 px (home, booking, admin) and desktop; lightbox works
- ✅ No browser console errors (apart from a hydration notice caused by the Grammarly browser extension, now suppressed); no broken internal links; no secrets in `src/` or `public/`

Test data was removed after testing.

---

## 9. Business information that still needs confirmation

From `research/Alagu_Vacations_Research.md`:

1. **Founding year:** the site shows "Alagu Travels, since 1992" (provided by you), but the logo says "Est. 2024". Confirm the wording (editable in Admin → Business details).
2. **Brand name:** Alagu Vacations vs "Alagu Holidays" (on the van livery).
3. **WhatsApp number:** the site uses **7010998586** (verified as the booking number). Confirm it is on WhatsApp.
4. **Email, street address**: not published. Hidden until added. The map currently shows Dindigul city.
5. **Fleet:** only the Force Urbania 16-seater is listed.
6. **Packages, destinations, prices:** none published. The site shows trip types until packages are added in Admin.
7. **Customer reviews:** none found. The testimonials section is omitted (nothing invented).
8. **Original photos and logo:** current images are screen captures from Instagram (about 370–600 px). Replace with the owner's originals for sharper quality.
9. **Consent** of people shown in launch photos.
10. **Privacy Policy and Booking Terms:** drafts with placeholders that need owner (and ideally legal) approval.

## 10. Not included (by design)

- **Online payment:** not implemented. No gateway credentials or payment requirements yet. The flow is enquiry-only and never claims a vehicle is reserved.
- **Email notifications** to the business on new enquiries: not configured. Enquiries appear in the dashboard, and customers can WhatsApp the business directly. This can be added later with an email provider (e.g. Resend) via a server action or a Supabase database webhook.
- **Testimonials management:** add when genuine reviews are available.
