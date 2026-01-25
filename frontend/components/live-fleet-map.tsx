"use client";

import { useEffect, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  ZoomControl,
} from "react-leaflet";
import L, { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

export interface LiveParcel {
  id: number;
  tracking_no: string;
  address: string | null;
  driver_id: number | null;
  driver_name?: string | null;
  status: string;
  latitude?: number | null;
  longitude?: number | null;
}

interface LiveFleetMapProps {
  parcels: LiveParcel[];
  satellite?: boolean;
}

// Default icon fixes broken marker icons in Next.js builds
const defaultIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

export default function LiveFleetMap({ parcels, satellite = false }: LiveFleetMapProps) {
  // Inject Leaflet CSS only once (for safety on older Next versions)
  useEffect(() => {
    if (document && !document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
  }, []);

  const markers = useMemo(() => parcels.filter(p => p.latitude != null && p.longitude != null), [parcels]);

  const center: LatLngExpression = useMemo(() => {
    if (markers.length > 0) {
      return [markers[0].latitude as number, markers[0].longitude as number];
    }
    // Paris fallback
    return [48.8566, 2.3522];
  }, [markers]);

  const tileUrl = satellite
    ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  const tileAttribution = satellite
    ? "Tiles © Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
    : "&copy; <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors";

  return (
    <div className="relative h-80 w-full overflow-hidden rounded-xl border border-neutral-200">
      <MapContainer
        center={center}
        zoom={markers.length ? 11 : 5}
        zoomControl={false}
        style={{ height: "100%", width: "100%" }}
        key={satellite ? "sat" : "std"}
      >
        <TileLayer url={tileUrl} attribution={tileAttribution} />
        <ZoomControl position="bottomright" />
        {markers.length === 0 ? (
          <></>
        ) : (
          markers.map((p) => (
            <Marker key={p.id} position={[p.latitude as number, p.longitude as number]}>
              <Popup>
                <div className="text-sm space-y-1">
                  <p className="font-semibold">{p.tracking_no}</p>
                  {p.address && <p className="text-neutral-600 text-xs">{p.address}</p>}
                  <p className="text-xs text-neutral-500">Status: {p.status}</p>
                  {p.driver_name && <p className="text-xs text-neutral-500">Driver: {p.driver_name}</p>}
                </div>
              </Popup>
            </Marker>
          ))
        )}
      </MapContainer>

      {markers.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white/80 backdrop-blur px-4 py-3 rounded-lg text-sm text-neutral-700 border border-neutral-200">
            Aucun colis géolocalisé pour le moment.
          </div>
        </div>
      )}
    </div>
  );
}
