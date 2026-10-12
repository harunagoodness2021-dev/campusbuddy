import { useCallback } from 'react';
import L from 'leaflet';
import { CircleMarker, MapContainer, Marker, Polyline, TileLayer } from 'react-leaflet';
import { CAMPUS_CENTER, pinHtml } from './mapShared.jsx';

export const TILE_LAYERS = {
  default: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  // OpenStreetMap does not publish satellite imagery, so this uses Esri World Imagery (free for light use).
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
    maxZoom: 19,
  },
};

const iconCache = new Map();

function pinIcon(category, selected) {
  const key = `${category}:${selected}`;
  if (!iconCache.has(key)) {
    iconCache.set(
      key,
      L.divIcon({
        className: 'cb-pin-wrap',
        html: pinHtml(category, selected),
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      })
    );
  }
  return iconCache.get(key);
}

/** The small set of map actions MapPage needs, so it works the same with Leaflet or Google Maps. */
function makeController(map) {
  return {
    flyToBuilding(building) {
      const zoom = Math.max(map.getZoom(), 17);
      const mobile = window.innerWidth < 768;
      const shift = mobile ? [0, map.getSize().y * 0.22] : [-190, 0];
      const centre = map.unproject(map.project([building.lat, building.lng], zoom).add(shift), zoom);
      map.flyTo(centre, zoom, { duration: 0.6 });
    },
    fitPoints(points, padding = 70, maxZoom) {
      map.fitBounds(L.latLngBounds(points), { padding: [padding, padding], maxZoom });
    },
    flyTo: (pos, zoom) => map.flyTo(pos, zoom),
    zoomIn: () => map.zoomIn(),
    zoomOut: () => map.zoomOut(),
  };
}

/**
 * Leaflet map showing campus buildings on OpenStreetMap (or satellite) tiles.
 * `onReady` receives a small controller (flyToBuilding, fitPoints, flyTo, zoomIn, zoomOut).
 */
export default function LeafletMap({
  buildings = [],
  selectedId = null,
  onSelect,
  mapType = 'default',
  route = null,
  userPos = null,
  onReady,
  interactive = true,
  center = CAMPUS_CENTER,
  zoom = 16,
}) {
  const setRef = useCallback(
    (map) => {
      if (map) onReady?.(makeController(map));
    },
    [onReady]
  );

  return (
    <MapContainer
      ref={setRef}
      center={center}
      zoom={zoom}
      zoomControl={false}
      scrollWheelZoom={interactive}
      dragging={interactive}
      doubleClickZoom={interactive}
      touchZoom={interactive}
      keyboard={interactive}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer key={mapType} {...TILE_LAYERS[mapType]} />

      {route && route.length > 1 && (
        <Polyline positions={route} pathOptions={{ color: '#2563eb', weight: 6, opacity: 0.9, lineCap: 'round' }} />
      )}

      {buildings.map((b) => (
        <Marker
          key={b._id}
          position={[b.lat, b.lng]}
          icon={pinIcon(b.category, b._id === selectedId)}
          zIndexOffset={b._id === selectedId ? 1000 : 0}
          title={b.name}
          eventHandlers={onSelect ? { click: () => onSelect(b) } : undefined}
        />
      ))}

      {userPos && (
        <CircleMarker
          center={userPos}
          radius={9}
          pathOptions={{ color: '#ffffff', weight: 3, fillColor: '#2563eb', fillOpacity: 1 }}
        />
      )}
    </MapContainer>
  );
}
