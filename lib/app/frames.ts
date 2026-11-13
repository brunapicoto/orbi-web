/**
 * Takes stills from a video file in the browser: no upload of the video itself, no server tools.
 * Evenly spaced across the clip, shrunk to 640px on the long side, as JPEG data URLs.
 */
export async function videoFrames(file: File, count = 8): Promise<string[]> {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.src = url;
  try {
    await new Promise<void>((ok, fail) => {
      video.onloadedmetadata = () => ok();
      video.onerror = () => fail(new Error("can't read this video"));
      setTimeout(() => fail(new Error("can't read this video")), 15000);
    });
    const dur = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 10;
    const scale = Math.min(1, 640 / Math.max(video.videoWidth || 640, video.videoHeight || 640));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round((video.videoWidth || 360) * scale);
    canvas.height = Math.round((video.videoHeight || 640) * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return [];
    const out: string[] = [];
    for (let i = 0; i < count; i++) {
      const t = Math.min(dur - 0.05, 0.3 + ((dur - 0.3) * i) / Math.max(1, count - 1));
      await new Promise<void>((ok) => {
        const done = () => ok();
        video.onseeked = done;
        setTimeout(done, 3000);
        video.currentTime = Math.max(0, t);
      });
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      out.push(canvas.toDataURL("image/jpeg", 0.7));
    }
    return out;
  } finally {
    URL.revokeObjectURL(url);
  }
}
