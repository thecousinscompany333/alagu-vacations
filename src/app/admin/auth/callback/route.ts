import { createServerClient } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { SITE_URL } from "@/lib/site";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/env";

function siteUrl(path: string) {
  return new URL(path, SITE_URL);
}

/** Exchanges Supabase auth codes / recovery OTP and sets session cookies before redirect. */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const nextRaw = requestUrl.searchParams.get("next") ?? "/admin/reset-password";
  const nextPath = nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "/admin/reset-password";

  const fail = () => NextResponse.redirect(siteUrl("/admin/login?error=reset-link"));

  if (!code && !(tokenHash && type)) return fail();

  let response = NextResponse.redirect(siteUrl(nextPath));

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.redirect(new URL(nextPath, requestUrl.origin));
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return fail();
    return response;
  }

  const { error } = await supabase.auth.verifyOtp({
    type: type as EmailOtpType,
    token_hash: tokenHash!,
  });
  if (error) return fail();
  return response;
}