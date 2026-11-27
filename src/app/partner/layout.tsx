import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { Bus, Inbox, LogOut } from "lucide-react";
import { signOut } from "@/actions/admin";
import { getPartner } from "@/lib/auth";

export const metadata: Metadata = { title: "Partner", robots: { index: false, follow: false } };

const NAV = [
  { href: "/partner", label: "My enquiries", icon: Inbox },
  { href: "/partner/vehicles", label: "My vehicles", icon: Bus },
] as const;

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-slate-50 lg:flex-row">
      <aside className="border-b border-slate-200 bg-navy-950 text-white lg:sticky lg:top-0 lg:h-dvh lg:w-64 lg:shrink-0 lg:border-b-0">
        <div className="flex items-center gap-3 px-5 py-4">
          <span className="relative h-10 w-10 overflow-hidden rounded-full bg-white">
            <Image src="/images/logo.webp" alt="" fill sizes="40px" className="object-cover" />
          </span>
          <div className="min-w-0 leading-tight">
            <p className="font-display font-semibold">Alagu Vacations</p>
            <Suspense fallback={<p className="text-xs text-white/50">Partner</p>}>
              <BusinessName />
            </Suspense>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:pb-0" aria-label="Partner">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-white/80 hover:bg-white/10 hover:text-white">
              <Icon className="h-4 w-4" aria-hidden /> {label}
            </Link>
          ))}
        </nav>
        <div className="hidden px-5 py-4 lg:absolute lg:bottom-0 lg:block lg:w-64">
          <Suspense fallback={null}><SignedInAs /></Suspense>
          <form action={signOut} className="mt-2">
            <button type="submit" className="flex items-center gap-2 text-sm text-white/70 hover:text-white">
              <LogOut className="h-4 w-4" aria-hidden /> Sign out
            </button>
          </form>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <div className="flex justify-end border-b border-slate-200 bg-white px-4 py-2 lg:hidden">
          <form action={signOut}>
            <button type="submit" className="flex items-center gap-2 text-sm text-slate-600"><LogOut className="h-4 w-4" aria-hidden /> Sign out</button>
          </form>
        </div>
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</div>
      </div>
    </div>
  );
}

async function BusinessName() {
  const session = await getPartner();
  return <p className="truncate text-xs text-white/50">{session ? `Partner · ${session.partner.business_name}` : "Partner"}</p>;
}

async function SignedInAs() {
  const session = await getPartner();
  return session ? <p className="truncate text-xs text-white/50">{session.user.email}</p> : null;
}
