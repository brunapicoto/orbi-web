"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useRef } from "react";
import { NYC, TILE_OPTIONS, TILE_URL, pinIcon } from "@/components/app/map/tiles";

/** A small map with one draggable pin. Tap the map or drag the pin to move it. */
export default function PinPicker({ lat, lng, onChange }: { lat: number | null; lng: number | null; onChange: (lat: number, lng: number) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const marker = useRef<L.Marker | null>(null);
  const change = useRef(onChange);
  change.current = onChange;

  useEffect(() => {
    if (!box.current || map.current) return;
    const m = L.map(box.current, { zoomControl: false, attributionControl: true, scrollWheelZoom: false }).setView(NYC, 12);
    L.tileLayer(TILE_URL, TILE_OPTIONS).addTo(m);
    L.control.zoom({ position: "bottomright" }).addTo(m);
    m.on("click", (e: L.LeafletMouseEvent) => change.current(e.latlng.lat, e.latlng.lng));
    map.current = m;
    return () => {
      m.remove();
      map.current = null;
      marker.current = null;
    };
  }, []);

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    if (lat === null || lng === null) {
      marker.current?.remove();
      marker.current = null;
      return;
    }
    if (!marker.current) {
      marker.current = L.marker([lat, lng], { draggable: true, icon: pinIcon("#C9D2FA", "#0E0C0D", true), keyboard: true, title: "plan location" }).addTo(m);
      marker.current.on("dragend", () => {
        const p = marker.current!.getLatLng();
        change.current(p.lat, p.lng);
      });
      m.setView([lat, lng], 15);
    } else {
      marker.current.setLatLng([lat, lng]);
      if (!m.getBounds().pad(-0.2).contains([lat, lng])) m.panTo([lat, lng]);
    }
  }, [lat, lng]);

  return <div ref={box} className="h-64 w-full overflow-hidden rounded-2xl border border-line bg-ink-2" role="application" aria-label="map: tap to place the pin" />;
}
