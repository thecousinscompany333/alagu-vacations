import "server-only";
import { headers } from "next/headers";

/** Form field name Cloudflare Turnstile posts with the widget. */
export const TURNSTILE_FORM_FIELD = "cf-turnstile-response";

export function isTurnstileConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY);
}

export async function verifyTurnstileToken(token: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return false;
  const trimmed = token.trim();
  if (!trimmed) return false;

  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    h.get("cf-connecting-ip") ||
    "";

  const body = new URLSearchParams({ secret, response: trimmed });
  if (ip) body.set("remoteip", ip);

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch (e) {
    console.error("[captcha] siteverify failed:", e);
    return false;
  }
}

const CAPTCHA_FAIL = "Please complete the security check (CAPTCHA) and try again.";
const CAPTCHA_UNAVAILABLE =
  "Online booking is temporarily unavailable. Please call or WhatsApp us — we'll respond quickly.";

/** Server-side gate for public and auth forms. Skips verification when Turnstile keys are unset (local dev only). */
export async function assertCaptcha(formData: FormData): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!isTurnstileConfigured()) {
    if (process.env.NODE_ENV === "production") {
      console.error("[captcha] Missing NEXT_PUBLIC_TURNSTILE_SITE_KEY or TURNSTILE_SECRET_KEY");
      return { ok: false, message: CAPTCHA_UNAVAILABLE };
    }
    return { ok: true };
  }

  const token = String(formData.get(TURNSTILE_FORM_FIELD) ?? "");
  if (!(await verifyTurnstileToken(token))) {
    return { ok: false, message: CAPTCHA_FAIL };
  }
  return { ok: true };
}