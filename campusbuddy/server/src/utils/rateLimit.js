/** Tiny in-memory limiter: at most `max` requests per `windowMs` for each key (IP by default). */
export function rateLimit({ max, windowMs, message = 'Too many attempts. Please wait a few minutes and try again.', key }) {
  const hits = new Map();
  return (req, res, next) => {
    const now = Date.now();
    const k = key ? key(req) : req.ip;
    const recent = (hits.get(k) || []).filter((t) => now - t < windowMs);
    if (recent.length >= max) return res.status(429).json({ error: message });
    recent.push(now);
    hits.set(k, recent);
    if (hits.size > 5000) for (const [id, list] of hits) if (!list.some((t) => now - t < windowMs)) hits.delete(id);
    next();
  };
}
