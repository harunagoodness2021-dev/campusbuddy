import { useState } from 'react';
import LeafletMap from './LeafletMap.jsx';
import GoogleMap from './GoogleMap.jsx';
import { USE_GOOGLE_MAPS } from '../../lib/googleMaps.js';

export { CAMPUS_CENTER } from './mapShared.jsx';

/**
 * The campus map. Uses Google Maps when VITE_GOOGLE_MAPS_API_KEY is set, otherwise OpenStreetMap.
 * If Google refuses to load (wrong key, billing off...) it quietly falls back to OpenStreetMap so the page is never blank.
 */
export default function CampusMap(props) {
  const [googleFailed, setGoogleFailed] = useState(false);

  if (USE_GOOGLE_MAPS && !googleFailed) {
    return (
      <GoogleMap
        {...props}
        onFail={() => {
          console.warn('Google Maps could not load (check your key and that billing is enabled). Using OpenStreetMap instead.');
          setGoogleFailed(true);
        }}
      />
    );
  }
  return <LeafletMap {...props} />;
}
