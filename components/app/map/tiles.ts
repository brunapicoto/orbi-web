import L from "leaflet";

// CARTO's dark basemap on OpenStreetMap data: free, no key. Attribution is required.
export const TILE_URL = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
export const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';
export const NYC: [number, number] = [40.7357, -73.9772];

/** A drawn pin in a category colour. Plain markup, no images, so nothing breaks in the bundle. */
export function pinIcon(color: string, ink: string, selected = false) {
  const size = selected ? 40 : 32;
  return L.divIcon({
    className: "orbi-pin",
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    html: `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true"><path d="M12 23c-4.6-5.4-7.5-9-7.5-13a7.5 7.5 0 0 1 15 0c0 4-2.9 7.6-7.5 13z" fill="${color}" stroke="#0E0C0D" stroke-width="1.4"/><circle cx="12" cy="10" r="2.8" fill="${ink}"/></svg>`,
  });
}
