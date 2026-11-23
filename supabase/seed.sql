-- Seed data: ONLY information verified from the public @alagu_vacations Instagram
-- (see research/Alagu_Vacations_Research.md). Items marked "confirm" need owner approval.

insert into public.site_settings
  (id, business_name, tagline, phone, whatsapp, email, address, city, instagram_url, about_text, since_text, map_query)
values (
  1,
  'Alagu Vacations',
  'Tours and Holiday Packages',
  '7010998586',                       -- verified: "For booking contact: 7010998586"
  '7010998586',                       -- confirm: same number assumed for WhatsApp
  null,                               -- confirm: no public email found
  null,                               -- confirm: no street address published
  'Dindigul, Tamil Nadu',
  'https://www.instagram.com/alagu_vacations/',
  'Budget-friendly trips for friends and family, with a luxury and comfortable journey and well-organised, experienced drivers.',
  'Alagu Travels, since 1992',        -- provided by client; logo says "Est. 2024" (confirm wording)
  'Dindigul, Tamil Nadu'
)
on conflict (id) do nothing;

insert into public.vehicles
  (name, model, seats, facilities, trip_types, description, image_url, photos, sort_order)
values (
  'Force Urbania – 16 Seater',
  'Force Urbania',
  16,
  array['Air-conditioned (A/C)', 'Individual high-back seats', 'Roof-mounted A/C vents', 'Ceiling LED lighting', 'Touchscreen infotainment'],
  array['Family trips', 'Friends trips', 'Budget trips', 'Package trips', 'College trips', 'Pilgrimage tours', 'Honeymoon trips', 'Customized packages'],
  'Our brand-new Force Urbania, launched in November 2026, built for comfortable group travel.',
  '/images/van-front.webp',
  array['/images/van-front.webp', '/images/van-side.webp', '/images/interior-cabin.webp',
        '/images/interior-seats.webp', '/images/interior-aisle.webp', '/images/interior-cockpit.webp',
        '/images/interior-dashboard.webp'],
  1
);

insert into public.gallery_items (image_url, caption, sort_order) values
  ('/images/van-front.webp',            'Our Force Urbania',                      1),
  ('/images/interior-cabin.webp',       'Spacious 16-seat cabin',                 2),
  ('/images/launch-garland.webp',       'Launch day in Dindigul',                 3),
  ('/images/van-side-wide.webp',        'Ready for the road',                     4),
  ('/images/interior-aisle.webp',       'Comfortable seats with A/C vents',       5),
  ('/images/launch-keys.webp',          'Key handover, November 2026',            6),
  ('/images/interior-cockpit.webp',     'Driver cabin',                           7),
  ('/images/poster-new-services.webp',  'Budget trips and package trips',         8),
  ('/images/interior-dashboard.webp',   'Touchscreen infotainment',               9);
-- No packages, destinations or testimonials are seeded: none were published by the business.
