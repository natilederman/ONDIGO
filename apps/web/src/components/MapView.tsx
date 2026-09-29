'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface MapMarker {
  lat: number;
  lng: number;
  label: string;
  color?: string;
}

function FitBounds({ markers }: { markers: MapMarker[] }) {
  const map = useMap();
  useEffect(() => {
    if (markers.length < 2) return;
    map.fitBounds(
      markers.map((m) => [m.lat, m.lng]),
      { padding: [32, 32] }
    );
  }, [map, markers]);
  return null;
}

function dotIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,0.25)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

export function MapView({
  markers,
  polyline,
  height = 320,
}: {
  markers: MapMarker[];
  polyline?: [number, number][];
  height?: number;
}) {
  if (markers.length === 0) return null;
  const center: [number, number] = [markers[0].lat, markers[0].lng];

  return (
    <div style={{ height }} className="ondigo-map relative overflow-hidden">
      <MapContainer
        center={center}
        zoom={6}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds markers={markers} />
        {polyline && <Polyline positions={polyline} pathOptions={{ color: '#0A0B0D', weight: 2 }} />}
        {markers.map((m, i) => (
          <Marker key={i} position={[m.lat, m.lng]} icon={dotIcon(m.color ?? '#0A0B0D')}>
            <Popup>{m.label}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
