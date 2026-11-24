import { Suspense } from "react";
import { saveSettings } from "@/actions/admin";
import { ActionForm, SubmitButton, adminInput, adminLabel } from "@/components/admin/forms";
import { Card, LoadingBlock, PageTitle } from "@/components/admin/ui";
import { requireSuperAdmin } from "@/lib/auth";
import { FALLBACK_SETTINGS } from "@/lib/fallback";
import type { SiteSettings } from "@/lib/types";

export default function SettingsPage() {
  return (
    <>
      <PageTitle title="Business details" text="Contact details used across the website, the WhatsApp buttons and the footer." />
      <Suspense fallback={<LoadingBlock />}><SettingsForm /></Suspense>
    </>
  );
}

async function SettingsForm() {
  const { supabase } = await requireSuperAdmin();
  const { data } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
  const s: SiteSettings = { ...FALLBACK_SETTINGS, ...(data ?? {}) };
  const field = (name: keyof SiteSettings, label: string, opts: { type?: string; placeholder?: string; hint?: string } = {}) => (
    <div>
      <label className={adminLabel}>
        {label}
        <input name={name} type={opts.type ?? "text"} defaultValue={s[name] ?? ""} placeholder={opts.placeholder} className={adminInput} />
      </label>
      {opts.hint && <p className="mt-1 text-xs text-slate-500">{opts.hint}</p>}
    </div>
  );
  return (
    <Card>
      <ActionForm key={JSON.stringify(s)} action={saveSettings} className="grid gap-5 sm:grid-cols-2">
        {field("business_name", "Business name")}
        {field("tagline", "Tagline")}
        {field("phone", "Phone (click-to-call)", { type: "tel", placeholder: "10-digit number" })}
        {field("whatsapp", "WhatsApp number", { type: "tel", hint: "Customers' WhatsApp messages are sent to this number." })}
        {field("email", "Email", { type: "email", hint: "Leave empty to hide email on the website." })}
        {field("instagram_url", "Instagram URL", { type: "url" })}
        {field("address", "Street address", { hint: "Leave empty until confirmed." })}
        {field("city", "City / area")}
        {field("since_text", "Since / heritage line", { placeholder: "e.g. Alagu Travels, since 1992" })}
        {field("map_query", "Google Maps location", { hint: "Address or place name used for the map." })}
        <div className="sm:col-span-2">
          <label className={adminLabel}>
            About text
            <textarea name="about_text" rows={4} defaultValue={s.about_text ?? ""} className={adminInput} />
          </label>
        </div>
        <div className="sm:col-span-2"><SubmitButton>Save business details</SubmitButton></div>
      </ActionForm>
    </Card>
  );
}
