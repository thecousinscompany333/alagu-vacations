import Image from "next/image";
import { Suspense } from "react";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import { addGalleryItem, deleteGalleryItem, toggleGalleryItem } from "@/actions/admin";
import { ActionForm, ConfirmSubmit, ImageUploader, SubmitButton, adminInput, adminLabel } from "@/components/admin/forms";
import { Card, LoadingBlock, PageTitle } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import type { GalleryItem } from "@/lib/types";

export default function GalleryAdminPage() {
  return (
    <>
      <PageTitle title="Gallery" text="Photos shown in the website gallery. Newest uploads appear first." />
      <Card className="mb-6">
        <h2 className="mb-4 font-semibold text-navy-900">Upload a photo</h2>
        <ActionForm action={addGalleryItem} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end" resetOnSuccess>
          <ImageUploader folder="gallery" label="Photo" />
          <div><label className={adminLabel}>Caption (optional)<input name="caption" maxLength={160} className={adminInput} /></label></div>
          <SubmitButton>Add to gallery</SubmitButton>
        </ActionForm>
      </Card>
      <Suspense fallback={<LoadingBlock />}><GalleryGrid /></Suspense>
    </>
  );
}

async function GalleryGrid() {
  const { supabase, role } = await requireAdmin();
  const canDelete = role === "super_admin";
  const { data } = await supabase.from("gallery_items").select("*").order("sort_order").order("created_at", { ascending: false });
  const items = (data ?? []) as GalleryItem[];
  if (items.length === 0) return <Card className="text-sm text-slate-600">No photos yet.</Card>;
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((g) => (
        <li key={g.id} className={`overflow-hidden rounded-xl border bg-white shadow-sm ${g.is_active ? "border-slate-200" : "border-dashed border-slate-300 opacity-60"}`}>
          <div className="relative aspect-square bg-slate-100">
            <Image src={g.image_url} alt={g.caption ?? ""} fill sizes="(min-width:1024px) 25vw, 50vw" className="object-cover" />
          </div>
          <div className="space-y-2 p-3">
            <p className="truncate text-sm">{g.caption || <span className="text-slate-400">No caption</span>}</p>
            <div className="flex items-center justify-between gap-2">
              <form action={toggleGalleryItem}>
                <input type="hidden" name="id" value={g.id} />
                <input type="hidden" name="is_active" value={String(g.is_active)} />
                <button type="submit" className="inline-flex items-center gap-1 text-xs font-medium text-navy-700 hover:underline">
                  {g.is_active ? <><EyeOff className="h-3.5 w-3.5" aria-hidden /> Hide</> : <><Eye className="h-3.5 w-3.5" aria-hidden /> Show</>}
                </button>
              </form>
              {canDelete ? (
                <form action={deleteGalleryItem}>
                  <input type="hidden" name="id" value={g.id} />
                  <ConfirmSubmit message="Delete?" className="inline-flex items-center gap-1 text-xs text-red-700 hover:underline">
                    <Trash2 className="h-3.5 w-3.5" aria-hidden /> Delete
                  </ConfirmSubmit>
                </form>
              ) : null}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
