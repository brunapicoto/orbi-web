"use client";

import { startTransition, useActionState, useRef, useState } from "react";
import { uploadMemoryPhoto, uploadPhoto, type FormState } from "@/app/app/actions";

/** Shrinks the photo on the phone (long edge 1800px, jpeg) before it is sent. */
export async function shrink(file: File): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;
  const scale = Math.min(1, 1800 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85));
  return blob ? new File([blob], "photo.jpg", { type: "image/jpeg" }) : file;
}

export function PhotoUpload({ planId, memory = false }: { planId: string; memory?: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(memory ? uploadMemoryPhoto : uploadPhoto, {});
  const [busy, setBusy] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    const small = await shrink(file);
    const fd = new FormData();
    fd.set("planId", planId);
    fd.set("photo", small);
    setBusy(false);
    startTransition(() => action(fd));
    if (formRef.current) formRef.current.reset();
  };

  return (
    <form ref={formRef} className="flex flex-col gap-2" onSubmit={(e) => e.preventDefault()}>
      <label className="mono flex min-h-14 cursor-pointer items-center justify-center gap-3 rounded-full border border-dashed border-lavender/60 px-6 text-lavender transition-colors hover:border-lavender focus-within:ring-2 focus-within:ring-lavender">
        <input type="file" accept="image/*" className="sr-only" onChange={onPick} disabled={pending || busy} />
        {pending || busy ? "adding the photo…" : memory ? "add a photo" : "add the group photo"}
      </label>
      <p aria-live="polite" className="mono min-h-5 text-lavender">
        {state.error ?? (state.ok ? "added. only the people who were there can see it." : "")}
      </p>
    </form>
  );
}
