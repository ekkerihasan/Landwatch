"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import type { Project } from "@/lib/types";

// Leaflet's default marker icons resolve to bundler-relative URLs that Next rewrites,
// so they 404 silently and markers vanish. Point them at the CDN-free inline SVG below.
const pinIcon = (fill: string) =>
  L.divIcon({
    className: "",
    html: `<svg width="24" height="32" viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20c0-6.6-5.4-12-12-12z" fill="${fill}"/>
      <circle cx="12" cy="12" r="4.5" fill="#fff"/>
    </svg>`,
    iconSize: [24, 32],
    iconAnchor: [12, 32],
  });

const RISK_FILL: Record<string, string> = {
  Low: "#0d9488",
  Medium: "#d97706",
  High: "#ea580c",
  Critical: "#dc2626",
};

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(Number(e.latlng.lat.toFixed(4)), Number(e.latlng.lng.toFixed(4)));
    },
  });
  return null;
}

export default function SiteMap({
  picked,
  onPick,
  existing,
}: {
  picked: { lat: number; lng: number } | null;
  onPick: (lat: number, lng: number) => void;
  existing: Project[];
}) {
  return (
    <MapContainer
      center={[21.5, 78.5]}
      zoom={5}
      scrollWheelZoom
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onPick={onPick} />

      {/* Existing projects, coloured by their current risk */}
      {existing
        .filter((p) => p.latitude != null && p.longitude != null)
        .map((p) => (
          <Marker
            key={p.project_id}
            position={[p.latitude as number, p.longitude as number]}
            icon={pinIcon(RISK_FILL[p.prediction.risk_class] ?? "#64748b")}
            title={`${p.name} — ${p.prediction.risk_class}`}
          />
        ))}

      {picked && (
        <Marker position={[picked.lat, picked.lng]} icon={pinIcon("#0f172a")} title="Selected site" />
      )}
    </MapContainer>
  );
}
