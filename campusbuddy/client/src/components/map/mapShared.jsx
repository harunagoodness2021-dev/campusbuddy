import { renderToStaticMarkup } from 'react-dom/server';
import { metaFor } from '../../lib/categories.js';

// Approximate centre of the NSUK Keffi campus
export const CAMPUS_CENTER = [8.8466, 7.8775];

const cache = new Map();

/** HTML for a round coloured category pin. Used by both the Leaflet and Google maps. */
export function pinHtml(category, selected) {
  const key = `${category}:${selected}`;
  if (!cache.has(key)) {
    const { color, Icon } = metaFor(category);
    const svg = renderToStaticMarkup(<Icon size={15} color="#ffffff" strokeWidth={2.6} />);
    cache.set(key, `<div class="cb-pin${selected ? ' is-selected' : ''}" style="background:${color}">${svg}</div>`);
  }
  return cache.get(key);
}
