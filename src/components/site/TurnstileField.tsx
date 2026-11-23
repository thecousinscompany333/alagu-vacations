"use client";

import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { useEffect, useRef, useState } from "react";

type Props = {
  /** Site key from the server (preferred — works when env is set on Render without a client rebuild). */
  siteKey?: string;
  /** Passed to Turnstile for analytics; e.g. "enquiry", "admin-login". */
  action?: string;
  /** Bump after a failed submit so the visitor must solve again. */
  resetKey?: string | number;
  onSuccess?: () => void;
  onExpire?: () => void;
};

function turnstileHelp(code: string | number | undefined): string {
  if (String(code) === "110200") {
    return (
      "This page’s domain is not allowed for your Turnstile site key (Cloudflare error 110200). " +
      "In Cloudflare → Turnstile → your widget → Hostname Management, add localhost (for local dev) and " +
      "alagu-vacations.onrender.com (for production). Or use Cloudflare’s test keys in .env.local for local dev only."
    );
  }
  return (
    "Security check could not connect to Cloudflare. Try another network, turn off VPN/ad blockers, " +
    "then refresh. If it persists, confirm hostnames are set in Turnstile."
  );
}

export function TurnstileField({
  siteKey: siteKeyProp,
  action = "submit",
  resetKey = 0,
  onSuccess,
  onExpire,
}: Props) {
  const ref = useRef<TurnstileInstance>(null);
  const [mounted, setMounted] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const siteKey = siteKeyProp ?? process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
  useEffect(() => setMounted(true), []);
  useEffect(() => setLoadError(null), [resetKey]);

  if (!siteKey) {
    if (process.env.NODE_ENV === "production") {
      return (
        <p className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="alert">
          Security verification is not configured. Submissions are disabled until the site owner adds Turnstile keys.
        </p>
      );
    }
    return null;
  }

  // Turnstile injects iframes; render only in the browser to avoid hydration mismatch.
  if (!mounted) {
    return <div className="min-h-[65px] w-full max-w-sm" aria-hidden />;
  }

  return (
    <div className="space-y-2" aria-label="Security verification">
      <Turnstile
        key={resetKey}
        ref={ref}
        siteKey={siteKey}
        options={{ action, theme: "light", size: "flexible" }}
        onSuccess={() => {
          setLoadError(null);
          onSuccess?.();
        }}
        onError={(code) => {
          setLoadError(turnstileHelp(code));
          onExpire?.();
        }}
        onExpire={() => {
          onExpire?.();
          ref.current?.reset();
        }}
      />
      {loadError && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {loadError}
        </p>
      )}
    </div>
  );
}