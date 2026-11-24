import type { Metadata } from "next";
import Image from "next/image";
import { turnstileSiteKey } from "@/lib/turnstile-public";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export const metadata: Metadata = { title: "Forgot password", robots: { index: false, follow: false } };

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-navy-900 bg-ornament px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lift">
        <div className="flex flex-col items-center text-center">
          <span className="relative h-16 w-16 overflow-hidden rounded-full ring-2 ring-gold-300">
            <Image src="/images/logo.webp" alt="Alagu Vacations" fill sizes="64px" className="object-cover" />
          </span>
          <h1 className="mt-4 font-display text-2xl font-semibold text-navy-900">Reset password</h1>
          <p className="mt-1 text-sm text-muted">Admin account recovery</p>
        </div>
        <ForgotPasswordForm turnstileSiteKey={turnstileSiteKey()} />
      </div>
    </main>
  );
}