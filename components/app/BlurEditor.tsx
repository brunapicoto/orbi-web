"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { replaceMemoryPhoto } from "@/app/app/actions";
import type { Photo } from "@/lib/app/types";

type Spot = { x: number; y: number }; // 0..1 of the photo
const SIZES = [
  { id: "s", label: "small", r: 0.07 },
  { id: "m", label: "medium", r: 0.11 },
  { id: "l", label: "large", r: 0.16 },
] as const;

/**
 * Blur yourself in a memory's photos. You tap where you are; the phone covers those spots with a
 * heavy mosaic (harder to undo than a soft blur) and the copy replaces the original for everyone else.
 */
export function BlurEditor({ memoryId, photos, startAt = 0 }: { memoryId: string; photos: Photo[]; startAt?: number }) {
  const router = useRouter();
  const [i, setI] = useState(Math.min(startAt, Math.max(0, photos.length - 1)));
  const [spots, setSpots] = useState<Spot[]>([]);
  const [size, setSize] = useState<(typeof SIZES)[number]["id"]>("m");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);
  const photo = photos[i];
  const r = SIZES.find((s) => s.id === size)!.r;

  const next = () => {
    setSpots([]);
    setErr("");
    if (i + 1 < photos.length) setI(i + 1);
    else router.push(`/app/memories/${memoryId}`);
  };

  const tap = (e: React.MouseEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    setSpots((cur) => [...cur, { x: (e.clientX - box.left) / box.width, y: (e.clientY - box.top) / box.height }]);
  };

  const save = async () => {
    const img = imgRef.current;
    if (!img || !spots.length) return next();
    setBusy(true);
    setErr("");
    try {
      const blob = await mosaic(photo.url, spots, r);
      const fd = new FormData();
      fd.set("memoryId", memoryId);
      fd.set("photoId", photo.id);
      fd.set("photo", new File([blob], "blurred.jpg", { type: "image/jpeg" }));
      const res = await replaceMemoryPhoto(fd);
      if (res.error) return setErr(res.error);
      setDone((d) => d + 1);
      next();
      router.refresh();
    } catch {
      setErr("we couldn't edit this photo. try again.");
    } finally {
      setBusy(false);
    }
  };

  if (!photo) return null;
  return (
    <section aria-labelledby="blur-title" className="flex flex-col gap-4 rounded-3xl bg-ink-2 p-5 ring-1 ring-line ring-inset">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="blur-title" className="display text-[1.6rem] leading-tight">blur yourself</h2>
        <span className="mono text-[12px] text-muted-2">photo {i + 1} of {photos.length}</span>
      </div>
      <p className="text-[15px] text-muted">tap on your face (or anywhere you want hidden). everyone else will only see the blurred copy.</p>
      <div className="relative cursor-crosshair overflow-hidden rounded-2xl" onClick={tap} role="button" tabIndex={0} aria-label="tap where you are in the photo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img ref={imgRef} src={photo.url} alt="" crossOrigin="anonymous" className="block h-auto w-full select-none" draggable={false} />
        {spots.map((s, k) => (
          <span
            key={k}
            className="pointer-events-none absolute rounded-full border-2 border-lavender bg-ink/40 backdrop-blur-md"
            style={{ left: `${s.x * 100}%`, top: `${s.y * 100}%`, width: `${r * 200}%`, aspectRatio: "1", transform: "translate(-50%, -50%)" }}
          />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="blur size">
        {SIZES.map((s) => (
          <button key={s.id} type="button" aria-pressed={size === s.id} onClick={() => setSize(s.id)} className={`mono min-h-10 rounded-full border px-3 text-[12px] ${size === s.id ? "border-lavender bg-lavender text-ink" : "border-line text-bone"}`}>
            {s.label}
          </button>
        ))}
        {spots.length ? (
          <button type="button" onClick={() => setSpots((c) => c.slice(0, -1))} className="mono min-h-10 px-2 text-[12px] text-muted-2 hover:text-lavender">
            undo
          </button>
        ) : null}
      </div>
      {err ? <p role="alert" className="mono text-lavender">{err}</p> : null}
      <div className="flex flex-wrap gap-3">
        <button type="button" disabled={busy || !spots.length} onClick={save} className="mono min-h-12 rounded-full bg-bone px-6 text-[14px] text-ink hover:bg-lavender disabled:opacity-50">
          {busy ? "saving…" : "blur and save"}
        </button>
        <button type="button" disabled={busy} onClick={next} className="mono min-h-12 rounded-full border border-line px-6 text-[14px] text-bone hover:border-lavender">
          {i + 1 < photos.length ? "i'm not in this one" : "done"}
        </button>
      </div>
      {done ? <p className="mono text-[12px] text-lavender-soft" aria-live="polite">{done} blurred</p> : null}
    </section>
  );
}

/** Draws the photo (max 2000px) and covers each spot with big mosaic blocks. */
async function mosaic(url: string, spots: Spot[], r: number): Promise<Blob> {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = url;
  await img.decode();
  const scale = Math.min(1, 2000 / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth * scale);
  const h = Math.round(img.naturalHeight * scale);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h);
  const small = document.createElement("canvas");
  const sctx = small.getContext("2d")!;
  for (const s of spots) {
    const rad = r * w;
    const x0 = Math.max(0, Math.round(s.x * w - rad));
    const y0 = Math.max(0, Math.round(s.y * h - rad));
    const side = Math.round(rad * 2);
    const blocks = 7; // about 7 blocks across: nothing recognisable is left
    small.width = blocks;
    small.height = blocks;
    sctx.drawImage(c, x0, y0, side, side, 0, 0, blocks, blocks);
    ctx.save();
    ctx.beginPath();
    ctx.arc(s.x * w, s.y * h, rad, 0, Math.PI * 2);
    ctx.clip();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(small, 0, 0, blocks, blocks, x0, y0, side, side);
    ctx.restore();
  }
  return await new Promise<Blob>((ok, fail) => c.toBlob((b) => (b ? ok(b) : fail(new Error("no image"))), "image/jpeg", 0.88));
}
