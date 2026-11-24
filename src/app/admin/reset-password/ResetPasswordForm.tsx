"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { completePasswordReset } from "@/actions/admin";
import { PasswordField, SubmitButton, adminInput, adminLabel } from "@/components/admin/forms";
import { TurnstileField } from "@/components/site/TurnstileField";

export function ResetPasswordForm({ turnstileSiteKey }: { turnstileSiteKey: string }) {
  const [state, action] = useActionState(completePasswordReset, null);
  const hasTurnstile = Boolean(turnstileSiteKey);
  const [captchaKey, setCaptchaKey] = useState(0);
  const [captchaReady, setCaptchaReady] = useState(!hasTurnstile);

  useEffect(() => {
    if (state && !state.ok) {
      setCaptchaKey((k) => k + 1);
      setCaptchaReady(!hasTurnstile);
    }
  }, [state, hasTurnstile]);

  return (
    <form action={action} className="mt-8 space-y-4">
      <p className="text-sm text-muted">Choose a new password for your admin account (at least 8 characters).</p>
      <div>
        <label htmlFor="password" className={adminLabel}>
          New password
        </label>
        <PasswordField id="password" name="password" required minLength={8} autoComplete="new-password" />
      </div>
      <div>
        <label htmlFor="password_confirm" className={adminLabel}>
          Confirm password
        </label>
        <input
          id="password_confirm"
          name="password_confirm"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={adminInput}
        />
      </div>
      {state && !state.ok && (
        <p role="alert" className="text-sm text-red-700">
          {state.message}
        </p>
      )}
      <TurnstileField
        siteKey={turnstileSiteKey}
        action="admin-reset-password"
        resetKey={captchaKey}
        onSuccess={() => setCaptchaReady(true)}
        onExpire={() => setCaptchaReady(false)}
      />
      <SubmitButton className="w-full py-3" disabled={!captchaReady}>
        Save new password
      </SubmitButton>
      <p className="text-center text-sm">
        <Link href="/admin/login" className="text-navy-700 hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}