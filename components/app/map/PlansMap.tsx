"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useRef } from "react";
import { NYC, TILE_OPTIONS, TILE_URL, pinIcon } from "@/components/app/map/tiles";
import { categoryOf } from "@/lib/app/categories";

export type MapPlan = { id: string; lat: number; lng: number; kind: string; label: string };
export type Bounds = { south: number; west: number; north: number; east: number };

/** The plans map: one pin per plan, coloured by category. Reports the visible area as it moves. */
export default function PlansMap({ plans, selected, onSelect, onMove, fitKey }: {
  plans: MapPlan[];
  selected: string | null;
  onSelect: (id: string | null) => void;
  onMove: (b: Bounds) => void;
  /** change it to fit the map to the pins again (e.g. after filters change) */
  fitKey: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const cb = useRef({ onSelect, onMove });
  cb.current = { onSelect, onMove };

  useEffect(() => {
    if (!box.current || map.current) return;
    const m = L.map(box.current, { zoomControl: false }).setView(NYC, 12);
    L.tileLayer(TILE_URL, TILE_OPTIONS).addTo(m);
    L.control.zoom({ position: "topright" }).addTo(m);
    layer.current = L.layerGroup().addTo(m);
    const report = () => {
      const b = m.getBounds();
      cb.current.onMove({ south: b.getSouth(), west: b.getWest(), north: b.getNorth(), east: b.getEast() });
    };
    m.on("moveend", report);
    m.on("click", () => cb.current.onSelect(null));
    map.current = m;
    // the container can change size (sheet, rotation): keep tiles filled
    const ro = new ResizeObserver(() => m.invalidateSize());
    ro.observe(box.current);
    report();
    return () => {
      ro.disconnect();
      m.remove();
      map.current = null;
    };
  }, []);

  // pins
  useEffect(() => {
    const g = layer.current;
    if (!g) return;
    g.clearLayers();
    for (const p of plans) {
      const c = categoryOf(p.kind);
      const mk = L.marker([p.lat, p.lng], { icon: pinIcon(c.color, c.ink, p.id === selected), title: p.label, keyboard: true, riseOnHover: true, zIndexOffset: p.id === selected ? 1000 : 0 });
      mk.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        cb.current.onSelect(p.id);
      });
      mk.on("keypress", (e) => {
        const key = (e as unknown as { originalEvent: KeyboardEvent }).originalEvent.key;
        if (key === "Enter" || key === " ") cb.current.onSelect(p.id);
      });
      g.addLayer(mk);
    }
  }, [plans, selected]);

  // fit to the pins when the filters change
  useEffect(() => {
    const m = map.current;
    if (!m || !plans.length) return;
    const b = L.latLngBounds(plans.map((p) => [p.lat, p.lng] as [number, number]));
    m.fitBounds(b.pad(0.25), { maxZoom: 14, animate: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey]);

  return <div ref={box} className="h-full w-full bg-ink-2" role="region" aria-label="map of plans" />;
}
