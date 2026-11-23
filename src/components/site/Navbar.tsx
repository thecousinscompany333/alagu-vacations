"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, Phone, X } from "lucide-react";
import { formatPhone, phoneDigits } from "@/lib/site";

const LINKS = [
  { href: "/#home", label: "Home" },
  { href: "/#about", label: "About Us" },
  { href: "/#vehicles", label: "Our Vehicles" },
  { href: "/#regions", label: "Regions" },
  { href: "/#packages", label: "Packages" },
  { href: "/#gallery", label: "Gallery" },
  { href: "/#contact", label: "Contact" },
];

export function Navbar({ phone }: { phone: string | null }) {
  const [open, setOpen] = useState(false);
  const [scrolledDown, setScrolled] = useState(false);
  const pathname = usePathname();
  // Transparent only over the home hero; solid everywhere else.
  const scrolled = scrolledDown || pathname !== "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled || open ? "bg-white/95 shadow-[0_1px_0_rgb(10_28_64/0.08)] backdrop-blur" : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8" aria-label="Main">
        <Link href="/#home" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <span className="relative h-12 w-12 overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-gold-300/60">
            <Image src="/images/logo.webp" alt="Alagu Vacations logo" fill sizes="48px" className="object-cover" />
          </span>
          <span className="leading-tight">
            <span className={`block font-display text-lg font-semibold ${scrolled || open ? "text-navy-900" : "text-white"}`}>
              Alagu Vacations
            </span>
            <span className={`block text-[11px] tracking-[0.18em] uppercase ${scrolled || open ? "text-gold-600" : "text-gold-300"}`}>
              Tours &amp; Holidays
            </span>
          </span>
        </Link>

        <ul className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className={`rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                  scrolled ? "text-ink hover:bg-navy-100" : "text-white/90 hover:bg-white/10 hover:text-white"
                }`}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 lg:flex">
          {phone && (
            <a
              href={`tel:+${phoneDigits(phone)}`}
              className={`flex items-center gap-2 text-sm font-semibold ${scrolled ? "text-navy-800" : "text-white"}`}
            >
              <Phone className="h-4 w-4" aria-hidden /> {formatPhone(phone)}
            </a>
          )}
          <Link
            href="/book"
            className="rounded-full bg-gold-500 px-5 py-2.5 text-sm font-semibold text-navy-950 shadow-sm transition hover:bg-gold-300"
          >
            Book Now
          </Link>
        </div>

        <button
          type="button"
          className={`rounded-full p-2 lg:hidden ${scrolled || open ? "text-navy-900" : "text-white"}`}
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {open && (
        <div id="mobile-menu" className="h-[calc(100dvh-4.5rem)] overflow-y-auto border-t border-navy-100 bg-white px-4 pb-8 lg:hidden">
          <ul className="flex flex-col py-2">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block border-b border-navy-100/70 py-4 font-display text-xl text-navy-900"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-6 grid gap-3">
            <Link
              href="/book"
              onClick={() => setOpen(false)}
              className="rounded-full bg-gold-500 py-3.5 text-center font-semibold text-navy-950"
            >
              Book Your Trip
            </Link>
            {phone && (
              <a
                href={`tel:+${phoneDigits(phone)}`}
                className="flex items-center justify-center gap-2 rounded-full border border-navy-800 py-3.5 font-semibold text-navy-800"
              >
                <Phone className="h-4 w-4" aria-hidden /> Call {formatPhone(phone)}
              </a>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
