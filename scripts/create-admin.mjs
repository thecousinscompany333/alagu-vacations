#!/usr/bin/env node
/**
 * Creates (or promotes) an admin user.
 *
 *   node --env-file=.env.local scripts/create-admin.mjs owner@example.com 'a-strong-password'
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment.
 * The service-role key is used only here, never in the web app.
 */
import { createClient } from "@supabase/supabase-js";

const [email, password, roleArg] = process.argv.slice(2);
const role = roleArg === "admin" ? "admin" : "super_admin";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!email || !password) {
  console.error("Usage: node --env-file=.env.local scripts/create-admin.mjs <email> <password>");
  process.exit(1);
}
if (password.length < 10) {
  console.error("Use a password of at least 10 characters.");
  process.exit(1);
}
if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

let userId;
const { data: created, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
if (error) {
  // Already exists? Find the user and reset the password.
  const { data: list, error: listErr } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (listErr) throw listErr;
  const existing = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!existing) {
    console.error("Could not create user:", error.message);
    process.exit(1);
  }
  userId = existing.id;
  const { error: updErr } = await admin.auth.admin.updateUserById(userId, { password });
  if (updErr) throw updErr;
  console.log("User existed; password updated.");
} else {
  userId = created.user.id;
  console.log("User created.");
}

const { error: roleErr } = await admin.from("admin_users").upsert({ user_id: userId, role });
if (roleErr) throw roleErr;
console.log(`Admin access granted to ${email}.`);
