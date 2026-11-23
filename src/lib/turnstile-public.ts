/** Turnstile site key (public). Read on the server and pass into client components. */
export function turnstileSiteKey(): string {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
}