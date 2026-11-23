"use client";

import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import Image from "next/image";
import { CircleCheck, ImagePlus, Loader2, TriangleAlert, X } from "lucide-react";
import type { ActionResult } from "@/actions/admin";
import { createBrowserSupabase } from "@/lib/supabase/browser";

export const adminInput =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-ink focus:border-navy-700 focus:outline-none focus:ring-2 focus:ring-navy-100";
export const adminLabel = "mb-1 block text-sm font-medium text-slate-700";

export function SubmitButton({
  children,
  className = "",
  disabled = false,
}: {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-lg bg-navy-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-700 disabled:opacity-60 ${className}`}
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} {children}
    </button>
  );
}

export function ConfirmSubmit({ children, message, className = "" }: { children: React.ReactNode; message: string; className?: string }) {
  // Two-step confirm without browser dialogs (dialogs block automation and are unfriendly on mobile).
  const [armed, setArmed] = useState(false);
  const { pending } = useFormStatus();
  if (!armed) {
    return (
      <button type="button" onClick={() => setArmed(true)} className={className}>
        {children}
      </button>
    );
  }
  return (
    <span className="inline-flex items-center gap-2">
      <span className="text-xs text-red-700">{message}</span>
      <button type="submit" disabled={pending} className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-700">
        {pending ? "…" : "Yes"}
      </button>
      <button type="button" onClick={() => setArmed(false)} className="rounded-md border px-2.5 py-1 text-xs">No</button>
    </span>
  );
}

type FormState = { result: ActionResult; successes: number };

/** Form bound to a Server Action that returns ActionResult; shows a status message. */
export function ActionForm({
  action,
  children,
  className = "",
  resetOnSuccess = false,
}: {
  action: (prev: ActionResult, fd: FormData) => Promise<ActionResult>;
  children: React.ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
}) {
  // Counts successful saves; "add new" forms are keyed on it so every field
  // (including image uploaders) starts empty after a save.
  const [formState, formAction] = useActionState<FormState, FormData>(
    async (prev, fd) => {
      const result = await action(prev.result, fd);
      return { result, successes: prev.successes + (result?.ok ? 1 : 0) };
    },
    { result: null, successes: 0 },
  );
  const state = formState.result;
  return (
    <form key={resetOnSuccess ? formState.successes : undefined} action={formAction} className={className}>
      {children}
      {state && (
        <p
          role={state.ok ? "status" : "alert"}
          className={`mt-3 flex items-center gap-2 text-sm ${state.ok ? "text-emerald-700" : "text-red-700"}`}
        >
          {state.ok ? <CircleCheck className="h-4 w-4" aria-hidden /> : <TriangleAlert className="h-4 w-4" aria-hidden />}
          {state.message}
        </p>
      )}
    </form>
  );
}

/**
 * Uploads directly from the browser to the public "media" bucket (RLS: admins only),
 * then exposes the public URL via hidden inputs named `image_url` and `storage_path`.
 */
export function ImageUploader({ folder, defaultUrl = "", label = "Image" }: { folder: string; defaultUrl?: string; label?: string }) {
  const [url, setUrl] = useState(defaultUrl);
  const [path, setPath] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return setError("Use a JPG, PNG or WebP image.");
    if (file.size > 5 * 1024 * 1024) return setError("Image must be under 5 MB.");
    setBusy(true);
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const objectPath = `${folder}/${crypto.randomUUID()}.${ext}`;
    const supabase = createBrowserSupabase();
    const { error: upErr } = await supabase.storage.from("media").upload(objectPath, file, { contentType: file.type, cacheControl: "31536000" });
    setBusy(false);
    if (upErr) return setError("Upload failed. Check you are signed in as an admin.");
    const { data } = supabase.storage.from("media").getPublicUrl(objectPath);
    setUrl(data.publicUrl);
    setPath(objectPath);
  }

  return (
    <div>
      <span className={adminLabel}>{label}</span>
      <div className="flex items-start gap-3">
        <div className="relative flex h-24 w-32 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50">
          {url ? (
            <>
              <Image src={url} alt="" fill sizes="128px" className="object-cover" />
              <button type="button" onClick={() => { setUrl(""); setPath(""); }} className="absolute right-1 top-1 rounded-full bg-white/90 p-0.5" aria-label="Remove image">
                <X className="h-3.5 w-3.5" />
              </button>
            </>
          ) : busy ? <Loader2 className="h-5 w-5 animate-spin text-slate-400" /> : <ImagePlus className="h-6 w-6 text-slate-400" aria-hidden />}
        </div>
        <div className="text-sm">
          <button type="button" onClick={() => inputRef.current?.click()} disabled={busy} className="rounded-lg border border-slate-300 px-3 py-2 font-medium hover:bg-slate-50">
            {busy ? "Uploading…" : url ? "Replace image" : "Upload image"}
          </button>
          <p className="mt-1.5 text-xs text-slate-500">JPG, PNG or WebP, up to 5 MB.</p>
          {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
      <input type="hidden" name="image_url" value={url} />
      <input type="hidden" name="storage_path" value={path} />
    </div>
  );
}
