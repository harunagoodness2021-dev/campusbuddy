// Walking directions from an OSRM-compatible service.
// Default: the public OpenStreetMap Germany foot router. It is free but has fair-use limits -
// for production, host your own OSRM or use a commercial routing API and set VITE_ROUTING_URL.
const ROUTING_URL =
  import.meta.env.VITE_ROUTING_URL || 'https://routing.openstreetmap.de/routed-foot/route/v1/foot';

const WALKING_METRES_PER_MINUTE = 80;

/** from / to are [lat, lng]. Resolves to { coords: [[lat, lng], ...], distance (m), minutes }. */
export async function fetchWalkingRoute(from, to) {
  const url = `${ROUTING_URL}/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;

  let res;
  try {
    res = await fetch(url);
  } catch {
    throw new Error('Could not reach the routing service. Check your connection.');
  }
  if (!res.ok) throw new Error('Could not calculate a route right now. Please try again.');

  const data = await res.json();
  const route = data.routes?.[0];
  if (data.code !== 'Ok' || !route) throw new Error('No walking route was found to that place.');

  return {
    coords: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
    distance: route.distance,
    minutes: Math.max(1, Math.round(route.distance / WALKING_METRES_PER_MINUTE)),
  };
}

/** Promise wrapper around the browser geolocation API. Resolves to [lat, lng]. */
export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve([pos.coords.latitude, pos.coords.longitude]),
      (err) => reject(new Error(err.message || 'Could not get your location.')),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  });
}
