"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { CalendarDays, CircleCheck, Copy, Loader2, MapPin, Navigation, Phone, TriangleAlert, Users } from "lucide-react";
import { submitEnquiry, type EnquiryState } from "@/actions/enquiry";
import { WhatsAppIcon } from "@/components/icons";
import { TRIP_TYPES } from "@/lib/types";
import { buildEnquiryMessage, formatDate, formatPhone, phoneDigits, whatsappLink } from "@/lib/site";
import { todayInIndia } from "@/lib/validation";
import { TurnstileField } from "@/components/site/TurnstileField";
import { useClientValue } from "@/lib/use-client-value";

type Props = {
  prefill: Record<string, string>;
  vehicleOptions: string[];
  phone: string | null;
  whatsapp: string | null;
  /** Earliest selectable pickup/return date (Asia/Kolkata), from the server render. */
  minDate: string;
  demo?: boolean;
};

const input =
  "w-full rounded-xl border bg-white px-4 py-3 text-[15px] text-ink placeholder:text-muted/60 transition focus:outline-none focus:ring-2";
const ok = "border-navy-100 focus:border-gold-500 focus:ring-gold-300/50";
const bad = "border-red-400 focus:border-red-500 focus:ring-red-200";
const lbl = "mb-1.5 block text-sm font-semibold text-navy-900";

export function BookingForm({ prefill, vehicleOptions, phone, whatsapp, minDate, demo = false }: Props) {
  const [state, action, pending] = useActionState<EnquiryState, FormData>(submitEnquiry, { status: "idle" });
  const formRef = useRef<HTMLFormElement>(null);
  const today = useClientValue(todayInIndia, minDate);
  const startedAtRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const [captchaKey, setCaptchaKey] = useState(0);
  const hasTurnstile = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
  const [captchaReady, setCaptchaReady] = useState(!hasTurnstile);

  // Records when the visitor started filling the form (spam check in the server action).
  useEffect(() => {
    if (startedAtRef.current && !startedAtRef.current.value) startedAtRef.current.value = String(Date.now());
  }, []);

  useEffect(() => {
    if (state.status === "success" || state.status === "error") {
      document.getElementById("booking-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (state.status === "error") {
      setCaptchaKey((k) => k + 1);
      setCaptchaReady(!hasTurnstile);
    }
  }, [state, hasTurnstile]);

  if (state.status === "success") {
    const e = state.enquiry;
    const wa = whatsappLink(
      whatsapp,
      buildEnquiryMessage({ reference: state.reference, ...e, passengers: e.passengers }),
    );
    return (
      <div className="rounded-[1.75rem] bg-white p-6 text-center shadow-lift ring-1 ring-navy-100 sm:p-10" role="status">
        <CircleCheck className="mx-auto h-14 w-14 text-emerald-600" aria-hidden />
        <h2 className="mt-4 font-display text-3xl font-semibold text-navy-900">Enquiry received!</h2>
        <p className="mx-auto mt-2 max-w-md text-muted">
          Thank you, {e.full_name.split(" ")[0]}. Our team will check vehicle availability for your dates and contact you on{" "}
          <span className="font-semibold text-ink">{formatPhone(e.mobile)}</span>.
        </p>

        <div className="mx-auto mt-6 inline-flex items-center gap-3 rounded-2xl bg-gold-100 px-5 py-3">
          <span className="text-sm text-muted">Your enquiry reference</span>
          <span className="font-mono text-lg font-bold tracking-wider text-navy-900">{state.reference}</span>
          <button
            type="button"
            className="rounded-lg p-1.5 text-navy-800 hover:bg-gold-300/50"
            aria-label="Copy reference"
            onClick={() => {
              navigator.clipboard?.writeText(state.reference);
              setCopied(true);
            }}
          >
            {copied ? <CircleCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>

        <dl className="mx-auto mt-6 grid max-w-lg grid-cols-2 gap-x-6 gap-y-3 text-left text-sm">
          <Detail k="From" v={e.pickup_location} />
          <Detail k="To" v={e.destination} />
          <Detail k="Start" v={formatDate(e.pickup_date)} />
          <Detail k="Return" v={e.return_date ? formatDate(e.return_date) : "—"} />
          <Detail k="Passengers" v={String(e.passengers)} />
          <Detail k="Trip type" v={e.trip_type ?? "—"} />
        </dl>

        {demo && (
          <p className="mx-auto mt-6 max-w-md rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <strong>Preview website:</strong> this is a demo enquiry. No vehicle is reserved, nothing is charged and no
            notification is sent. The WhatsApp button below opens a real chat with Alagu Vacations, so only send it if you
            mean to contact them.
          </p>
        )}
        <p className="mx-auto mt-6 max-w-md rounded-xl bg-navy-100/60 px-4 py-3 text-sm text-navy-900">
          This is an <strong>enquiry</strong>, not a confirmed booking. Your trip is confirmed only after we verify availability and
          speak with you.
        </p>
        {wa && !demo && (
          <p className="mx-auto mt-4 max-w-md text-sm text-muted">
            <strong className="text-ink">Next step:</strong> tap the green button below, then press <strong>Send</strong> in
            WhatsApp so your trip details reach Alagu on the same number you see on our site.
          </p>
        )}

        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          {wa && (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1fa855] px-6 py-3.5 font-semibold text-white shadow-sm hover:bg-[#178a45]"
            >
              <WhatsAppIcon className="h-5 w-5" /> Send enquiry to Alagu on WhatsApp
            </a>
          )}
          {phone && (
            <a
              href={`tel:+${phoneDigits(phone)}`}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-navy-800 px-6 py-3.5 font-semibold text-navy-800 hover:bg-navy-100"
            >
              <Phone className="h-4 w-4" aria-hidden /> Call {formatPhone(phone)}
            </a>
          )}
        </div>
        <Link href="/" className="mt-6 inline-block text-sm font-semibold text-navy-700 underline-offset-4 hover:underline">
          Back to home
        </Link>
      </div>
    );
  }

  const errors = state.status === "error" ? state.errors ?? {} : {};
  const values = state.status === "error" && state.values ? state.values : prefill;
  // Re-mount fields after a failed submit so they show the submitted values.
  const formKey = state.status === "error" ? JSON.stringify(state.values ?? {}) : "initial";

  function sendWhatsAppDraft() {
    const fd = new FormData(formRef.current ?? undefined);
    const get = (k: string) => String(fd.get(k) ?? "").trim();
    const link = whatsappLink(
      whatsapp,
      buildEnquiryMessage({
        full_name: get("full_name"), mobile: get("mobile"), pickup_location: get("pickup_location"),
        destination: get("destination"), pickup_date: get("pickup_date"), return_date: get("return_date"),
        passengers: get("passengers"), vehicle_preference: get("vehicle_preference"), trip_type: get("trip_type"),
        notes: get("notes"),
      }),
    );
    if (link) window.open(link, "_blank", "noopener,noreferrer");
  }

  const fieldError = (name: keyof typeof errors) =>
    errors[name] ? (
      <p id={`${name}-error`} className="mt-1.5 text-sm text-red-700">{errors[name]}</p>
    ) : null;
  const aria = (name: keyof typeof errors) =>
    errors[name] ? { "aria-invalid": true, "aria-describedby": `${name}-error` } : {};

  return (
    <form
      key={formKey}
      ref={formRef}
      action={action}
      noValidate
      className="rounded-[1.75rem] bg-white p-5 shadow-lift ring-1 ring-navy-100 sm:p-8"
    >
      {state.status === "error" && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>{state.message}</p>
        </div>
      )}

      {/* Spam protection: humans never see or fill this field. */}
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label>Company<input name="company" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <input ref={startedAtRef} type="hidden" name="started_at" defaultValue="" />

      <fieldset>
        <legend className="mb-4 font-display text-xl font-semibold text-navy-900">Your details</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="full_name" className={lbl}>Full name <span className="text-red-600">*</span></label>
            <input id="full_name" name="full_name" required autoComplete="name" defaultValue={values.full_name ?? ""}
              className={`${input} ${errors.full_name ? bad : ok}`} {...aria("full_name")} />
            {fieldError("full_name")}
          </div>
          <div>
            <label htmlFor="mobile" className={lbl}>Mobile number <span className="text-red-600">*</span></label>
            <input id="mobile" name="mobile" type="tel" required inputMode="tel" autoComplete="tel" placeholder="10-digit mobile"
              defaultValue={values.mobile ?? ""} className={`${input} ${errors.mobile ? bad : ok}`} {...aria("mobile")} />
            {fieldError("mobile")}
          </div>
          <div>
            <label htmlFor="email" className={lbl}>Email <span className="font-normal text-muted">(optional)</span></label>
            <input id="email" name="email" type="email" autoComplete="email" defaultValue={values.email ?? ""}
              className={`${input} ${errors.email ? bad : ok}`} {...aria("email")} />
            {fieldError("email")}
          </div>
        </div>
      </fieldset>

      <fieldset className="mt-8">
        <legend className="mb-4 font-display text-xl font-semibold text-navy-900">Trip details</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="pickup_location" className={lbl}><MapPin className="mr-1 inline h-4 w-4 text-gold-600" aria-hidden />Pickup location <span className="text-red-600">*</span></label>
            <input id="pickup_location" name="pickup_location" required placeholder="Area / town" defaultValue={values.pickup_location ?? ""}
              className={`${input} ${errors.pickup_location ? bad : ok}`} {...aria("pickup_location")} />
            {fieldError("pickup_location")}
          </div>
          <div>
            <label htmlFor="destination" className={lbl}><Navigation className="mr-1 inline h-4 w-4 text-gold-600" aria-hidden />Destination <span className="text-red-600">*</span></label>
            <input id="destination" name="destination" required placeholder="Where would you like to go?" defaultValue={values.destination ?? ""}
              className={`${input} ${errors.destination ? bad : ok}`} {...aria("destination")} />
            {fieldError("destination")}
          </div>
          <div>
            <label htmlFor="pickup_date" className={lbl}><CalendarDays className="mr-1 inline h-4 w-4 text-gold-600" aria-hidden />Pickup date <span className="text-red-600">*</span></label>
            <input id="pickup_date" name="pickup_date" type="date" required min={today} defaultValue={values.pickup_date ?? ""}
              className={`${input} ${errors.pickup_date ? bad : ok}`} {...aria("pickup_date")} />
            {fieldError("pickup_date")}
          </div>
          <div>
            <label htmlFor="return_date" className={lbl}><CalendarDays className="mr-1 inline h-4 w-4 text-gold-600" aria-hidden />Return date</label>
            <input id="return_date" name="return_date" type="date" min={today} defaultValue={values.return_date ?? ""}
              className={`${input} ${errors.return_date ? bad : ok}`} {...aria("return_date")} />
            {fieldError("return_date")}
          </div>
          <div>
            <label htmlFor="passengers" className={lbl}><Users className="mr-1 inline h-4 w-4 text-gold-600" aria-hidden />Number of passengers <span className="text-red-600">*</span></label>
            <input id="passengers" name="passengers" type="number" required min={1} max={80} inputMode="numeric" defaultValue={values.passengers ?? ""}
              className={`${input} ${errors.passengers ? bad : ok}`} {...aria("passengers")} />
            {fieldError("passengers")}
          </div>
          <div>
            <label htmlFor="vehicle_preference" className={lbl}>Vehicle preference</label>
            <select id="vehicle_preference" name="vehicle_preference" defaultValue={values.vehicle_preference ?? ""} className={`${input} ${ok}`}>
              <option value="">No preference</option>
              {vehicleOptions.map((v) => <option key={v}>{v}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="trip_type" className={lbl}>Trip type</label>
            <select id="trip_type" name="trip_type" defaultValue={values.trip_type ?? ""} className={`${input} ${ok}`}>
              <option value="">Select…</option>
              {TRIP_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="notes" className={lbl}>Additional requirements</label>
            <textarea id="notes" name="notes" rows={4} maxLength={1500} placeholder="Places to cover, luggage, pickup time, anything else we should know"
              defaultValue={values.notes ?? ""} className={`${input} ${errors.notes ? bad : ok}`} {...aria("notes")} />
            {fieldError("notes")}
          </div>
        </div>
      </fieldset>

      <label className="mt-6 flex items-start gap-3 text-sm text-muted">
        <input type="checkbox" name="consent" required className="mt-0.5 h-4 w-4 rounded accent-navy-800" defaultChecked={state.status === "error"} />
        <span>
          I agree that Alagu Vacations may contact me by phone or WhatsApp about this enquiry. See our{" "}
          <Link href="/privacy" className="font-semibold text-navy-700 underline underline-offset-2">privacy policy</Link>.
        </span>
      </label>

      <div className="mt-6">
        <TurnstileField
          action="booking-enquiry"
          resetKey={captchaKey}
          onSuccess={() => setCaptchaReady(true)}
          onExpire={() => setCaptchaReady(false)}
        />
      </div>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={pending || !captchaReady}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-navy-800 px-8 py-4 font-semibold text-white transition hover:bg-navy-700 disabled:cursor-wait disabled:opacity-70"
        >
          {pending ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Sending…</> : "Submit Booking Enquiry"}
        </button>
        {whatsapp && (
          <button
            type="button"
            onClick={sendWhatsAppDraft}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[#1fa855] px-6 py-4 font-semibold text-[#178a45] hover:bg-[#1fa855]/10"
          >
            <WhatsAppIcon className="h-5 w-5" /> Enquire on WhatsApp instead
          </button>
        )}
      </div>
      <p className="mt-4 text-xs text-muted">
        Submitting sends an enquiry only. No payment is taken, and your trip is confirmed after we verify availability.
      </p>
    </form>
  );
}

function Detail({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-muted">{k}</dt>
      <dd className="font-medium text-ink">{v}</dd>
    </div>
  );
}
