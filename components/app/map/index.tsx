"use client";

import dynamic from "next/dynamic";

const loading = () => <div className="h-64 w-full animate-pulse rounded-2xl border border-line bg-ink-2" />;

// Leaflet touches window, so maps only render in the browser.
export const PinPicker = dynamic(() => import("@/components/app/map/PinPicker"), { ssr: false, loading });
export const PlansMap = dynamic(() => import("@/components/app/map/PlansMap"), { ssr: false, loading: () => <div className="h-full w-full bg-ink-2" /> });
export const MiniMap = dynamic(() => import("@/components/app/map/MiniMap"), { ssr: false, loading: () => <div className="h-44 w-full rounded-2xl border border-line bg-ink-2" /> });
