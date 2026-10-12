import { useEffect, useRef, useState } from 'react';
import { GOOGLE_AUTH_FAILED, loadGoogleMaps } from '../../lib/googleMaps.js';
import { CAMPUS_CENTER, pinHtml } from './mapShared.jsx';

// Advanced markers need a map ID. "DEMO_MAP_ID" works for development; set VITE_GOOGLE_MAP_ID to use your own.
const MAP_ID = import.meta.env.VITE_GOOGLE_MAP_ID || 'DEMO_MAP_ID';
const ll = ([lat, lng]) => ({ lat, lng });

function makeController(map) {
  const g = window.google.maps;
  return {
    flyToBuilding(building) {
      const zoom = Math.max(map.getZoom() || 16, 17);
      const mobile = window.innerWidth < 768;
      const div = map.getDiv();
      const shift = mobile ? [0, div.clientHeight * 0.22] : [-190, 0]; // keep the pin clear of the details card
      let centre = { lat: building.lat, lng: building.lng };
      const proj = map.getProjection();
      if (proj) {
        const scale = 2 ** zoom;
        const p = proj.fromLatLngToPoint(new g.LatLng(building.lat, building.lng));
        const moved = proj.fromPointToLatLng(new g.Point(p.x + shift[0] / scale, p.y + shift[1] / scale));
        centre = { lat: moved.lat(), lng: moved.lng() };
      }
      map.setZoom(zoom);
      map.panTo(centre);
    },
    fitPoints(points, padding = 70, maxZoom) {
      const bounds = new g.LatLngBounds();
      points.forEach((p) => bounds.extend(ll(p)));
      map.fitBounds(bounds, padding);
      if (maxZoom) {
        g.event.addListenerOnce(map, 'idle', () => {
          if (map.getZoom() > maxZoom) map.setZoom(maxZoom);
        });
      }
    },
    flyTo(pos, zoom) {
      map.panTo(ll(pos));
      if (zoom) map.setZoom(zoom);
    },
    zoomIn: () => map.setZoom((map.getZoom() || 16) + 1),
    zoomOut: () => map.setZoom((map.getZoom() || 16) - 1),
  };
}

/** Google Maps version of the campus map. Same props as LeafletMap. onFail is called if Google cannot load. */
export default function GoogleMap({
  buildings = [],
  selectedId = null,
  onSelect,
  mapType = 'default',
  route = null,
  userPos = null,
  onReady,
  onFail,
  interactive = true,
  center = CAMPUS_CENTER,
  zoom = 16,
}) {
  const divRef = useRef(null);
  const mapRef = useRef(null);
  const libs = useRef({});
  const [ready, setReady] = useState(false);

  // Create the map once
  useEffect(() => {
    let cancelled = false;
    const fail = () => !cancelled && onFail?.();
    window.addEventListener(GOOGLE_AUTH_FAILED, fail);

    loadGoogleMaps()
      .then(async (g) => {
        const maps = await g.importLibrary('maps');
        const marker = await g.importLibrary('marker');
        if (cancelled) return;
        const map = new maps.Map(divRef.current, {
          center: ll(center),
          zoom,
          mapId: MAP_ID,
          disableDefaultUI: true,
          clickableIcons: false,
          gestureHandling: interactive ? 'greedy' : 'none',
          keyboardShortcuts: interactive,
        });
        mapRef.current = map;
        libs.current = { Polyline: maps.Polyline, Marker: marker.AdvancedMarkerElement };
        setReady(true);
        onReady?.(makeController(map));
      })
      .catch(fail);

    return () => {
      cancelled = true;
      window.removeEventListener(GOOGLE_AUTH_FAILED, fail);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (ready) mapRef.current.setMapTypeId(mapType === 'satellite' ? 'hybrid' : 'roadmap');
  }, [ready, mapType]);

  // Building pins (rebuilt when the list or the selection changes)
  useEffect(() => {
    if (!ready) return undefined;
    const { Marker } = libs.current;
    const pins = buildings.map((b) => {
      const el = document.createElement('div');
      el.innerHTML = pinHtml(b.category, b._id === selectedId);
      el.style.cursor = onSelect ? 'pointer' : 'default';
      el.style.transform = 'translateY(50%)'; // centre the round pin on its coordinates
      const pin = new Marker({
        map: mapRef.current,
        position: { lat: b.lat, lng: b.lng },
        content: el,
        title: b.name,
        zIndex: b._id === selectedId ? 1000 : 1,
      });
      if (onSelect) pin.addListener('click', () => onSelect(b));
      return pin;
    });
    return () => pins.forEach((p) => (p.map = null));
  }, [ready, buildings, selectedId, onSelect]);

  // Walking route line
  useEffect(() => {
    if (!ready || !route || route.length < 2) return undefined;
    const line = new libs.current.Polyline({
      map: mapRef.current,
      path: route.map(ll),
      strokeColor: '#2563eb',
      strokeWeight: 6,
      strokeOpacity: 0.9,
    });
    return () => line.setMap(null);
  }, [ready, route]);

  // "You are here" dot
  useEffect(() => {
    if (!ready || !userPos) return undefined;
    const dot = document.createElement('div');
    dot.style.cssText = 'width:18px;height:18px;border-radius:50%;background:#2563eb;border:3px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.2)';
    const marker = new libs.current.Marker({ map: mapRef.current, position: ll(userPos), content: dot, title: 'You are here' });
    return () => {
      marker.map = null;
    };
  }, [ready, userPos]);

  return <div ref={divRef} style={{ height: '100%', width: '100%' }} />;
}
