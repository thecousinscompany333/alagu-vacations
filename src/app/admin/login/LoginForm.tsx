"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useState } from "react";
import { signIn } from "@/actions/admin";
import { PasswordField, SubmitButton, adminInput, adminLabel } from "@/components/admin/forms";
import { TurnstileField } from "@/components/site/TurnstileField";

export function LoginForm({ turnstileSiteKey }: { turnstileSiteKey: string }) {
  const [state, action] = useActionState(signIn, null);
  const hasTurnstile = Boolean(turnstileSiteKey);
  const [captchaKey, setCaptchaKey] = useState(0);
  const [captchaReady, setCaptchaReady] = useState(!hasTurnstile);

  // Reset the CAPTCHA after each failed submit (adjusting state during render, not in an effect).
  const [seenState, setSeenState] = useState(state);
  if (state !== seenState) {
    setSeenState(state);
    if (state && !state.ok) {
      setCaptchaKey((k) => k + 1);
      setCaptchaReady(!hasTurnstile);
    }
  }

  return (
    <form action={action} className="mt-8 space-y-4">
      <div>
        <label htmlFor="email" className={adminLabel}>Email</label>
        <input id="email" name="email" type="email" required autoComplete="username" className={adminInput} />
      </div>
      <div>
        <div className="mb-1 flex items-end justify-between gap-2">
          <label htmlFor="password" className={adminLabel}>
            Password
          </label>
          <Link href="/admin/forgot-password" className="mb-1 text-xs font-medium text-navy-700 hover:underline">
            Forgot password?
          </Link>
        </div>
        <PasswordField id="password" name="password" required autoComplete="current-password" />
      </div>
      {state && !state.ok && <p role="alert" className="text-sm text-red-700">{state.message}</p>}
      <TurnstileField
        siteKey={turnstileSiteKey}
        action="admin-login"
        resetKey={captchaKey}
        onSuccess={() => setCaptchaReady(true)}
        onExpire={() => setCaptchaReady(false)}
      />
      <SubmitButton className="w-full py-3" disabled={!captchaReady}>
        Sign in
      </SubmitButton>
    </form>
  );
}
