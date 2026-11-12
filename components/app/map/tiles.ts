import L from "leaflet";

// Map tiles. Default: OpenStreetMap's own tiles (no key), darkened with a CSS filter to match the app.
// To use another provider later (e.g. a dark style with a key), set NEXT_PUBLIC_MAP_TILE_URL and
// NEXT_PUBLIC_MAP_ATTRIBUTION; those are drawn as they are, with no filter.
const CUSTOM = process.env.NEXT_PUBLIC_MAP_TILE_URL;
export const TILE_URL = CUSTOM || "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
export const TILE_ATTRIBUTION = CUSTOM
  ? process.env.NEXT_PUBLIC_MAP_ATTRIBUTION || ""
  : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
/** options for every tile layer: the dark filter only applies to the default tiles */
export const TILE_OPTIONS = { attribution: TILE_ATTRIBUTION, maxZoom: 19, className: CUSTOM ? "" : "orbi-tiles-dark" };
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
