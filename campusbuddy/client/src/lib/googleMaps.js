// Loads the Google Maps JavaScript API once. Only used when VITE_GOOGLE_MAPS_API_KEY is set.
export const GOOGLE_MAPS_KEY = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '').trim();
export const USE_GOOGLE_MAPS = Boolean(GOOGLE_MAPS_KEY);
export const GOOGLE_AUTH_FAILED = 'campusbuddy:google-auth-failed';

let loading;

export function loadGoogleMaps() {
  if (window.google?.maps?.importLibrary) return Promise.resolve(window.google.maps);
  if (loading) return loading;

  // Google calls this when the key is wrong, blocked, or billing is not switched on
  window.gm_authFailure = () => window.dispatchEvent(new Event(GOOGLE_AUTH_FAILED));

  loading = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_MAPS_KEY)}&v=weekly&loading=async&libraries=marker`;
    script.async = true;
    script.onload = () => resolve(window.google.maps);
    script.onerror = () => {
      loading = undefined;
      reject(new Error('Could not load Google Maps'));
    };
    document.head.appendChild(script);
  });
  return loading;
}
