'use client';

/**
 * The street map for one city: every ride that starts and ends inside it, as
 * a pickup dot and a drop-off ring joined by a thin line. Points are published
 * at block precision, so a pin marks the block, not the door. Members only;
 * the caller never renders this for visitors.
 */
import { Fragment, useEffect, useMemo } from 'react';
import { AttributionControl, CircleMarker, MapContainer, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { MapItem } from '@/lib/map/data';

function Fit({ items, center }: { items: MapItem[]; center: [number, number] }) {
  const map = useMap();
  const key = items.map((i) => i.id).join();
  useEffect(() => {
    const pts = items.flatMap((i) => [i.fromPt, i.toPt]).filter(Boolean).map((p) => [p!.lat, p!.lng] as [number, number]);
    if (pts.length > 1) map.fitBounds(pts, { padding: [22, 22], maxZoom: 15 });
    else map.setView(pts[0] ?? center, 13);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key]);
  // the side panel slides open, so the container keeps changing size for a moment
  useEffect(() => {
    const el = map.getContainer();
    const ro = new ResizeObserver(() => map.invalidateSize({ pan: false }));
    ro.observe(el);
    return () => ro.disconnect();
  }, [map]);
  return null;
}

export function CityStreetMap({
  items,
  center,
  selectedId,
  onPick,
  height,
}: {
  items: MapItem[];
  center: [number, number];
  selectedId?: string;
  onPick: (i: MapItem) => void;
  height: number;
}) {
  // the selected ride is drawn last so it sits on top
  const ordered = useMemo(() => [...items].sort((a, b) => Number(a.id === selectedId) - Number(b.id === selectedId)), [items, selectedId]);
  return (
    <div style={{ height }} className="ondigo-map dm-streets relative overflow-hidden border border-line">
      <MapContainer center={center} zoom={13} scrollWheelZoom={false} zoomControl={false} attributionControl={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <AttributionControl prefix={false} />
        <Fit items={items} center={center} />
        {ordered.map((i) => {
          if (!i.fromPt || !i.toPt) return null;
          const sel = i.id === selectedId;
          const dim = !!selectedId && !sel;
          // colours come from map.css so the theme tokens apply
          const cls = `dm-sp ${i.kind === 'trip' ? 'trip' : 'req'}${sel ? ' sel' : ''}${dim ? ' dim' : ''}`;
          const click = { click: () => onPick(i) };
          return (
            // Leaflet reads className only when a layer is made, so a change of state remakes the layer
            <Fragment key={`${i.id} ${cls}`}>
              <Polyline
                positions={[[i.fromPt.lat, i.fromPt.lng], [i.toPt.lat, i.toPt.lng]]}
                pathOptions={{ className: `${cls} line`, weight: sel ? 3 : 1.6, dashArray: i.kind === 'trip' ? '5 5' : undefined }}
                eventHandlers={click}
              />
              <CircleMarker center={[i.fromPt.lat, i.fromPt.lng]} radius={sel ? 6.5 : 5} pathOptions={{ className: `${cls} pick`, weight: 1.5, fillOpacity: 1 }} eventHandlers={click}>
                <Tooltip direction="top" offset={[0, -6]}>Pickup: {i.fromText}</Tooltip>
              </CircleMarker>
              <CircleMarker center={[i.toPt.lat, i.toPt.lng]} radius={sel ? 6 : 4.5} pathOptions={{ className: `${cls} drop`, weight: 2, fillOpacity: 1 }} eventHandlers={click}>
                <Tooltip direction="top" offset={[0, -6]}>Drop-off: {i.toText}</Tooltip>
              </CircleMarker>
            </Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
}
