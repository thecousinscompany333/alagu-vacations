import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { DEMO_COOKIE, isDemoMode, verifyAccessToken } from "@/lib/demo";

/**
 * Paths reachable without the demo password: the gate itself, robots.txt, and the static
 * /images folder. /images must stay open because Next's image optimiser fetches source images
 * from the server without the visitor's cookie. These are the business's already-public
 * Instagram photos; every page, API and Server Action remains protected.
 */
const DEMO_PUBLIC = ["/demo-access", "/api/demo-access", "/images", "/favicon.ico", "/robots.txt"];

function noIndex(res: NextResponse) {
  res.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return res;
}

/**
 * 1. DEMO GATE (only when DEMO_MODE=true): every request except the gate needs a valid,
 *    signed, HTTP-only access cookie. Pages redirect to the password screen; API calls,
 *    Server Actions and other non-GET requests get 401.
 * 2. ADMIN: refreshes the Supabase session and redirects signed-out visitors to /admin/login.
 *    Real authorisation is enforced in lib/auth.ts and Postgres RLS.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (isDemoMode()) {
    const isPublic = DEMO_PUBLIC.some((p) => pathname === p || pathname.startsWith(`${p}/`));
    if (!isPublic && !verifyAccessToken(request.cookies.get(DEMO_COOKIE)?.value)) {
      const isPageRequest =
        request.method === "GET" &&
        !request.headers.has("next-action") &&
        !pathname.startsWith("/api/") &&
        !pathname.startsWith("/_next/");
      if (!isPageRequest) {
        return noIndex(NextResponse.json({ error: "Demo access required" }, { status: 401 }));
      }
      const gate = request.nextUrl.clone();
      gate.pathname = "/demo-access";
      gate.search = `?next=${encodeURIComponent(pathname + search)}`;
      return noIndex(NextResponse.redirect(gate));
    }
  }

  if (!pathname.startsWith("/admin")) {
    const res = NextResponse.next();
    return isDemoMode() ? noIndex(res) : res;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);
  const isPublicAdmin =
    pathname === "/admin/login" ||
    pathname === "/admin/forgot-password" ||
    pathname === "/admin/reset-password" ||
    pathname.startsWith("/admin/auth/");

  if (!signedIn && !isPublicAdmin) {
    const login = request.nextUrl.clone();
    login.pathname = "/admin/login";
    login.search = "";
    return NextResponse.redirect(login);
  }
  if (isDemoMode()) noIndex(response);
  return response;
}

export const config = {
  // Everything except framework build assets. When DEMO_MODE is off, non-admin requests
  // pass straight through (one cheap check), so local/production behaviour is unchanged.
  matcher: ["/((?!_next/static|_next/webpack-hmr).*)"],
};
