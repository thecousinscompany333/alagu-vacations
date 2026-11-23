import "server-only";
import { buildAdminEnquiryAlert } from "@/lib/admin-enquiry-alert";
import { getSettings } from "@/lib/data";
import { isDemoMode } from "@/lib/demo";
import { phoneDigits } from "@/lib/site";
import type { EnquiryInput } from "@/lib/validation";

const NOTIFY_TIMEOUT_MS = 12_000;

/** E.164 digits only, e.g. 917010998586 */
function resolveNotifyRecipient(fallbackWhatsapp: string | null | undefined): string | null {
  const fromEnv = process.env.WHATSAPP_NOTIFY_PHONE?.replace(/\D/g, "") ?? "";
  if (fromEnv.length >= 10) return fromEnv;
  return phoneDigits(fallbackWhatsapp) || null;
}

async function sendViaCallMeBot(phone: string, text: string): Promise<boolean> {
  const apikey = process.env.WHATSAPP_CALLMEBOT_APIKEY?.trim();
  if (!apikey) return false;

  const url = new URL("https://api.callmebot.com/whatsapp.php");
  url.searchParams.set("phone", phone);
  url.searchParams.set("text", text);
  url.searchParams.set("apikey", apikey);

  const res = await fetch(url, { method: "GET", signal: AbortSignal.timeout(NOTIFY_TIMEOUT_MS) });
  if (!res.ok) {
    console.error("[notify-whatsapp] CallMeBot HTTP", res.status);
    return false;
  }
  const body = (await res.text()).toLowerCase();
  if (body.includes("error")) {
    console.error("[notify-whatsapp] CallMeBot:", body.slice(0, 200));
    return false;
  }
  return true;
}

async function sendViaMetaCloudApi(phone: string, text: string): Promise<boolean> {
  const token = process.env.WHATSAPP_CLOUD_ACCESS_TOKEN?.trim();
  const phoneNumberId = process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID?.trim();
  if (!token || !phoneNumberId) return false;

  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phone,
      type: "text",
      text: { preview_url: false, body: text },
    }),
    signal: AbortSignal.timeout(NOTIFY_TIMEOUT_MS),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[notify-whatsapp] Meta Cloud API:", res.status, err.slice(0, 300));
    return false;
  }
  return true;
}

/**
 * Sends a WhatsApp alert to the business/admin number when a new enquiry is saved.
 * Does not block or fail the customer flow if notification fails.
 *
 * Configure one of:
 * - WHATSAPP_CALLMEBOT_APIKEY (+ optional WHATSAPP_NOTIFY_PHONE, else site_settings.whatsapp)
 * - WHATSAPP_CLOUD_ACCESS_TOKEN + WHATSAPP_CLOUD_PHONE_NUMBER_ID (+ recipient as above)
 */
export async function notifyAdminNewEnquiry(reference: string, enquiry: EnquiryInput): Promise<void> {
  if (isDemoMode()) return;

  const hasCallMeBot = Boolean(process.env.WHATSAPP_CALLMEBOT_APIKEY?.trim());
  const hasCloud = Boolean(
    process.env.WHATSAPP_CLOUD_ACCESS_TOKEN?.trim() && process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID?.trim(),
  );
  if (!hasCallMeBot && !hasCloud) return;

  try {
    const settings = await getSettings();
    const phone = resolveNotifyRecipient(settings.whatsapp ?? settings.phone);
    if (!phone) {
      console.error("[notify-whatsapp] No WHATSAPP_NOTIFY_PHONE or site WhatsApp number configured.");
      return;
    }

    const text = buildAdminEnquiryAlert(reference, enquiry);

    if (hasCloud) {
      const ok = await sendViaMetaCloudApi(phone, text);
      if (ok) return;
    }
    if (hasCallMeBot) {
      await sendViaCallMeBot(phone, text);
    }
  } catch (err) {
    console.error("[notify-whatsapp] failed:", err instanceof Error ? err.message : err);
  }
}