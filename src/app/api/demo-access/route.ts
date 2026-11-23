import { NextResponse, type NextRequest } from "next/server";
import { assertCaptcha } from "@/lib/captcha";
import { DEMO_COOKIE, checkDemoPassword, createAccessToken, isDemoConfigured, isDemoMode, safeNextPath } from "@/lib/demo";

// Best-effort brute-force slowdown (per server instance). Combined with a fixed delay per
// attempt, this makes password guessing impractical for a short-lived demo.
const attempts = new Map<string, { count: number; first: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

function clientKey(req: NextRequest) {
  return (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
}

function redirect(req: NextRequest, path: string) {
  // 303 so the browser follows with GET.
  const res = NextResponse.redirect(new URL(path, req.url), 303);
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  res.headers.set("Cache-Control", "no-store");
  return res;
}

export async function POST(req: NextRequest) {
  if (!isDemoMode()) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const form = await req.formData();
  const next = safeNextPath(String(form.get("next") ?? "/"));
  const back = (error: string) => redirect(req, `/demo-access?error=${error}&next=${encodeURIComponent(next)}`);

  const captcha = await assertCaptcha(form);
  if (!captcha.ok) return back("captcha");

  if (!isDemoConfigured()) return back("config");

  const key = clientKey(req);
  const now = Date.now();
  const entry = attempts.get(key);
  if (entry && now - entry.first < WINDOW_MS && entry.count >= MAX_ATTEMPTS) return back("locked");

  await new Promise((r) => setTimeout(r, 400));
  const password = String(form.get("password") ?? "");
  if (!checkDemoPassword(password)) {
    const fresh = !entry || now - entry.first >= WINDOW_MS;
    attempts.set(key, fresh ? { count: 1, first: now } : { count: entry.count + 1, first: entry.first });
    return back("invalid");
  }

  attempts.delete(key);
  const token = createAccessToken();
  const res = redirect(req, next);
  res.cookies.set(DEMO_COOKIE, token.value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: token.maxAge,
  });
  return res;
}
