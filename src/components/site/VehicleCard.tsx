"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Check, Users } from "lucide-react";
import type { Vehicle } from "@/lib/types";

export function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const photos = vehicle.photos.length ? vehicle.photos : vehicle.image_url ? [vehicle.image_url] : [];
  const [active, setActive] = useState(0);
  const main = photos[active];

  return (
    <article className="overflow-hidden rounded-[1.75rem] bg-white shadow-card ring-1 ring-navy-100 lg:grid lg:grid-cols-[1.05fr_1fr]">
      <div className="bg-navy-900 p-3 sm:p-4">
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-navy-800 sm:aspect-[5/4] lg:aspect-square">
          {main ? (
            <Image src={main} alt={`${vehicle.name}: photo ${active + 1}`} fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
          ) : null}
          {vehicle.seats && (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-navy-900 shadow">
              <Users className="h-3.5 w-3.5" aria-hidden /> {vehicle.seats} Seater
            </span>
          )}
        </div>
        {photos.length > 1 && (
          <ul className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="More photos">
            {photos.map((p, i) => (
              <li key={p} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setActive(i)}
                  className={`relative block h-16 w-16 overflow-hidden rounded-xl ring-2 transition ${i === active ? "ring-gold-500" : "ring-transparent opacity-70 hover:opacity-100"}`}
                  aria-label={`Show photo ${i + 1}`}
                  aria-current={i === active}
                >
                  <Image src={p} alt="" fill sizes="64px" className="object-cover" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col p-6 sm:p-8 lg:justify-center lg:p-10">
        {vehicle.model && <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">{vehicle.model}</p>}
        <h3 className="mt-2 font-display text-3xl font-semibold text-navy-900">{vehicle.name}</h3>
        {vehicle.description && <p className="mt-3 text-muted">{vehicle.description}</p>}

        {vehicle.facilities.length > 0 && (
          <>
            <h4 className="mt-6 text-sm font-semibold text-navy-900">Facilities</h4>
            <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
              {vehicle.facilities.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-ink">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden /> {f}
                </li>
              ))}
            </ul>
          </>
        )}

        {vehicle.trip_types.length > 0 && (
          <>
            <h4 className="mt-6 text-sm font-semibold text-navy-900">Ideal for</h4>
            <ul className="mt-3 flex flex-wrap gap-2">
              {vehicle.trip_types.map((t) => (
                <li key={t} className="rounded-full bg-gold-100 px-3 py-1 text-xs font-semibold text-gold-600">{t}</li>
              ))}
            </ul>
          </>
        )}

        <div className="pt-8">
          <Link
            href={`/book?vehicle_id=${encodeURIComponent(vehicle.id)}#booking-form`}
            className="inline-flex items-center gap-2 rounded-full bg-navy-800 px-6 py-3.5 font-semibold text-white transition hover:bg-navy-700"
          >
            Enquire Now <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </article>
  );
}
