import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "orbi",
    short_name: "orbi",
    description: "real plans with your mutuals. always 3 or more people.",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    background_color: "#0E0C0D",
    theme_color: "#0E0C0D",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
