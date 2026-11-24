"use client";

import { createAdminUser } from "@/actions/admin-users";
import { ActionForm, PasswordField, SubmitButton, adminInput, adminLabel } from "@/components/admin/forms";

export function AddAdminForm() {
  return (
    <ActionForm action={createAdminUser} resetOnSuccess className="grid max-w-md gap-4">
      <div>
        <label className={adminLabel} htmlFor="admin-email">
          Email
        </label>
        <input id="admin-email" name="email" type="email" required autoComplete="off" className={adminInput} />
      </div>
      <div>
        <label className={adminLabel} htmlFor="admin-password">
          Temporary password
        </label>
        <PasswordField id="admin-password" name="password" required minLength={10} autoComplete="new-password" />
        <p className="mt-1 text-xs text-slate-500">At least 10 characters. They can change it via Forgot password.</p>
      </div>
      <div>
        <label className={adminLabel} htmlFor="admin-password-confirm">
          Confirm password
        </label>
        <input
          id="admin-password-confirm"
          name="password_confirm"
          type="password"
          required
          minLength={10}
          autoComplete="new-password"
          className={adminInput}
        />
      </div>
      <SubmitButton>Add admin user</SubmitButton>
    </ActionForm>
  );
}