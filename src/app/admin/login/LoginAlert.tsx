"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

const LOGIN_ERRORS: Record<string, string> = {
  "reset-link": "That password reset link is invalid or has expired. Request a new link below.",
};

export function LoginAlert() {
  const searchParams = useSearchParams();
  const code = searchParams.get("error");
  const alert = code ? LOGIN_ERRORS[code] : null;
  if (!alert) return null;

  return (
    <p role="alert" className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-950">
      {alert}{" "}
      <Link href="/admin/forgot-password" className="font-medium text-navy-800 underline">
        Forgot password
      </Link>
    </p>
  );
}