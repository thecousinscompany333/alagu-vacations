-- scripts/create-admin.mjs uses the service role to upsert admin_users.
grant select, insert, update, delete on table public.admin_users to service_role;