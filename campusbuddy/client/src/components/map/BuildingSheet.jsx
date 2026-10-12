import { Bookmark, Clock, Mail, Navigation, Phone, Share2, X } from 'lucide-react';
import { metaFor } from '../../lib/categories.js';
import { cn } from '../../lib/format.js';

export default function BuildingSheet({ building, bookmarked, onClose, onDirections, onBookmark, onShare, busy }) {
  const { color, label, Icon } = metaFor(building.category);

  return (
    <section
      className="absolute inset-x-0 bottom-0 z-[1000] max-h-[75%] overflow-y-auto rounded-t-3xl border border-line bg-paper shadow-2xl md:inset-x-auto md:bottom-4 md:left-4 md:w-[380px] md:max-h-[calc(100%-7rem)] md:rounded-3xl"
      aria-label={`${building.name} details`}
    >
      {/* Banner */}
      <div
        className="relative flex h-36 items-end overflow-hidden rounded-t-3xl p-4 md:rounded-t-3xl"
        style={{ background: `linear-gradient(135deg, ${color}, ${color}aa)` }}
      >
        {building.image ? (
          <img src={building.image} alt="" className="absolute inset-0 size-full object-cover" />
        ) : (
          <Icon size={110} strokeWidth={1.2} className="absolute -right-4 -top-2 text-white/20" aria-hidden="true" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <button
          onClick={onClose}
          className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60"
          aria-label="Close details"
        >
          <X size={18} />
        </button>
        <div className="relative">
          <span className="mb-1.5 inline-block rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-ink">
            {label}
          </span>
          <h2 className="text-lg font-bold leading-tight text-white">{building.name}</h2>
        </div>
      </div>

      <div className="space-y-4 p-4">
        {building.description && <p className="text-sm leading-relaxed text-ink/80">{building.description}</p>}

        {(building.phone || building.email || building.hours) && (
          <div className="space-y-2 rounded-2xl border border-line bg-white/70 p-3 text-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Contact details</p>
            {building.phone && (
              <a href={`tel:${building.phone.replace(/\s/g, '')}`} className="flex items-center gap-2.5 hover:text-brand">
                <Phone size={15} className="text-muted" /> {building.phone}
              </a>
            )}
            {building.email && (
              <a href={`mailto:${building.email}`} className="flex items-center gap-2.5 break-all hover:text-brand">
                <Mail size={15} className="shrink-0 text-muted" /> {building.email}
              </a>
            )}
            {building.hours && (
              <p className="flex items-start gap-2.5">
                <Clock size={15} className="mt-0.5 shrink-0 text-muted" /> {building.hours}
              </p>
            )}
          </div>
        )}

        {building.facilities?.length > 0 && (
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">Facilities and services</p>
            <ul className="space-y-1.5">
              {building.facilities.map((f) => (
                <li key={f} className="flex items-center gap-2 rounded-lg border border-line bg-white/70 px-3 py-2 text-sm">
                  <span className="size-1.5 rounded-full" style={{ background: color }} />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button className="btn-primary flex-1" onClick={() => onDirections(building)} disabled={busy}>
            <Navigation size={16} /> Get Directions
          </button>
          <button
            className={cn('btn-ghost !px-3', bookmarked && '!border-brand !text-brand')}
            onClick={() => onBookmark(building)}
            aria-pressed={bookmarked}
            aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark this place'}
          >
            <Bookmark size={16} fill={bookmarked ? 'currentColor' : 'none'} />
          </button>
          <button className="btn-ghost !px-3" onClick={() => onShare(building)} aria-label="Share this place">
            <Share2 size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
