import { ImageResponse } from "next/og";

export const alt = "orbi, from mutuals to real connections";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Inter Tight 500 as a TTF for the image renderer. Falls back to the default font if offline.
async function loadInterTight(): Promise<ArrayBuffer | null> {
  try {
    const css = await (
      await fetch("https://fonts.googleapis.com/css2?family=Inter+Tight:wght@500&text=orbifmutalsoecn.")
    ).text();
    const url = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
    if (!url) return null;
    return await (await fetch(url)).arrayBuffer();
  } catch {
    return null;
  }
}

export default async function OpengraphImage() {
  const font = await loadInterTight();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#7A1428",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 80px",
          fontFamily: font ? "Inter Tight" : "sans-serif",
        }}
      >
        <svg width="72" height="72" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="19" fill="#F4F1F1" />
          <circle cx="60" cy="29" r="8" fill="#F4F1F1" />
          <circle cx="86.8" cy="75.5" r="8" fill="#F4F1F1" />
          <circle cx="33.2" cy="75.5" r="8" fill="#F4F1F1" />
        </svg>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 300, color: "#8FA3F5", letterSpacing: "-0.06em", lineHeight: 0.8 }}>orbi</div>
          <div style={{ fontSize: 44, color: "#F4F1F1", letterSpacing: "-0.03em", marginTop: 36 }}>
            from mutuals to real connections.
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: font ? [{ name: "Inter Tight", data: font, weight: 500, style: "normal" }] : undefined,
    },
  );
}
