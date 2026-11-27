import Image from "next/image";
import { Suspense } from "react";
import { savePartnerVehicle } from "@/actions/partner";
import { ActionForm, SubmitButton, adminInput, adminLabel } from "@/components/admin/forms";
import { Card, LoadingBlock, PageTitle } from "@/components/admin/ui";
import { PhotosField } from "@/components/partner/PhotosField";
import { requirePartner } from "@/lib/auth";
import type { Vehicle } from "@/lib/types";

export default function PartnerVehiclesPage() {
  return (
    <>
      <PageTitle
        title="My vehicles"
        text="Vehicles Alagu Vacations has listed for you. You can update the description, photos, facilities and seats. Contact Alagu Vacations to change the name or to show or hide a vehicle."
      />
      <Suspense fallback={<LoadingBlock />}><VehiclesList /></Suspense>
    </>
  );
}

async function VehiclesList() {
  const { supabase, partner } = await requirePartner();
  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .eq("partner_id", partner.id)
    .order("sort_order")
    .order("created_at");
  const vehicles = (data ?? []) as Vehicle[];

  if (error) return <p className="text-sm text-red-700">Could not load your vehicles.</p>;
  if (!vehicles.length) {
    return <Card className="text-center text-slate-600">No vehicles are assigned to you yet. Alagu Vacations adds them for you.</Card>;
  }

  return (
    <div className="space-y-4">
      {vehicles.map((v) => (
        <Card key={v.id}>
          <details open={vehicles.length === 1}>
            <summary className="flex cursor-pointer list-none items-center gap-4">
              <span className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                {v.image_url && <Image src={v.image_url} alt="" fill sizes="80px" className="object-cover" />}
              </span>
              <span className="flex-1">
                <span className="block font-semibold text-navy-900">{v.name}</span>
                <span className="text-sm text-slate-500">
                  {v.seats ? `${v.seats} seats · ` : ""}{v.is_active ? "Shown on website" : "Hidden from website"}
                </span>
              </span>
              <span className="text-sm font-medium text-navy-700">Edit</span>
            </summary>
            <div className="mt-5 border-t border-slate-100 pt-5">
              <ActionForm key={JSON.stringify(v)} action={savePartnerVehicle} className="grid gap-4 sm:grid-cols-2">
                <input type="hidden" name="id" value={v.id} />
                <div>
                  <label className={adminLabel}>Seats
                    <input name="seats" type="number" min={1} max={80} defaultValue={v.seats ?? ""} className={adminInput} />
                  </label>
                </div>
                <div className="sm:col-span-2">
                  <label className={adminLabel}>Description
                    <textarea name="description" rows={3} maxLength={1000} defaultValue={v.description ?? ""} className={adminInput} />
                  </label>
                </div>
                <div className="sm:col-span-2">
                  <label className={adminLabel}>Facilities (one per line)
                    <textarea name="facilities" rows={5} defaultValue={v.facilities.join("\n")} className={adminInput} placeholder={"AC\nPush-back seats\nMusic system"} />
                  </label>
                  <p className="mt-1 text-xs text-slate-500">Only list facilities the vehicle really has.</p>
                </div>
                <div className="sm:col-span-2">
                  <PhotosField partnerId={partner.id} defaultPhotos={photoList(v)} />
                </div>
                <div className="sm:col-span-2"><SubmitButton>Save changes</SubmitButton></div>
              </ActionForm>
            </div>
          </details>
        </Card>
      ))}
    </div>
  );
}

/** Main photo first, then the rest, without duplicates. */
function photoList(v: Vehicle): string[] {
  return [...new Set([v.image_url, ...v.photos].filter((p): p is string => Boolean(p)))];
}
