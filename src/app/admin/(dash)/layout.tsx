import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { Bus, ExternalLink, Image as ImageIcon, Inbox, LogOut, Package, Settings, UserCog } from "lucide-react";
import { signOut } from "@/actions/admin";
import { getAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

const NAV = [
  { href: "/admin", label: "Enquiries", icon: Inbox, superOnly: false },
  { href: "/admin/vehicles", label: "Vehicles", icon: Bus, superOnly: false },
  { href: "/admin/packages", label: "Packages", icon: Package, superOnly: false },
  { href: "/admin/gallery", label: "Gallery", icon: ImageIcon, superOnly: false },
  { href: "/admin/settings", label: "Business details", icon: Settings, superOnly: true },
  { href: "/admin/users", label: "Admin users", icon: UserCog, superOnly: true },
] as const;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-slate-50 lg:flex-row">
      <aside className="border-b border-slate-200 bg-navy-950 text-white lg:sticky lg:top-0 lg:h-dvh lg:w-64 lg:shrink-0 lg:border-b-0">
        <div className="flex items-center gap-3 px-5 py-4">
          <span className="relative h-10 w-10 overflow-hidden rounded-full bg-white">
            <Image src="/images/logo.webp" alt="" fill sizes="40px" className="object-cover" />
          </span>
          <div className="leading-tight">
            <p className="font-display font-semibold">Alagu Vacations</p>
            <p className="text-xs text-white/50">Admin</p>
          </div>
        </div>
        <Suspense fallback={<nav className="h-10 animate-pulse rounded-lg bg-white/5 mx-3" aria-hidden />}>
          <AdminNav />
        </Suspense>
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

async function AdminNav() {
  const admin = await getAdmin();
  const nav = NAV.filter((item) => !item.superOnly || admin?.role === "super_admin");
  return (
    <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:pb-0" aria-label="Admin">
      {nav.map(({ href, label, icon: Icon }) => (
        <Link key={href} href={href} className="flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-white/80 hover:bg-white/10 hover:text-white">
          <Icon className="h-4 w-4" aria-hidden /> {label}
        </Link>
      ))}
      <Link href="/" target="_blank" className="flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-white/60 hover:bg-white/10 hover:text-white">
        <ExternalLink className="h-4 w-4" aria-hidden /> View website
      </Link>
    </nav>
  );
}

async function SignedInAs() {
  const admin = await getAdmin();
  return admin ? <p className="truncate text-xs text-white/50">{admin.user.email}</p> : null;
}
