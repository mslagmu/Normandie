import React, { useState } from 'react';
import {
  Clock,
  ExternalLink,
  Globe,
  MapPin,
  Navigation,
  Plus,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Star,
} from 'lucide-react';
import { CATEGORY_LABELS, SECTORS } from '../data/sectors';
import type { LandingPlace } from '../types/dday';

interface PlaceDetailSheetProps {
  place: LandingPlace;
  isInItinerary: boolean;
  onToggleItinerary: (place: LandingPlace) => void;
  onZoomToPlace: (place: LandingPlace) => void;
  onClose: () => void;
}

export const PlaceDetailSheet: React.FC<PlaceDetailSheetProps> = ({
  place,
  isInItinerary,
  onToggleItinerary,
  onZoomToPlace,
  onClose,
}) => {
  const [showHours, setShowHours] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  const sectorMeta = SECTORS[place.sector];
  const fallbackImage = sectorMeta.imageUrl;
  const displayImage = !imgFailed && place.photoUrl ? place.photoUrl : fallbackImage;

  return (
    <aside
      aria-label={`Détails de ${place.displayName}`}
      className="bg-white border border-[#E4DFD5] rounded-xl shadow-xl overflow-hidden w-full max-w-sm flex flex-col max-h-[72vh]"
    >
      {/* Visual header with measured contrast scrim */}
      <div className="relative h-40 w-full bg-[#EBE6DF] shrink-0 overflow-hidden">
        {displayImage ? (
          <img
            src={displayImage}
            alt={place.displayName}
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${sectorMeta.color}22 0%, #EBE6DF 100%)`,
            }}
          >
            <MapPin className="w-8 h-8 text-[#57534E]" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer la fiche"
          className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-black/55 hover:bg-black/75 text-white flex items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-white"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="absolute bottom-3 left-4 right-4 text-white">
          <div className="text-[11px] font-medium tracking-wider uppercase text-stone-200 flex items-center gap-1.5">
            <span
              className="inline-block w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: sectorMeta.color }}
            />
            <span className="truncate">{sectorMeta.name}</span>
          </div>
          <h3 className="font-serif text-lg font-semibold leading-snug line-clamp-2 mt-0.5">
            {place.displayName}
          </h3>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="p-4 overflow-y-auto editorial-scroll space-y-3.5 text-sm">
        {/* Unboxed metadata row (Zero-Pill discipline) */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#57534E]">
          <span className="font-medium text-[#1C1917]">
            {place.primaryTypeDisplayName || CATEGORY_LABELS[place.category]}
          </span>
          {typeof place.rating === 'number' && (
            <>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 tabular-nums text-[#1C1917] font-medium">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                {place.rating.toFixed(1).replace('.', ',')}
                {typeof place.userRatingCount === 'number' && (
                  <span className="text-[#57534E] font-normal">
                    ({place.userRatingCount.toLocaleString('fr-FR')})
                  </span>
                )}
              </span>
            </>
          )}
          <span aria-hidden="true">·</span>
          <span className="font-mono text-[11px] tabular-nums">
            {place.position.lat.toFixed(4)}°N, {Math.abs(place.position.lng).toFixed(4)}°
            {place.position.lng < 0 ? 'O' : 'E'}
          </span>
        </div>

        {place.editorialSummary && (
          <p className="text-[#292524] leading-relaxed text-[13px]">
            {place.editorialSummary}
          </p>
        )}

        <div className="border-t border-[#E4DFD5] pt-3 space-y-2.5 text-xs">
          {place.formattedAddress && (
            <div className="flex items-start gap-2 text-[#44403C]">
              <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#78716C]" />
              <span>{place.formattedAddress}</span>
            </div>
          )}

          {place.weekdayDescriptions && place.weekdayDescriptions.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setShowHours((prev) => !prev)}
                className="flex items-center justify-between w-full text-left text-[#1C1917] hover:text-[#1B365D] transition-colors py-0.5"
              >
                <span className="inline-flex items-center gap-2 font-medium">
                  <Clock className="w-3.5 h-3.5 text-[#78716C]" />
                  Horaires d’ouverture
                </span>
                {showHours ? (
                  <ChevronUp className="w-3.5 h-3.5 text-[#78716C]" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-[#78716C]" />
                )}
              </button>
              {showHours && (
                <ul className="mt-1.5 pl-5.5 space-y-1 text-[11px] text-[#57534E] tabular-nums">
                  {place.weekdayDescriptions.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {(place.websiteURI || place.googleMapsURI) && (
            <div className="flex flex-wrap items-center gap-4 pt-1">
              {place.websiteURI && (
                <a
                  href={place.websiteURI}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[#1B365D] hover:underline font-medium"
                >
                  <Globe className="w-3.5 h-3.5" />
                  Site officiel
                </a>
              )}
              {place.googleMapsURI && (
                <a
                  href={place.googleMapsURI}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[#1B365D] hover:underline font-medium"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Voir sur Google Maps
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action footer */}
      <div className="px-4 py-3 bg-[#F8F6F1] border-t border-[#E4DFD5] flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => onToggleItinerary(place)}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
            isInItinerary
              ? 'bg-[#1C1917] text-white hover:bg-[#292524]'
              : 'bg-[#1B365D] text-white hover:bg-[#152a49]'
          }`}
        >
          {isInItinerary ? (
            <>
              <Check className="w-3.5 h-3.5" />
              Dans mon circuit
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" />
              Ajouter au circuit
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => onZoomToPlace(place)}
          title="Centrer la carte sur ce site"
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-white border border-[#D6CEBE] text-[#1C1917] hover:bg-[#EBE6DF] transition-colors whitespace-nowrap shrink-0"
        >
          <Navigation className="w-3.5 h-3.5" />
          Zoomer
        </button>
      </div>
    </aside>
  );
};
