const normalise = (s) => s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

const STOP_WORDS = new Set([
  'where', 'is', 'the', 'a', 'an', 'of', 'in', 'at', 'to', 'how', 'do', 'i', 'get', 'find', 'locate',
  'me', 'show', 'nsuk', 'and', 'for', 'my', 'what', 'near', 'building', 'faculty', 'centre', 'center',
]);

/** Names and aliases that identify a building. */
const keysFor = (b) => [b.name, ...(b.aliases || [])].map(normalise).filter((k) => k.length >= 3);

/** Buildings that are mentioned (by name or alias) in a piece of text. */
export function mentionedPlaces(text, buildings, limit = 3) {
  const haystack = ` ${normalise(text)} `;
  const hits = [];
  for (const b of buildings) {
    const best = keysFor(b)
      .filter((k) => haystack.includes(` ${k} `))
      .sort((a, c) => c.length - a.length)[0];
    if (best) hits.push({ building: b, weight: best.length });
  }
  return hits
    .sort((a, b) => b.weight - a.weight)
    .slice(0, limit)
    .map((h) => h.building);
}

/** Best single building for a free-form question like "where can I find the clinic?". */
export function bestPlaceForQuestion(question, buildings) {
  const direct = mentionedPlaces(question, buildings, 1)[0];
  if (direct) return direct;

  const tokens = normalise(question)
    .split(' ')
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));
  if (!tokens.length) return null;

  let best = null;
  let bestScore = 0;
  for (const b of buildings) {
    const words = new Set(keysFor(b).flatMap((k) => k.split(' ')));
    const score = tokens.filter((t) => words.has(t)).length;
    if (score > bestScore) {
      best = b;
      bestScore = score;
    }
  }
  return best;
}
