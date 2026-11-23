import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { DemoGateForm } from "@/app/demo-access/DemoGateForm";
import { isDemoMode, safeNextPath } from "@/lib/demo";
import { turnstileSiteKey } from "@/lib/turnstile-public";

export const metadata: Metadata = {
  title: "Private preview",
  robots: { index: false, follow: false },
};

const MESSAGES: Record<string, string> = {
  invalid: "That password isn't right. Please try again.",
  locked: "Too many attempts. Please wait 15 minutes and try again.",
  config: "The preview isn't configured yet. Please contact the developer.",
  captcha: "Please complete the security check (CAPTCHA) and try again.",
};

export default function DemoAccessPage(props: PageProps<"/demo-access">) {
  if (!isDemoMode()) notFound();
  return (
    <main className="relative flex min-h-dvh items-center justify-center bg-navy-900 bg-ornament px-4 py-12">
      <div className="w-full max-w-md rounded-[1.75rem] bg-white p-8 shadow-lift sm:p-10">
        <div className="flex flex-col items-center text-center">
          {/* Plain <img>: the image optimiser is behind the gate. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.webp" alt="Alagu Vacations" width={88} height={88} className="h-22 w-22 rounded-full object-cover ring-2 ring-gold-300" />
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.22em] text-gold-600">Preview Website – Alagu Vacations</p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-navy-900">Private preview</h1>
          <p className="mt-2 text-sm text-muted">
            This website is shared privately for review. Enter the preview password you were given.
          </p>
        </div>
        <Suspense fallback={<DemoGateForm next="/" turnstileSiteKey={turnstileSiteKey()} />}>
          <GateFormFromParams searchParams={props.searchParams} />
        </Suspense>
        <p className="mt-6 text-center text-xs text-muted">
          Demo only: bookings made here are test enquiries and no vehicle is reserved.
        </p>
      </div>
    </main>
  );
}

async function GateFormFromParams({ searchParams }: { searchParams: PageProps<"/demo-access">["searchParams"] }) {
  const sp = await searchParams;
  const next = safeNextPath(typeof sp.next === "string" ? sp.next : "/");
  const error = typeof sp.error === "string" ? MESSAGES[sp.error] : undefined;
  const signedOut = sp.signed_out === "1";
  return (
    <DemoGateForm
      next={next}
      turnstileSiteKey={turnstileSiteKey()}
      error={error}
      info={signedOut ? "You've left the preview on this device." : undefined}
    />
  );
}
