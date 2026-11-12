"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useRef } from "react";
import { TILE_OPTIONS, TILE_URL, pinIcon } from "@/components/app/map/tiles";
import { categoryOf } from "@/lib/app/categories";

/** A still map with one pin, for a plan page. */
export default function MiniMap({ lat, lng, kind, label }: { lat: number; lng: number; kind: string; label: string }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!box.current) return;
    const c = categoryOf(kind);
    const m = L.map(box.current, { zoomControl: false, dragging: false, scrollWheelZoom: false, doubleClickZoom: false, touchZoom: false, boxZoom: false, keyboard: false }).setView([lat, lng], 15);
    L.tileLayer(TILE_URL, TILE_OPTIONS).addTo(m);
    L.marker([lat, lng], { icon: pinIcon(c.color, c.ink, true), interactive: false }).addTo(m);
    return () => {
      m.remove();
    };
  }, [lat, lng, kind]);
  return <div ref={box} className="h-44 w-full overflow-hidden rounded-2xl border border-line bg-ink-2" role="img" aria-label={`map showing ${label}`} />;
}
