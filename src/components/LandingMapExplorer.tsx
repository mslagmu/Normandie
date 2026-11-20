import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Map as GoogleMap,
  useApiIsLoaded,
  useApiLoadingStatus,
  APILoadingStatus,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import {
  ArrowDown,
  ArrowUp,
  Check,
  Compass,
  Layers,
  List,
  Loader2,
  MapPin,
  Plus,
  RotateCcw,
  Route as RouteIcon,
  Search,
  Sparkles,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import {
  CATEGORY_LABELS,
  COASTAL_DISCOVERY_QUERIES,
  NORMANDY_CENTER,
  NORMANDY_COAST_BOUNDS,
  SECTOR_ORDER,
  SECTORS,
  normalizeGooglePlace,
} from '../data/sectors';
import type {
  LandingPlace,
  RouteSummary,
  SectorId,
  SiteCategory,
} from '../types/dday';
import { AdvancedMarkerWithRef } from './AdvancedMarkerWithRef';
import { PlaceDetailSheet } from './PlaceDetailSheet';
import { RouteOverlay } from './RouteOverlay';

const PLACE_FIELDS = [
  'id',
  'displayName',
  'location',
  'formattedAddress',
  'rating',
  'userRatingCount',
  'editorialSummary',
  'primaryTypeDisplayName',
  'types',
  'photos',
  'googleMapsURI',
  'regularOpeningHours',
  'websiteURI',
];

function formatDuration(millis: number): string {
  const totalMinutes = Math.round(millis / 60000);
  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return mins > 0 ? `${hours} h ${mins.toString().padStart(2, '0')}` : `${hours} h`;
}

function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters} m`;
  }
  return `${(meters / 1000).toFixed(1).replace('.', ',')} km`;
}

interface LandingMapExplorerProps {
  activeSector: SectorId;
  onSectorChange: (sector: SectorId) => void;
  sidebarTab: 'places' | 'itinerary';
  onSidebarTabChange: (tab: 'places' | 'itinerary') => void;
  onItineraryCountChange: (count: number) => void;
}

export const LandingMapExplorer: React.FC<LandingMapExplorerProps> = ({
  activeSector,
  onSectorChange,
  sidebarTab,
  onSidebarTabChange,
  onItineraryCountChange,
}) => {
  const map = useMap();
  const isApiLoaded = useApiIsLoaded();
  const apiStatus = useApiLoadingStatus();
  const placesLib = useMapsLibrary('places');

  const [placesById, setPlacesById] = useState<Record<string, LandingPlace>>({});
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(true);
  const [placesError, setPlacesError] = useState<string | null>(null);

  const [activeCategory, setActiveCategory] = useState<SiteCategory>('all');
  const [searchInput, setSearchInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [hoveredPlaceId, setHoveredPlaceId] = useState<string | null>(null);

  const [mapTypeId, setMapTypeId] = useState<'roadmap' | 'hybrid' | 'terrain'>('roadmap');
  const [itineraryIds, setItineraryIds] = useState<string[]>([]);
  const [routeSummary, setRouteSummary] = useState<RouteSummary | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  const initialFetchDoneRef = useRef(false);

  useEffect(() => {
    onItineraryCountChange(itineraryIds.length);
  }, [itineraryIds.length, onItineraryCountChange]);

  // Zoom map when user picks a specific sector from the overview or tabs
  const prevSectorRef = useRef<SectorId>(activeSector);
  useEffect(() => {
    if (!map) return;
    if (prevSectorRef.current === activeSector) return;
    prevSectorRef.current = activeSector;

    if (activeSector === 'all') {
      map.panTo(NORMANDY_CENTER);
      map.setZoom(10);
    } else {
      const meta = SECTORS[activeSector];
      map.panTo(meta.center);
      map.setZoom(meta.zoom);
    }
  }, [activeSector, map]);

  // Initial Places API (New) discovery across the 3 coastal partitions
  useEffect(() => {
    if (!placesLib || initialFetchDoneRef.current) return;
    initialFetchDoneRef.current = true;

    let cancelled = false;
    setIsLoadingPlaces(true);
    setPlacesError(null);

    Promise.all(
      COASTAL_DISCOVERY_QUERIES.map((queryConfig) =>
        placesLib.Place.searchByText({
          textQuery: queryConfig.textQuery,
          locationRestriction: queryConfig.locationRestriction,
          fields: PLACE_FIELDS,
          language: 'fr',
          region: 'fr',
          maxResultCount: 15,
        })
      )
    )
      .then((responses) => {
        if (cancelled) return;
        const merged: Record<string, LandingPlace> = {};
        for (const res of responses) {
          for (const rawPlace of res.places ?? []) {
            const normalized = normalizeGooglePlace(rawPlace);
            if (normalized) {
              merged[normalized.id] = normalized;
            }
          }
        }
        setPlacesById(merged);
        setIsLoadingPlaces(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setIsLoadingPlaces(false);
        const msg = err instanceof Error ? err.message : String(err);
        if (
          msg.includes('RESOURCE_EXHAUSTED') ||
          msg.includes('OVER_QUERY_LIMIT') ||
          msg.includes('429')
        ) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
        setPlacesError(
          'Impossible de charger les lieux via Google Places pour le moment.'
        );
      });

    return () => {
      cancelled = true;
    };
  }, [placesLib]);

  const allPlaces = useMemo(() => {
    return Object.values(placesById).sort(
      (a, b) => a.position.lng - b.position.lng
    );
  }, [placesById]);

  const filteredPlaces = useMemo(() => {
    const queryLower = searchInput.trim().toLowerCase();
    return allPlaces.filter((place) => {
      if (activeSector !== 'all' && place.sector !== activeSector) {
        return false;
      }
      if (activeCategory !== 'all' && place.category !== activeCategory) {
        return false;
      }
      if (queryLower.length > 0) {
        const hay = `${place.displayName} ${place.formattedAddress ?? ''} ${
          SECTORS[place.sector].name
        }`.toLowerCase();
        if (!hay.includes(queryLower)) {
          return false;
        }
      }
      return true;
    });
  }, [allPlaces, activeSector, activeCategory, searchInput]);

  const selectedPlace = selectedPlaceId ? placesById[selectedPlaceId] ?? null : null;

  const itineraryPlaces = useMemo(
    () =>
      itineraryIds
        .map((id) => placesById[id])
        .filter((p): p is LandingPlace => Boolean(p)),
    [itineraryIds, placesById]
  );

  // Live Google Places search handler
  const handleLiveSearch = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = searchInput.trim();
      if (!trimmed || !placesLib) return;

      setIsSearching(true);
      setPlacesError(null);

      try {
        const { places } = await placesLib.Place.searchByText({
          textQuery: trimmed.toLowerCase().includes('normandie')
            ? trimmed
            : `${trimmed} Normandie plages débarquement`,
          locationBias: NORMANDY_COAST_BOUNDS,
          fields: PLACE_FIELDS,
          language: 'fr',
          region: 'fr',
          maxResultCount: 10,
        });

        const newlyAdded: LandingPlace[] = [];
        setPlacesById((prev) => {
          const next = { ...prev };
          for (const raw of places ?? []) {
            const normalized = normalizeGooglePlace(raw);
            if (normalized) {
              next[normalized.id] = normalized;
              newlyAdded.push(normalized);
            }
          }
          return next;
        });

        if (newlyAdded.length > 0) {
          onSectorChange('all');
          setActiveCategory('all');
          setSelectedPlaceId(newlyAdded[0].id);
          if (map) {
            map.panTo(newlyAdded[0].position);
            map.setZoom(13);
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (
          msg.includes('RESOURCE_EXHAUSTED') ||
          msg.includes('OVER_QUERY_LIMIT') ||
          msg.includes('429')
        ) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
        setPlacesError('La recherche n’a pas pu aboutir. Veuillez réessayer.');
      } finally {
        setIsSearching(false);
      }
    },
    [searchInput, placesLib, map, onSectorChange]
  );

  const handleSearchInArea = useCallback(async () => {
    if (!placesLib || !map) return;
    const bounds = map.getBounds();
    if (!bounds) return;

    setIsSearching(true);
    setPlacesError(null);
    try {
      const { places } = await placesLib.Place.searchByText({
        textQuery: 'musée mémorial cimetière batterie historique débarquement',
        locationRestriction: bounds,
        fields: PLACE_FIELDS,
        language: 'fr',
        region: 'fr',
        maxResultCount: 12,
      });

      setPlacesById((prev) => {
        const next = { ...prev };
        for (const raw of places ?? []) {
          const normalized = normalizeGooglePlace(raw);
          if (normalized) {
            next[normalized.id] = normalized;
          }
        }
        return next;
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.includes('RESOURCE_EXHAUSTED') ||
        msg.includes('OVER_QUERY_LIMIT') ||
        msg.includes('429')
      ) {
        window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
      }
    } finally {
      setIsSearching(false);
    }
  }, [placesLib, map]);

  const handleSelectPlace = useCallback(
    (place: LandingPlace) => {
      setSelectedPlaceId(place.id);
      if (map) {
        map.panTo(place.position);
        const currentZoom = map.getZoom() ?? 10;
        if (currentZoom < 12) {
          map.setZoom(12);
        }
      }
    },
    [map]
  );

  const handleToggleItinerary = useCallback((place: LandingPlace) => {
    setItineraryIds((prev) => {
      if (prev.includes(place.id)) {
        return prev.filter((id) => id !== place.id);
      }
      if (prev.length >= 10) {
        return prev;
      }
      return [...prev, place.id];
    });
  }, []);

  const handleMoveStop = useCallback((index: number, direction: -1 | 1) => {
    setItineraryIds((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[target];
      copy[target] = temp;
      return copy;
    });
  }, []);

  const handleSuggestCoastalCircuit = useCallback(() => {
    const picked: string[] = [];
    for (const sectorKey of SECTOR_ORDER) {
      const candidates = allPlaces
        .filter((p) => p.sector === sectorKey)
        .sort((a, b) => (b.userRatingCount ?? 0) - (a.userRatingCount ?? 0));
      if (candidates.length > 0 && !picked.includes(candidates[0].id)) {
        picked.push(candidates[0].id);
      }
    }
    if (picked.length >= 2) {
      setItineraryIds(picked);
      onSidebarTabChange('itinerary');
    }
  }, [allPlaces, onSidebarTabChange]);

  const handleResetView = useCallback(() => {
    onSectorChange('all');
    setActiveCategory('all');
    setSearchInput('');
    setSelectedPlaceId(null);
    if (map) {
      map.panTo(NORMANDY_CENTER);
      map.setZoom(10);
    }
  }, [map, onSectorChange]);

  // Sort markers by descending latitude so southern markers sit slightly above northern ones,
  // with hovered/selected markers promoted to the top.
  const sortedMarkers = useMemo(() => {
    return [...filteredPlaces]
      .sort((a, b) => b.position.lat - a.position.lat)
      .map((place, idx) => ({
        place,
        baseZIndex: idx + 1,
      }));
  }, [filteredPlaces]);

  const displayIndexById = useMemo(() => {
    const lookup: Record<string, number> = {};
    filteredPlaces.forEach((p, idx) => {
      lookup[p.id] = idx + 1;
    });
    return lookup;
  }, [filteredPlaces]);

  const itineraryIndexById = useMemo(() => {
    const lookup: Record<string, number> = {};
    itineraryIds.forEach((id, idx) => {
      lookup[id] = idx + 1;
    });
    return lookup;
  }, [itineraryIds]);

  const hasApiError =
    apiStatus === APILoadingStatus.FAILED ||
    apiStatus === APILoadingStatus.AUTH_FAILURE;

  return (
    <section
      id="carte"
      className="flex flex-col lg:flex-row w-full lg:h-[calc(100vh-4rem)] min-h-[640px] border-b border-[#E4DFD5] bg-[#F8F6F1]"
    >
      {/* Left Curatorial Sidebar */}
      <div className="w-full lg:w-[430px] xl:w-[460px] shrink-0 bg-white border-r border-[#E4DFD5] flex flex-col lg:h-full max-h-[75vh] lg:max-h-none">
        {/* Sidebar Mode Switcher + Intro */}
        <div className="px-5 pt-4 pb-3 border-b border-[#E4DFD5] space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h1 className="font-serif text-xl font-semibold text-[#1C1917] leading-tight">
                Sites du Débarquement
              </h1>
              <p className="text-xs text-[#57534E] mt-0.5 tabular-nums">
                {isLoadingPlaces
                  ? 'Chargement des sites côtiers…'
                  : `${filteredPlaces.length} lieu${
                      filteredPlaces.length > 1 ? 'x' : ''
                    } d’Ouest en Est`}
              </p>
            </div>

            <div
              role="tablist"
              aria-label="Mode du panneau"
              className="inline-flex items-center p-1 bg-[#F3EFE6] rounded-lg border border-[#E4DFD5]"
            >
              <button
                type="button"
                role="tab"
                aria-selected={sidebarTab === 'places'}
                onClick={() => onSidebarTabChange('places')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  sidebarTab === 'places'
                    ? 'bg-white text-[#1C1917] shadow-sm'
                    : 'text-[#57534E] hover:text-[#1C1917]'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                Lieux
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={sidebarTab === 'itinerary'}
                onClick={() => onSidebarTabChange('itinerary')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 tabular-nums ${
                  sidebarTab === 'itinerary'
                    ? 'bg-white text-[#1C1917] shadow-sm'
                    : 'text-[#57534E] hover:text-[#1C1917]'
                }`}
              >
                <RouteIcon className="w-3.5 h-3.5" />
                Circuit ({itineraryPlaces.length})
              </button>
            </div>
          </div>

          {sidebarTab === 'places' && (
            <>
              {/* Search Form */}
              <form onSubmit={handleLiveSearch} className="relative flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-[#78716C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Rechercher un musée, bunker, plage…"
                    aria-label="Rechercher un lieu sur les plages du Débarquement"
                    className="w-full pl-8 pr-8 py-2 text-xs bg-[#F8F6F1] border border-[#D6CEBE] rounded-lg text-[#1C1917] placeholder:text-[#78716C] focus:outline-none focus:border-[#1B365D] focus:bg-white transition-colors"
                  />
                  {searchInput && (
                    <button
                      type="button"
                      onClick={() => setSearchInput('')}
                      aria-label="Effacer la recherche"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#78716C] hover:text-[#1C1917]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isSearching || !searchInput.trim() || !placesLib}
                  className="px-3 py-2 rounded-lg text-xs font-medium bg-[#1B365D] text-white hover:bg-[#152a49] disabled:opacity-45 transition-colors whitespace-nowrap shrink-0"
                >
                  {isSearching ? 'Recherche…' : 'Chercher'}
                </button>
              </form>

              {/* Sector Filter Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 editorial-scroll">
                <button
                  type="button"
                  onClick={() => onSectorChange('all')}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    activeSector === 'all'
                      ? 'bg-[#1C1917] text-white'
                      : 'bg-[#F3EFE6] text-[#44403C] hover:bg-[#E7E1D4]'
                  }`}
                >
                  Toutes
                </button>
                {SECTOR_ORDER.map((sectorKey) => {
                  const meta = SECTORS[sectorKey];
                  const active = activeSector === sectorKey;
                  return (
                    <button
                      key={sectorKey}
                      type="button"
                      onClick={() => onSectorChange(sectorKey)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                        active
                          ? 'bg-[#1C1917] text-white'
                          : 'bg-[#F3EFE6] text-[#44403C] hover:bg-[#E7E1D4]'
                      }`}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: active ? '#F8F6F1' : meta.color }}
                      />
                      <span>{meta.shortName}</span>
                    </button>
                  );
                })}
              </div>

              {/* Category Filter Row */}
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5 editorial-scroll">
                {(Object.keys(CATEGORY_LABELS) as SiteCategory[]).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 border ${
                      activeCategory === cat
                        ? 'border-[#1B365D] bg-[#1B365D]/8 text-[#1B365D]'
                        : 'border-transparent text-[#57534E] hover:text-[#1C1917] hover:bg-[#F8F6F1]'
                    }`}
                  >
                    {CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Sidebar Content Area */}
        {sidebarTab === 'places' ? (
          <div className="flex-1 overflow-y-auto editorial-scroll divide-y divide-[#EFECE4]">
            {placesError && (
              <div className="p-5 text-xs text-red-800 bg-red-50 border-b border-red-200">
                {placesError}
              </div>
            )}

            {isLoadingPlaces && (
              <div className="p-5 space-y-4">
                {[1, 2, 3, 4, 5].map((n) => (
                  <div
                    key={n}
                    className="animate-pulse space-y-2 pb-4 border-b border-[#EFECE4]"
                  >
                    <div className="h-3 w-28 bg-[#EBE6DF] rounded" />
                    <div className="h-4 w-3/4 bg-[#E4DFD5] rounded" />
                    <div className="h-3 w-1/2 bg-[#EBE6DF] rounded" />
                  </div>
                ))}
              </div>
            )}

            {!isLoadingPlaces && filteredPlaces.length === 0 && (
              <div className="p-8 text-center space-y-3">
                <Compass className="w-7 h-7 text-[#78716C] mx-auto" />
                <p className="text-sm font-medium text-[#1C1917]">
                  Aucun site ne correspond à ces filtres.
                </p>
                <p className="text-xs text-[#57534E]">
                  Essayez une recherche directe sur Google Places ou réinitialisez la vue.
                </p>
                <button
                  type="button"
                  onClick={handleResetView}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[#D6CEBE] text-[#1C1917] hover:bg-[#F3EFE6]"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Réinitialiser les filtres
                </button>
              </div>
            )}

            {!isLoadingPlaces &&
              filteredPlaces.map((place, idx) => {
                const sectorMeta = SECTORS[place.sector];
                const isSelected = selectedPlaceId === place.id;
                const inItinerary = Boolean(itineraryIndexById[place.id]);
                const numLabel = String(idx + 1).padStart(2, '0');

                return (
                  <div
                    key={place.id}
                    onMouseEnter={() => setHoveredPlaceId(place.id)}
                    onMouseLeave={() => setHoveredPlaceId(null)}
                    className={`px-5 py-3.5 transition-colors flex items-start gap-3 ${
                      isSelected ? 'bg-[#F3EFE6]' : 'hover:bg-[#FAF8F4]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectPlace(place)}
                      className="flex-1 text-left min-w-0 focus-visible:outline-2 focus-visible:outline-[#1B365D] rounded"
                    >
                      <div className="flex items-center gap-2 text-[11px] text-[#57534E] mb-1">
                        <span className="font-mono font-medium tabular-nums text-[#1C1917]">
                          {numLabel}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1 truncate">
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: sectorMeta.color }}
                          />
                          <span className="truncate">{sectorMeta.shortName}</span>
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="truncate">
                          {place.primaryTypeDisplayName || CATEGORY_LABELS[place.category]}
                        </span>
                      </div>

                      <h2 className="font-serif text-[15px] font-semibold text-[#1C1917] leading-snug line-clamp-1">
                        {place.displayName}
                      </h2>

                      <div className="flex items-center gap-2 text-xs text-[#57534E] mt-1">
                        {typeof place.rating === 'number' && (
                          <span className="inline-flex items-center gap-1 tabular-nums text-[#1C1917] font-medium">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                            {place.rating.toFixed(1).replace('.', ',')}
                            {typeof place.userRatingCount === 'number' && (
                              <span className="text-[#78716C] font-normal">
                                ({place.userRatingCount.toLocaleString('fr-FR')})
                              </span>
                            )}
                          </span>
                        )}
                        {place.formattedAddress && (
                          <>
                            {typeof place.rating === 'number' && (
                              <span aria-hidden="true">·</span>
                            )}
                            <span className="truncate text-[11px] text-[#78716C]">
                              {place.formattedAddress}
                            </span>
                          </>
                        )}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleItinerary(place)}
                      title={
                        inItinerary
                          ? 'Retirer de mon circuit'
                          : 'Ajouter à mon circuit'
                      }
                      aria-label={
                        inItinerary
                          ? `Retirer ${place.displayName} du circuit`
                          : `Ajouter ${place.displayName} au circuit`
                      }
                      className={`mt-1 w-8 h-8 rounded-lg flex items-center justify-center border transition-colors shrink-0 ${
                        inItinerary
                          ? 'bg-[#1B365D] border-[#1B365D] text-white'
                          : 'bg-white border-[#D6CEBE] text-[#44403C] hover:border-[#1B365D] hover:text-[#1B365D]'
                      }`}
                    >
                      {inItinerary ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                );
              })}
          </div>
        ) : (
          /* Itinerary Builder Tab */
          <div className="flex-1 overflow-y-auto editorial-scroll flex flex-col">
            <div className="p-5 border-b border-[#E4DFD5] bg-[#FAF8F4] space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-[#1C1917]">
                  Itinéraire routier personnalisé
                </span>
                {itineraryPlaces.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setItineraryIds([])}
                    className="text-xs text-[#78716C] hover:text-red-700 transition-colors"
                  >
                    Tout effacer
                  </button>
                )}
              </div>

              {itineraryPlaces.length < 2 && (
                <p className="text-xs text-[#57534E] leading-relaxed">
                  Ajoutez au moins 2 sites depuis la liste ou la carte pour calculer
                  automatiquement le trajet en voiture et les temps de parcours.
                </p>
              )}

              <button
                type="button"
                disabled={allPlaces.length < 2}
                onClick={handleSuggestCoastalCircuit}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-[#1B365D] text-white hover:bg-[#152a49] disabled:opacity-45 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Générer un circuit complet (Ouest → Est)
              </button>

              {routeLoading && (
                <div className="flex items-center gap-2 text-xs text-[#1B365D] pt-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Calcul de l’itinéraire via Google Routes…</span>
                </div>
              )}

              {routeError && (
                <div className="text-xs text-red-800 bg-red-50 border border-red-200 rounded-lg p-2.5">
                  {routeError}
                </div>
              )}

              {routeSummary && !routeLoading && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="bg-white border border-[#E4DFD5] rounded-lg p-3">
                    <div className="text-[11px] text-[#57534E]">Distance totale</div>
                    <div className="font-mono text-base font-semibold text-[#1C1917] tabular-nums mt-0.5">
                      {formatDistance(routeSummary.distanceMeters)}
                    </div>
                  </div>
                  <div className="bg-white border border-[#E4DFD5] rounded-lg p-3">
                    <div className="text-[11px] text-[#57534E]">Temps de conduite</div>
                    <div className="font-mono text-base font-semibold text-[#1C1917] tabular-nums mt-0.5">
                      {formatDuration(routeSummary.durationMillis)}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {itineraryPlaces.length === 0 ? (
              <div className="p-8 text-center space-y-2 text-xs text-[#57534E]">
                <MapPin className="w-6 h-6 text-[#78716C] mx-auto" />
                <p className="font-medium text-[#1C1917]">Aucune étape sélectionnée</p>
                <p>
                  Cliquez sur « + » à côté d’un site dans l’onglet Lieux ou sur
                  « Générer un circuit complet ».
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#EFECE4]">
                {itineraryPlaces.map((stop, idx) => {
                  const sectorMeta = SECTORS[stop.sector];
                  const leg = routeSummary?.legs[idx];
                  return (
                    <div key={stop.id} className="px-5 py-3.5 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => handleSelectPlace(stop)}
                          className="text-left min-w-0 flex-1"
                        >
                          <div className="flex items-center gap-2 text-[11px] text-[#57534E]">
                            <span className="font-mono font-semibold text-[#1B365D] tabular-nums">
                              Étape {idx + 1}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="inline-flex items-center gap-1 truncate">
                              <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: sectorMeta.color }}
                              />
                              {sectorMeta.shortName}
                            </span>
                          </div>
                          <div className="font-serif text-sm font-semibold text-[#1C1917] truncate mt-0.5">
                            {stop.displayName}
                          </div>
                        </button>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleMoveStop(idx, -1)}
                            disabled={idx === 0}
                            aria-label="Monter cette étape"
                            className="p-1.5 rounded text-[#57534E] hover:bg-[#F3EFE6] disabled:opacity-30"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveStop(idx, 1)}
                            disabled={idx === itineraryPlaces.length - 1}
                            aria-label="Descendre cette étape"
                            className="p-1.5 rounded text-[#57534E] hover:bg-[#F3EFE6] disabled:opacity-30"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleItinerary(stop)}
                            aria-label="Supprimer cette étape"
                            className="p-1.5 rounded text-[#78716C] hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {leg && idx < itineraryPlaces.length - 1 && (
                        <div className="text-[11px] font-mono text-[#57534E] tabular-nums pl-2 border-l border-[#D6CEBE]">
                          Trajet suivant : {formatDistance(leg.distanceMeters)} ·{' '}
                          {formatDuration(leg.durationMillis)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Dominant Anchor: Full-Bleed Google Map */}
      <div className="relative flex-1 min-h-[460px] h-full bg-[#EBE6DF]">
        {hasApiError ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
            <Compass className="w-8 h-8 text-[#9A3412] mb-3" />
            <h2 className="font-serif text-xl font-semibold text-[#1C1917] mb-1">
              Chargement de la carte impossible
            </h2>
            <p className="text-sm text-[#57534E] max-w-md">
              Le service Google Maps Platform n’a pas pu être initialisé. Vérifiez la
              configuration de la clé API ou votre quota.
            </p>
          </div>
        ) : (
          <GoogleMap
            mapId="DEMO_MAP_ID"
            defaultCenter={NORMANDY_CENTER}
            defaultZoom={10}
            mapTypeId={mapTypeId}
            gestureHandling="greedy"
            disableDefaultUI={true}
            zoomControl={true}
            scaleControl={true}
            onClick={() => setSelectedPlaceId(null)}
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            style={{ width: '100%', height: '100%' }}
          >
            {sortedMarkers.map(({ place, baseZIndex }) => {
              const isSelected = selectedPlaceId === place.id;
              const isHovered = hoveredPlaceId === place.id;
              const zIndex = isSelected ? 1000 : isHovered ? 999 : baseZIndex;
              const indexNum = displayIndexById[place.id] ?? 1;
              const indexLabel = String(indexNum).padStart(2, '0');
              const itineraryStep = itineraryIndexById[place.id];

              return (
                <AdvancedMarkerWithRef
                  key={place.id}
                  position={place.position}
                  zIndex={zIndex}
                  indexLabel={indexLabel}
                  accentColor={SECTORS[place.sector].color}
                  isSelected={isSelected}
                  isHovered={isHovered}
                  itineraryStep={itineraryStep}
                  placeTitle={place.displayName}
                  onMarkerClick={() => handleSelectPlace(place)}
                  onMouseEnter={() => setHoveredPlaceId(place.id)}
                  onMouseLeave={() => setHoveredPlaceId(null)}
                />
              );
            })}

            <RouteOverlay
              itinerary={itineraryPlaces}
              onRouteComputed={setRouteSummary}
              onRouteLoadingChange={setRouteLoading}
              onRouteError={setRouteError}
            />
          </GoogleMap>
        )}

        {/* Top-Right Floating Map Controls */}
        {isApiLoaded && !hasApiError && (
          <div className="absolute top-4 right-4 z-10 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSearchInArea}
              disabled={isSearching}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-white/95 backdrop-blur-sm border border-[#D6CEBE] text-[#1C1917] shadow-sm hover:bg-white transition-colors whitespace-nowrap"
            >
              <Search className="w-3.5 h-3.5 text-[#1B365D]" />
              Rechercher dans cette zone
            </button>

            <button
              type="button"
              onClick={handleResetView}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-white/95 backdrop-blur-sm border border-[#D6CEBE] text-[#1C1917] shadow-sm hover:bg-white transition-colors whitespace-nowrap"
            >
              <Compass className="w-3.5 h-3.5 text-[#1B365D]" />
              Toute la côte
            </button>

            <div className="inline-flex items-center p-1 bg-white/95 backdrop-blur-sm border border-[#D6CEBE] rounded-lg shadow-sm">
              <Layers className="w-3.5 h-3.5 text-[#57534E] ml-1.5 mr-1 shrink-0" />
              {(
                [
                  { id: 'roadmap', label: 'Plan' },
                  { id: 'hybrid', label: 'Satellite' },
                  { id: 'terrain', label: 'Relief' },
                ] as const
              ).map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setMapTypeId(mode.id)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                    mapTypeId === mode.id
                      ? 'bg-[#1C1917] text-white'
                      : 'text-[#57534E] hover:text-[#1C1917]'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Selected Place Detail Sheet */}
        {selectedPlace && (
          <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-20 flex justify-end pointer-events-none">
            <div className="pointer-events-auto w-full sm:w-auto">
              <PlaceDetailSheet
                place={selectedPlace}
                isInItinerary={Boolean(itineraryIndexById[selectedPlace.id])}
                onToggleItinerary={handleToggleItinerary}
                onZoomToPlace={(p) => {
                  if (map) {
                    map.panTo(p.position);
                    map.setZoom(15);
                  }
                }}
                onClose={() => setSelectedPlaceId(null)}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
