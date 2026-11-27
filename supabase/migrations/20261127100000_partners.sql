-- Partners (third-party vehicle owners), phase 1.
--
-- * partners:       one row per vehicle-owner business.
-- * partner_users:  links a login (auth.users) to a partner. Kept separate from admin_users,
--                   so is_admin() and every existing admin policy never include partners.
-- * vehicles.partner_id:   owner of the vehicle. NULL = Alagu Vacations' own vehicle.
-- * enquiries.vehicle_id / partner_id: which vehicle the customer picked and who owned it at
--                   submit time (a snapshot: changing a vehicle's owner later does not move old leads).
-- * enquiries.shared_at: set by an admin to release the customer's name, mobile, email and notes
--                   to the partner. Until then the partner sees trip details only.
--
-- Partners never get direct SELECT/UPDATE on enquiries (RLS is per row, not per column, and the
-- row holds admin_notes and unreleased contact details). They read and update through the
-- partner_* functions below, which return only their own enquiries and only safe columns.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table public.partners (
  id            uuid primary key default gen_random_uuid(),
  business_name text not null check (char_length(business_name) between 2 and 120),
  contact_name  text check (contact_name is null or char_length(contact_name) <= 100),
  phone         text check (phone is null or char_length(phone) <= 20),
  email         text check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  notes         text check (notes is null or char_length(notes) <= 1500),
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger partners_updated before update on public.partners
  for each row execute function public.set_updated_at();
alter table public.partners enable row level security;

create table public.partner_users (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  partner_id uuid not null references public.partners (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index partner_users_partner_idx on public.partner_users (partner_id);
alter table public.partner_users enable row level security;

alter table public.vehicles
  add column partner_id uuid references public.partners (id) on delete set null;
create index vehicles_partner_idx on public.vehicles (partner_id);

alter table public.enquiries
  add column vehicle_id    uuid references public.vehicles (id) on delete set null,
  add column partner_id    uuid references public.partners (id) on delete set null,
  add column shared_at     timestamptz,
  add column partner_notes text check (partner_notes is null or char_length(partner_notes) <= 1500);
create index enquiries_partner_idx on public.enquiries (partner_id, created_at desc);
create index enquiries_vehicle_idx on public.enquiries (vehicle_id);

-- A login is either staff (admin_users) or a partner (partner_users), never both.
create or replace function public.enforce_single_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_table_name = 'partner_users'
     and exists (select 1 from public.admin_users where user_id = new.user_id) then
    raise exception 'This login is an admin and cannot also be a partner' using errcode = '23514';
  end if;
  if tg_table_name = 'admin_users'
     and exists (select 1 from public.partner_users where user_id = new.user_id) then
    raise exception 'This login is a partner and cannot also be an admin' using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger partner_users_single_role before insert or update on public.partner_users
  for each row execute function public.enforce_single_role();
create trigger admin_users_single_role before insert or update on public.admin_users
  for each row execute function public.enforce_single_role();

-- ---------------------------------------------------------------------------
-- Who is the signed-in partner? NULL for admins, visitors and paused partners.
-- ---------------------------------------------------------------------------
create or replace function public.current_partner_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select pu.partner_id
    from public.partner_users pu
    join public.partners p on p.id = pu.partner_id
   where pu.user_id = auth.uid() and p.is_active;
$$;
revoke all on function public.current_partner_id() from public;
grant execute on function public.current_partner_id() to authenticated;

-- ---------------------------------------------------------------------------
-- RLS policies
-- ---------------------------------------------------------------------------
create policy "admins read partners" on public.partners
  for select to authenticated using (public.is_admin());
create policy "super admins manage partners" on public.partners
  for all to authenticated using (public.is_super_admin()) with check (public.is_super_admin());
create policy "partner reads own record" on public.partners
  for select to authenticated using (id = public.current_partner_id());

create policy "admins read partner logins" on public.partner_users
  for select to authenticated using (public.is_admin());
create policy "partner reads own login" on public.partner_users
  for select to authenticated using (user_id = auth.uid());
-- Partner logins are created and removed only with the service role (admin server actions).

-- Partners also see their own inactive (hidden) vehicles. They cannot change vehicles.
create policy "partner reads own vehicles" on public.vehicles
  for select to authenticated using (partner_id is not null and partner_id = public.current_partner_id());

grant select on table public.partners to authenticated;
grant insert, update, delete on table public.partners to authenticated;
grant select on table public.partner_users to authenticated;
grant select, insert, update, delete on table public.partners to service_role;
grant select, insert, update, delete on table public.partner_users to service_role;

-- ---------------------------------------------------------------------------
-- Partner access to enquiries (only their own, only safe columns)
-- ---------------------------------------------------------------------------
create or replace function public.partner_list_enquiries(
  p_status text default null,
  p_search text default null,
  p_id uuid default null
) returns table (
  id               uuid,
  reference        text,
  created_at       timestamptz,
  pickup_location  text,
  destination      text,
  pickup_date      date,
  return_date      date,
  passengers       int,
  trip_type        text,
  vehicle_id       uuid,
  vehicle_name     text,
  status           text,
  partner_notes    text,
  shared_at        timestamptz,
  full_name        text,
  mobile           text,
  email            text,
  notes            text
)
language sql
stable
security definer
set search_path = public
as $$
  select e.id, e.reference, e.created_at, e.pickup_location, e.destination, e.pickup_date,
         e.return_date, e.passengers, e.trip_type, e.vehicle_id,
         coalesce(v.name, e.vehicle_preference) as vehicle_name,
         e.status, e.partner_notes, e.shared_at,
         case when e.shared_at is not null then e.full_name end,
         case when e.shared_at is not null then e.mobile end,
         case when e.shared_at is not null then e.email end,
         case when e.shared_at is not null then e.notes end
    from public.enquiries e
    left join public.vehicles v on v.id = e.vehicle_id
   where e.partner_id is not null
     and e.partner_id = public.current_partner_id()
     and (p_id is null or e.id = p_id)
     and (p_status is null or e.status = p_status)
     and (
       nullif(trim(p_search), '') is null
       or e.reference ilike '%' || trim(p_search) || '%'
       or e.destination ilike '%' || trim(p_search) || '%'
       or e.pickup_location ilike '%' || trim(p_search) || '%'
       or (e.shared_at is not null and (
             e.full_name ilike '%' || trim(p_search) || '%'
             or e.mobile ilike '%' || trim(p_search) || '%'))
     )
   order by e.created_at desc
   limit 200;
$$;
revoke all on function public.partner_list_enquiries(text, text, uuid) from public;
grant execute on function public.partner_list_enquiries(text, text, uuid) to authenticated;

create or replace function public.partner_update_enquiry(
  p_id uuid,
  p_status text,
  p_partner_notes text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_partner uuid := public.current_partner_id();
begin
  if v_partner is null then
    raise exception 'Not a partner' using errcode = '42501';
  end if;
  if p_status not in ('pending', 'contacted', 'confirmed', 'cancelled') then
    raise exception 'Invalid status' using errcode = '22023';
  end if;
  update public.enquiries
     set status = p_status,
         partner_notes = nullif(trim(p_partner_notes), '')
   where id = p_id and partner_id = v_partner;
  if not found then
    raise exception 'Enquiry not found' using errcode = 'P0002';
  end if;
end;
$$;
revoke all on function public.partner_update_enquiry(uuid, text, text) from public;
grant execute on function public.partner_update_enquiry(uuid, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Public submission: now records the vehicle and its owner.
-- p_vehicle_id is optional, so the site keeps working if this migration is applied before the
-- new website code is deployed (old code sends only the vehicle name, matched here by name).
-- ---------------------------------------------------------------------------
drop function public.submit_enquiry(text, text, text, text, text, date, date, int, text, text, text);

create or replace function public.submit_enquiry(
  p_full_name text,
  p_mobile text,
  p_email text,
  p_pickup_location text,
  p_destination text,
  p_pickup_date date,
  p_return_date date,
  p_passengers int,
  p_vehicle_preference text,
  p_trip_type text,
  p_notes text,
  p_vehicle_id uuid default null
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ref text;
  v_recent int;
  v_today date := (now() at time zone 'Asia/Kolkata')::date;
  v_vehicle public.vehicles%rowtype;
begin
  if p_pickup_date < v_today then
    raise exception 'Pickup date cannot be in the past' using errcode = '22023';
  end if;
  if p_pickup_date > v_today + 730 then
    raise exception 'Pickup date is too far ahead' using errcode = '22023';
  end if;

  select count(*) into v_recent from public.enquiries
   where mobile = p_mobile and created_at > now() - interval '1 hour';
  if v_recent >= 5 then
    raise exception 'Too many enquiries from this number. Please call us instead.' using errcode = 'P0001';
  end if;

  -- Only active (publicly listed) vehicles can be picked.
  if p_vehicle_id is not null then
    select * into v_vehicle from public.vehicles where id = p_vehicle_id and is_active;
  elsif nullif(trim(p_vehicle_preference), '') is not null then
    select * into v_vehicle from public.vehicles
     where is_active and lower(name) = lower(trim(p_vehicle_preference))
     order by sort_order, created_at
     limit 1;
  end if;

  loop
    v_ref := 'AV-' || to_char(now() at time zone 'Asia/Kolkata', 'YYMMDD') || '-'
             || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 5));
    exit when not exists (select 1 from public.enquiries where reference = v_ref);
  end loop;

  insert into public.enquiries (
    reference, full_name, mobile, email, pickup_location, destination,
    pickup_date, return_date, passengers, vehicle_preference, trip_type, notes,
    vehicle_id, partner_id
  ) values (
    v_ref, trim(p_full_name), p_mobile, nullif(trim(p_email), ''), trim(p_pickup_location), trim(p_destination),
    p_pickup_date, p_return_date, p_passengers,
    coalesce(v_vehicle.name, nullif(trim(p_vehicle_preference), '')),
    nullif(p_trip_type, ''), nullif(trim(p_notes), ''),
    v_vehicle.id, v_vehicle.partner_id
  );
  return v_ref;
end;
$$;
revoke all on function public.submit_enquiry(text, text, text, text, text, date, date, int, text, text, text, uuid) from public;
grant execute on function public.submit_enquiry(text, text, text, text, text, date, date, int, text, text, text, uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Backfill: link existing enquiries to vehicles by name (no vehicle has an owner yet,
-- so partner_id stays NULL and old enquiries remain admin-only).
-- ---------------------------------------------------------------------------
update public.enquiries e
   set vehicle_id = v.id
  from public.vehicles v
 where e.vehicle_id is null
   and e.vehicle_preference is not null
   and lower(trim(e.vehicle_preference)) = lower(v.name);
