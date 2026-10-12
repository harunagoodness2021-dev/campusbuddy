import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, Crosshair, Footprints, Home, Layers, Loader2, Minus, Plus, Search, X } from 'lucide-react';
import CampusMap, { CAMPUS_CENTER } from '../components/map/CampusMap.jsx';
import BuildingSheet from '../components/map/BuildingSheet.jsx';
import { ErrorNote } from '../components/Spinner.jsx';
import { api } from '../lib/api.js';
import { CATEGORY_META, CATEGORY_ORDER } from '../lib/categories.js';
import { cn, formatDistance, haversine } from '../lib/format.js';
import { fetchWalkingRoute, getCurrentPosition } from '../lib/routing.js';

const BOOKMARK_KEY = 'campusbuddy_bookmarks';
const FAR_FROM_CAMPUS_M = 15000;

function loadBookmarks() {
  try {
    return JSON.parse(localStorage.getItem(BOOKMARK_KEY) || '[]');
  } catch {
    return [];
  }
}

function MapButton({ label, onClick, active, children }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={cn(
        'flex size-10 items-center justify-center rounded-xl border border-line bg-paper shadow-lg transition hover:bg-white',
        active && '!border-brand text-brand'
      )}
    >
      {children}
    </button>
  );
}

export default function MapPage() {
  const [params] = useSearchParams();
  const focusId = params.get('focus');
  const urlQuery = params.get('q') || '';

  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [map, setMap] = useState(null);

  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState(urlQuery);
  const [mapType, setMapType] = useState('default');
  const [panelOpen, setPanelOpen] = useState(false);

  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState('');
  const [route, setRoute] = useState(null);
  const [userPos, setUserPos] = useState(null);
  const [toast, setToast] = useState('');
  const [bookmarks, setBookmarks] = useState(loadBookmarks);
  const toastTimer = useRef(null);

  const showToast = useCallback((message) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 4500);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  // Load buildings once
  useEffect(() => {
    api
      .get('/buildings')
      .then((data) => setBuildings(data.buildings))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => setQuery(urlQuery), [urlQuery]);

  const categories = useMemo(
    () => CATEGORY_ORDER.filter((c) => buildings.some((b) => b.category === c)),
    [buildings]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return buildings.filter(
      (b) =>
        (category === 'all' || b.category === category) &&
        (!q || [b.name, b.description, b.category, ...(b.aliases || [])].some((s) => s?.toLowerCase().includes(q)))
    );
  }, [buildings, category, query]);

  // Open a building when arriving from a link such as /map?focus=<id> (chat "Show on map")
  useEffect(() => {
    if (!focusId || !map || !buildings.length) return;
    const building = buildings.find((b) => b._id === focusId);
    if (building) {
      setSelected(building);
      map.flyToBuilding(building);
    }
  }, [focusId, map, buildings]);

  // Frame the results when searching or filtering
  useEffect(() => {
    if (!map || !filtered.length || (!query.trim() && category === 'all')) return undefined;
    const timer = setTimeout(() => {
      if (filtered.length === 1) {
        setSelected(filtered[0]);
        map.flyToBuilding(filtered[0]);
      } else {
        map.fitPoints(filtered.map((b) => [b.lat, b.lng]), 90, 18);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [map, filtered, query, category]);

  const selectBuilding = useCallback(
    (building) => {
      setSelected(building);
      setPanelOpen(false);
      if (map) map.flyToBuilding(building);
    },
    [map]
  );

  const gate = useMemo(() => {
    const g = buildings.find((b) => /main gate/i.test(b.name));
    return g ? [g.lat, g.lng] : CAMPUS_CENTER;
  }, [buildings]);

  async function startDirections(building) {
    if (!map) return;
    setBusy('Locating your position for directions...');
    let origin;
    let note = '';
    try {
      origin = await getCurrentPosition();
      if (haversine(origin, CAMPUS_CENTER) > FAR_FROM_CAMPUS_M) {
        note = 'You seem to be far from campus, so the route starts at the main gate.';
        origin = gate;
      } else {
        setUserPos(origin);
      }
    } catch {
      note = 'Could not read your location, so the route starts at the main gate.';
      origin = gate;
    }

    setBusy(`Calculating route to ${building.name}...`);
    try {
      const result = await fetchWalkingRoute(origin, [building.lat, building.lng]);
      setRoute({ ...result, to: building });
      setSelected(null);
      map.fitPoints(result.coords, 70);
      if (note) showToast(note);
    } catch (err) {
      showToast(err.message);
    } finally {
      setBusy('');
    }
  }

  async function locateMe() {
    setBusy('Finding your location...');
    try {
      const pos = await getCurrentPosition();
      setUserPos(pos);
      map?.flyTo(pos, 18);
      if (haversine(pos, CAMPUS_CENTER) > FAR_FROM_CAMPUS_M) showToast('You are outside the campus area.');
    } catch (err) {
      showToast(err.message);
    } finally {
      setBusy('');
    }
  }

  function toggleBookmark(building) {
    const next = bookmarks.includes(building._id)
      ? bookmarks.filter((id) => id !== building._id)
      : [...bookmarks, building._id];
    setBookmarks(next);
    try {
      localStorage.setItem(BOOKMARK_KEY, JSON.stringify(next));
    } catch {
      /* bookmarks just won't persist */
    }
  }

  async function shareBuilding(building) {
    const url = `${window.location.origin}/map?focus=${building._id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: building.name, text: `${building.name} - CampusBuddy`, url });
      } else {
        await navigator.clipboard.writeText(url);
        showToast('Link copied to clipboard');
      }
    } catch (err) {
      if (err.name !== 'AbortError') showToast('Could not share this place');
    }
  }

  return (
    <div className="relative size-full">
      <CampusMap
        buildings={filtered}
        selectedId={selected?._id}
        onSelect={selectBuilding}
        mapType={mapType}
        route={route?.coords}
        userPos={userPos}
        onReady={setMap}
      />

      {/* Search + category chips */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[1000] space-y-2 p-3 md:p-4">
        <div className="pointer-events-auto relative max-w-md">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            className="input !rounded-full !py-3 pl-10 pr-10 shadow-lg"
            placeholder="Search CampusBuddy map..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search the campus map"
          />
          {query && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted hover:bg-black/5"
              onClick={() => setQuery('')}
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="no-scrollbar pointer-events-auto flex max-w-full gap-2 overflow-x-auto pb-1">
          {['all', ...categories].map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
              className={cn(
                'shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold shadow transition',
                category === c ? 'border-brand bg-brand text-white' : 'border-line bg-paper text-ink hover:bg-white'
              )}
            >
              {c === 'all' ? 'All' : CATEGORY_META[c].label}
            </button>
          ))}
        </div>
      </div>

      {/* Map controls */}
      <div
        className={cn(
          'absolute right-3 top-1/2 z-[1000] flex -translate-y-1/2 flex-col gap-2 md:right-4',
          selected && 'max-md:hidden'
        )}
      >
        <MapButton label="Zoom in" onClick={() => map?.zoomIn()}>
          <Plus size={18} />
        </MapButton>
        <MapButton label="Zoom out" onClick={() => map?.zoomOut()}>
          <Minus size={18} />
        </MapButton>
        <MapButton label="Show my location" onClick={locateMe}>
          <Crosshair size={18} />
        </MapButton>
        <MapButton label="Back to campus" onClick={() => map?.flyTo(CAMPUS_CENTER, 16)}>
          <Home size={18} />
        </MapButton>
        <MapButton label="Map type" onClick={() => setPanelOpen((o) => !o)} active={panelOpen}>
          <Layers size={18} />
        </MapButton>
      </div>

      {panelOpen && (
        <div
          className="absolute right-16 top-1/2 z-[1000] w-56 -translate-y-1/2 rounded-2xl border border-line bg-paper p-3 shadow-xl md:right-20"
          role="dialog"
          aria-label="Map type"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold">Map Type</p>
              <p className="text-xs text-muted">Choose between default and satellite</p>
            </div>
            <button onClick={() => setPanelOpen(false)} className="rounded p-0.5 text-muted hover:bg-black/5" aria-label="Close">
              <X size={14} />
            </button>
          </div>
          <p className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-muted">Select map style</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {[
              ['default', 'Default', 'linear-gradient(135deg,#f3ecd9,#e2d8bd)'],
              ['satellite', 'Satellite', 'linear-gradient(135deg,#7b9a58,#3f5d33)'],
            ].map(([value, text, swatch]) => (
              <button
                key={value}
                onClick={() => setMapType(value)}
                aria-pressed={mapType === value}
                className={cn(
                  'relative rounded-xl border-2 p-1.5 text-xs font-medium',
                  mapType === value ? 'border-brand bg-brand/5 text-brand' : 'border-line bg-white'
                )}
              >
                <span className="mb-1 block h-10 rounded-lg" style={{ background: swatch }} />
                {text}
                {mapType === value && <Check size={12} className="absolute right-2 top-2 text-white" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Building details */}
      {selected && (
        <BuildingSheet
          building={selected}
          bookmarked={bookmarks.includes(selected._id)}
          busy={Boolean(busy)}
          onClose={() => setSelected(null)}
          onDirections={startDirections}
          onBookmark={toggleBookmark}
          onShare={shareBuilding}
        />
      )}

      {/* Active route */}
      {route && !selected && (
        <div className="absolute inset-x-3 bottom-3 z-[1000] rounded-2xl border border-line bg-paper p-4 shadow-2xl md:inset-x-auto md:bottom-4 md:left-4 md:w-[380px]">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <Footprints size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Walking route to</p>
              <p className="truncate font-semibold">{route.to.name}</p>
              <p className="text-sm text-muted">
                {formatDistance(route.distance)} &middot; about {route.minutes} min
              </p>
            </div>
            <button className="btn-ghost !px-3 !py-2 text-xs" onClick={() => setRoute(null)}>
              Clear
            </button>
          </div>
        </div>
      )}

      {/* States */}
      {loading && (
        <div className="absolute inset-0 z-[1050] flex items-center justify-center bg-cream/60" role="status">
          <Loader2 className="animate-spin text-brand" size={28} />
        </div>
      )}
      {error && (
        <div className="absolute left-1/2 top-1/3 z-[1050] w-[min(90%,24rem)] -translate-x-1/2">
          <ErrorNote>{error}</ErrorNote>
        </div>
      )}
      {!loading && !error && filtered.length === 0 && (
        <div className="absolute bottom-6 left-1/2 z-[1000] -translate-x-1/2 rounded-full bg-ink/90 px-4 py-2 text-sm text-white shadow-lg">
          No places match your search
        </div>
      )}

      {busy && (
        <div className="absolute inset-0 z-[1100] flex items-center justify-center bg-black/10" role="status" aria-live="polite">
          <div className="flex max-w-xs items-center gap-3 rounded-2xl bg-ink/90 px-5 py-4 text-sm font-medium text-white shadow-2xl">
            <Loader2 className="shrink-0 animate-spin" size={20} />
            {busy}
          </div>
        </div>
      )}

      {toast && (
        <div
          className="absolute left-1/2 top-24 z-[1100] w-[min(92%,26rem)] -translate-x-1/2 rounded-xl bg-ink/90 px-4 py-3 text-center text-sm text-white shadow-xl"
          role="status"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
