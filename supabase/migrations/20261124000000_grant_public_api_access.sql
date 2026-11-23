-- PostgREST needs table-level GRANTs; RLS policies still restrict rows.
grant usage on schema public to anon, authenticated;

grant select on table public.site_settings to anon, authenticated;
grant select on table public.vehicles to anon, authenticated;
grant select on table public.packages to anon, authenticated;
grant select on table public.gallery_items to anon, authenticated;

grant insert, update, delete on table public.site_settings to authenticated;
grant insert, update, delete on table public.vehicles to authenticated;
grant insert, update, delete on table public.packages to authenticated;
grant insert, update, delete on table public.gallery_items to authenticated;

grant select, update, delete on table public.enquiries to authenticated;