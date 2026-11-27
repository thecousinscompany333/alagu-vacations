"use client";

import { useState } from "react";
import { createAdminUser } from "@/actions/admin-users";
import { ActionForm, PasswordField, SubmitButton, adminInput, adminLabel } from "@/components/admin/forms";

export function AddAdminForm() {
  const [role, setRole] = useState("admin");
  const isPartner = role === "partner";

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
        <label className={adminLabel} htmlFor="admin-role">
          Role
        </label>
        <select id="admin-role" name="role" value={role} onChange={(e) => setRole(e.target.value)} className={adminInput}>
          <option value="admin">Admin (enquiries + add content)</option>
          <option value="super_admin">Super admin (full access)</option>
          <option value="partner">Partner (vehicle owner: sees only their own vehicles&apos; enquiries)</option>
        </select>
      </div>
      {isPartner && (
        <fieldset className="grid gap-4 rounded-lg border border-slate-200 p-4">
          <legend className="px-1 text-sm font-medium text-slate-700">Partner business</legend>
          <div>
            <label className={adminLabel} htmlFor="partner-business">
              Business name *
            </label>
            <input id="partner-business" name="business_name" required minLength={2} maxLength={120} className={adminInput} />
          </div>
          <div>
            <label className={adminLabel} htmlFor="partner-contact">
              Contact person
            </label>
            <input id="partner-contact" name="contact_name" maxLength={100} className={adminInput} />
          </div>
          <div>
            <label className={adminLabel} htmlFor="partner-phone">
              Phone
            </label>
            <input id="partner-phone" name="phone" type="tel" maxLength={20} className={adminInput} />
          </div>
          <p className="text-xs text-slate-500">After adding, assign their vehicles on the Vehicles page (Owner).</p>
        </fieldset>
      )}
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
      <SubmitButton>{isPartner ? "Add partner" : "Add admin user"}</SubmitButton>
    </ActionForm>
  );
}
