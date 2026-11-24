"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { requestPasswordReset } from "@/actions/admin";
import { SubmitButton, adminInput, adminLabel } from "@/components/admin/forms";
import { TurnstileField } from "@/components/site/TurnstileField";

export function ForgotPasswordForm({ turnstileSiteKey }: { turnstileSiteKey: string }) {
  const [state, action] = useActionState(requestPasswordReset, null);
  const hasTurnstile = Boolean(turnstileSiteKey);
  const [captchaKey, setCaptchaKey] = useState(0);
  const [captchaReady, setCaptchaReady] = useState(!hasTurnstile);

  useEffect(() => {
    if (state && !state.ok) {
      setCaptchaKey((k) => k + 1);
      setCaptchaReady(!hasTurnstile);
    }
  }, [state, hasTurnstile]);

  if (state?.ok) {
    return (
      <div className="mt-8 space-y-4" role="status">
        <p className="rounded-lg bg-emerald-50 px-3 py-3 text-sm text-emerald-900">{state.message}</p>
        <p className="text-sm text-muted">
          Open the link in the email on this device. The link expires after a short time. Check spam if you do not see it.
        </p>
        <Link href="/admin/login" className="inline-block text-sm font-medium text-navy-800 hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="mt-8 space-y-4">
      <p className="text-sm text-muted">
        Enter the email you use for the admin dashboard. We will send a link to choose a new password.
      </p>
      <div>
        <label htmlFor="email" className={adminLabel}>
          Email
        </label>
        <input id="email" name="email" type="email" required autoComplete="email" className={adminInput} />
      </div>
      {state && !state.ok && (
        <p role="alert" className="text-sm text-red-700">
          {state.message}
        </p>
      )}
      <TurnstileField
        siteKey={turnstileSiteKey}
        action="admin-forgot-password"
        resetKey={captchaKey}
        onSuccess={() => setCaptchaReady(true)}
        onExpire={() => setCaptchaReady(false)}
      />
      <SubmitButton className="w-full py-3" disabled={!captchaReady}>
        Send reset link
      </SubmitButton>
      <p className="text-center text-sm">
        <Link href="/admin/login" className="text-navy-700 hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}