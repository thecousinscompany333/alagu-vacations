import Image from "next/image";
import { Suspense } from "react";
import { Trash2 } from "lucide-react";
import { deletePackage, savePackage } from "@/actions/admin";
import { ActionForm, ConfirmSubmit, ImageUploader, SubmitButton, adminInput, adminLabel } from "@/components/admin/forms";
import { Card, LoadingBlock, PageTitle } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import type { TravelPackage } from "@/lib/types";

export default function PackagesAdminPage() {
  return (
    <>
      <PageTitle
        title="Travel packages"
        text="Packages appear in the “Travel Packages” section, and their destinations in “Popular Destinations”. Until you add one, the site shows trip types instead."
      />
      <Suspense fallback={<LoadingBlock />}><PackagesList /></Suspense>
    </>
  );
}

async function PackagesList() {
  const { supabase, role } = await requireAdmin();
  const canDelete = role === "super_admin";
  const { data } = await supabase.from("packages").select("*").order("sort_order").order("created_at");
  const packages = (data ?? []) as TravelPackage[];
  return (
    <div className="space-y-4">
      {packages.length === 0 && <Card className="text-sm text-slate-600">No packages yet. Add your first package below.</Card>}
      {packages.map((p) => (
        <Card key={p.id}>
          <details>
            <summary className="flex cursor-pointer list-none items-center gap-4">
              <span className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                {p.image_url && <Image src={p.image_url} alt="" fill sizes="80px" className="object-cover" />}
              </span>
              <span className="flex-1">
                <span className="block font-semibold text-navy-900">{p.title}</span>
                <span className="text-sm text-slate-500">
                  {[p.destination, p.duration, p.price != null ? `₹${Number(p.price).toLocaleString("en-IN")}` : "Price on request"].filter(Boolean).join(" · ")}
                  {p.is_active ? "" : " · Hidden"}
                </span>
              </span>
              <span className="text-sm font-medium text-navy-700">Edit</span>
            </summary>
            <div className="mt-5 border-t border-slate-100 pt-5">
              <PackageForm pkg={p} />
              {canDelete ? (
                <form action={deletePackage} className="mt-4 border-t border-slate-100 pt-4">
                  <input type="hidden" name="id" value={p.id} />
                  <ConfirmSubmit message="Delete this package?" className="inline-flex items-center gap-1.5 text-sm text-red-700 hover:underline">
                    <Trash2 className="h-4 w-4" aria-hidden /> Delete package
                  </ConfirmSubmit>
                </form>
              ) : null}
            </div>
          </details>
        </Card>
      ))}
      <Card>
        <h2 className="mb-4 font-semibold text-navy-900">Add a package</h2>
        <PackageForm />
      </Card>
    </div>
  );
}

function PackageForm({ pkg }: { pkg?: TravelPackage }) {
  return (
    <ActionForm key={pkg ? JSON.stringify(pkg) : "new"} action={savePackage} className="grid gap-4 sm:grid-cols-2" resetOnSuccess={!pkg}>
      {pkg && <input type="hidden" name="id" value={pkg.id} />}
      <div className="sm:col-span-2"><label className={adminLabel}>Package title *<input name="title" required defaultValue={pkg?.title} className={adminInput} placeholder="e.g. Kodaikanal Weekend Getaway" /></label></div>
      <div><label className={adminLabel}>Destination<input name="destination" defaultValue={pkg?.destination ?? ""} className={adminInput} /></label></div>
      <div><label className={adminLabel}>Duration<input name="duration" defaultValue={pkg?.duration ?? ""} className={adminInput} placeholder="e.g. 2 days / 1 night" /></label></div>
      <div><label className={adminLabel}>Price from (₹, leave empty for “on request”)<input name="price" type="number" min={0} step="1" defaultValue={pkg?.price ?? ""} className={adminInput} /></label></div>
      <div><label className={adminLabel}>Price note<input name="price_note" defaultValue={pkg?.price_note ?? ""} className={adminInput} placeholder="e.g. per vehicle, excluding tolls" /></label></div>
      <div className="sm:col-span-2"><label className={adminLabel}>Highlights (one per line)<textarea name="highlights" rows={4} defaultValue={pkg?.highlights.join("\n")} className={adminInput} /></label></div>
      <div className="sm:col-span-2"><ImageUploader folder="packages" defaultUrl={pkg?.image_url ?? ""} label="Package photo" /></div>
      <div><label className={adminLabel}>Display order<input name="sort_order" type="number" min={0} defaultValue={pkg?.sort_order ?? 0} className={adminInput} /></label></div>
      <label className="flex items-center gap-2 self-end pb-2 text-sm"><input type="checkbox" name="is_active" defaultChecked={pkg?.is_active ?? true} /> Show on website</label>
      <div className="sm:col-span-2"><SubmitButton>{pkg ? "Save changes" : "Add package"}</SubmitButton></div>
    </ActionForm>
  );
}
