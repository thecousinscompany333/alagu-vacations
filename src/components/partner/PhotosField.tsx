"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, Star, X } from "lucide-react";
import { adminLabel } from "@/components/admin/forms";
import { createBrowserSupabase } from "@/lib/supabase/browser";

const MAX_PHOTOS = 20;

/**
 * Photo list for a partner's vehicle. Uploads go straight from the browser into the partner's
 * own storage folder (media/partners/<partner id>/, enforced by a storage policy).
 * The first photo is the main one. Posts hidden `image_url` and repeated `photos` fields.
 */
export function PhotosField({ partnerId, defaultPhotos }: { partnerId: string; defaultPhotos: string[] }) {
  const [photos, setPhotos] = useState(defaultPhotos);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    const list = Array.from(files).slice(0, MAX_PHOTOS - photos.length);
    if (!list.length) return setError(`Up to ${MAX_PHOTOS} photos.`);
    setBusy(true);
    const supabase = createBrowserSupabase();
    const added: string[] = [];
    for (const file of list) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        setError("Use JPG, PNG or WebP images.");
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("Each image must be under 5 MB.");
        continue;
      }
      const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const path = `partners/${partnerId}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("media")
        .upload(path, file, { contentType: file.type, cacheControl: "31536000" });
      if (upErr) {
        setError("Upload failed. Please sign in again and retry.");
        continue;
      }
      added.push(supabase.storage.from("media").getPublicUrl(path).data.publicUrl);
    }
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
    if (added.length) setPhotos((p) => [...p, ...added]);
  }

  return (
    <div>
      <span className={adminLabel}>Photos</span>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {photos.map((url, i) => (
          <li key={url} className="relative aspect-[4/3] overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
            <Image src={url} alt="" fill sizes="200px" className="object-cover" />
            {i === 0 ? (
              <span className="absolute left-1 top-1 rounded-full bg-navy-800 px-2 py-0.5 text-[10px] font-semibold text-white">Main</span>
            ) : (
              <button type="button" onClick={() => setPhotos((p) => [url, ...p.filter((x) => x !== url)])}
                className="absolute left-1 top-1 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-navy-800">
                <Star className="h-3 w-3" aria-hidden /> Make main
              </button>
            )}
            <button type="button" onClick={() => setPhotos((p) => p.filter((x) => x !== url))}
              className="absolute right-1 top-1 rounded-full bg-white/90 p-0.5" aria-label="Remove photo">
              <X className="h-3.5 w-3.5" />
            </button>
            <input type="hidden" name="photos" value={url} />
          </li>
        ))}
        {photos.length < MAX_PHOTOS && (
          <li>
            <button type="button" onClick={() => inputRef.current?.click()} disabled={busy}
              className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 bg-slate-50 text-xs font-medium text-slate-600 hover:bg-slate-100">
              {busy ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <ImagePlus className="h-5 w-5" aria-hidden />}
              {busy ? "Uploading…" : "Add photos"}
            </button>
          </li>
        )}
      </ul>
      <p className="mt-1.5 text-xs text-slate-500">JPG, PNG or WebP, up to 5 MB each. The first photo is shown on the website card.</p>
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
      <input ref={inputRef} type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => onFiles(e.target.files)} />
      <input type="hidden" name="image_url" value={photos[0] ?? ""} />
    </div>
  );
}
