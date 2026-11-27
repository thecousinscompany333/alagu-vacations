"use client";

import { Lock } from "lucide-react";
import { useState } from "react";
import { TurnstileField } from "@/components/site/TurnstileField";

export function DemoGateForm({
  next,
  turnstileSiteKey,
  error,
  info,
}: {
  next: string;
  turnstileSiteKey: string;
  error?: string;
  info?: string;
}) {
  const [captchaKey, setCaptchaKey] = useState(0);
  const hasTurnstile = Boolean(turnstileSiteKey);
  const [captchaReady, setCaptchaReady] = useState(!hasTurnstile);

  // Reset the CAPTCHA when a new error comes back (adjusting state during render, not in an effect).
  const [seenError, setSeenError] = useState(error);
  if (error !== seenError) {
    setSeenError(error);
    if (error) {
      setCaptchaKey((k) => k + 1);
      setCaptchaReady(!hasTurnstile);
    }
  }

  return (
    <form action="/api/demo-access" method="post" className="mt-8 space-y-4">
      <input type="hidden" name="next" value={next} />
      <label htmlFor="password" className="block text-sm font-semibold text-navy-900">
        Preview password
      </label>
      <div className="relative">
        <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
        <input
          id="password"
          name="password"
          type="password"
          required
          autoFocus
          autoComplete="current-password"
          className="w-full rounded-xl border border-navy-100 bg-white py-3 pl-10 pr-4 text-[15px] focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-300/50"
          aria-describedby={error ? "gate-error" : undefined}
        />
      </div>
      {error && (
        <p id="gate-error" role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      {info && !error && (
        <p role="status" className="text-sm text-emerald-700">
          {info}
        </p>
      )}
      <TurnstileField
        siteKey={turnstileSiteKey}
        action="demo-access"
        resetKey={captchaKey}
        onSuccess={() => setCaptchaReady(true)}
        onExpire={() => setCaptchaReady(false)}
      />
      <button
        type="submit"
        disabled={!captchaReady}
        className="w-full rounded-full bg-navy-800 py-3.5 font-semibold text-white transition hover:bg-navy-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        View preview
      </button>
    </form>
  );
}