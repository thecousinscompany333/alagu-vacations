import Image from "next/image";
import { Suspense } from "react";
import { Trash2 } from "lucide-react";
import { deleteVehicle, saveVehicle } from "@/actions/admin";
import { ActionForm, ConfirmSubmit, ImageUploader, SubmitButton, adminInput, adminLabel } from "@/components/admin/forms";
import { Card, LoadingBlock, PageTitle } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import type { Vehicle } from "@/lib/types";

export default function VehiclesAdminPage() {
  return (
    <>
      <PageTitle title="Vehicles" text="Shown in the “Our Vehicles” section. Only list facilities you can confirm." />
      <Suspense fallback={<LoadingBlock />}><VehiclesList /></Suspense>
    </>
  );
}

async function VehiclesList() {
  const { supabase, role } = await requireAdmin();
  const canDelete = role === "super_admin";
  const { data } = await supabase.from("vehicles").select("*").order("sort_order").order("created_at");
  const vehicles = (data ?? []) as Vehicle[];
  return (
    <div className="space-y-4">
      {vehicles.map((v) => (
        <Card key={v.id}>
          <details>
            <summary className="flex cursor-pointer list-none items-center gap-4">
              <span className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                {v.image_url && <Image src={v.image_url} alt="" fill sizes="80px" className="object-cover" />}
              </span>
              <span className="flex-1">
                <span className="block font-semibold text-navy-900">{v.name}</span>
                <span className="text-sm text-slate-500">{v.seats ? `${v.seats} seats · ` : ""}{v.is_active ? "Visible" : "Hidden"}</span>
              </span>
              <span className="text-sm font-medium text-navy-700">Edit</span>
            </summary>
            <div className="mt-5 border-t border-slate-100 pt-5">
              <VehicleForm vehicle={v} />
              {canDelete ? (
                <form action={deleteVehicle} className="mt-4 border-t border-slate-100 pt-4">
                  <input type="hidden" name="id" value={v.id} />
                  <ConfirmSubmit message="Delete this vehicle?" className="inline-flex items-center gap-1.5 text-sm text-red-700 hover:underline">
                    <Trash2 className="h-4 w-4" aria-hidden /> Delete vehicle
                  </ConfirmSubmit>
                </form>
              ) : null}
            </div>
          </details>
        </Card>
      ))}
      <Card>
        <h2 className="mb-4 font-semibold text-navy-900">Add a vehicle</h2>
        <VehicleForm />
      </Card>
    </div>
  );
}

function VehicleForm({ vehicle }: { vehicle?: Vehicle }) {
  return (
    <ActionForm key={vehicle ? JSON.stringify(vehicle) : "new"} action={saveVehicle} className="grid gap-4 sm:grid-cols-2" resetOnSuccess={!vehicle}>
      {vehicle && <input type="hidden" name="id" value={vehicle.id} />}
      <div><label className={adminLabel}>Name *<input name="name" required defaultValue={vehicle?.name} className={adminInput} placeholder="e.g. Force Urbania – 16 Seater" /></label></div>
      <div><label className={adminLabel}>Model<input name="model" defaultValue={vehicle?.model ?? ""} className={adminInput} /></label></div>
      <div><label className={adminLabel}>Seats<input name="seats" type="number" min={1} max={80} defaultValue={vehicle?.seats ?? ""} className={adminInput} /></label></div>
      <div><label className={adminLabel}>Display order<input name="sort_order" type="number" min={0} defaultValue={vehicle?.sort_order ?? 0} className={adminInput} /></label></div>
      <div className="sm:col-span-2"><label className={adminLabel}>Description<textarea name="description" rows={2} defaultValue={vehicle?.description ?? ""} className={adminInput} /></label></div>
      <div><label className={adminLabel}>Facilities (one per line)<textarea name="facilities" rows={5} defaultValue={vehicle?.facilities.join("\n")} className={adminInput} /></label></div>
      <div><label className={adminLabel}>Suitable trip types (one per line)<textarea name="trip_types" rows={5} defaultValue={vehicle?.trip_types.join("\n")} className={adminInput} /></label></div>
      <div className="sm:col-span-2"><ImageUploader folder="vehicles" defaultUrl={vehicle?.image_url ?? ""} label="Main photo" /></div>
      <div className="sm:col-span-2"><label className={adminLabel}>More photo URLs (one per line, optional)<textarea name="photos" rows={3} defaultValue={vehicle?.photos.filter((p) => p !== vehicle.image_url).join("\n")} className={adminInput} /></label></div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_active" defaultChecked={vehicle?.is_active ?? true} /> Show on website</label>
      <div className="sm:col-span-2"><SubmitButton>{vehicle ? "Save changes" : "Add vehicle"}</SubmitButton></div>
    </ActionForm>
  );
}
