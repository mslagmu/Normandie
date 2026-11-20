import type { LandingPlace, SectorId, SectorMeta, SiteCategory } from '../types/dday';

export const NORMANDY_CENTER = { lat: 49.355, lng: -0.78 };

export const NORMANDY_COAST_BOUNDS = {
  south: 49.14,
  west: -1.45,
  north: 49.55,
  east: -0.05,
};

export const SECTORS: Record<Exclude<SectorId, 'all'>, SectorMeta> = {
  utah: {
    id: 'utah',
    name: 'Utah Beach',
    shortName: 'Utah',
    forces: 'Forces américaines · 4e division d’infanterie',
    landingTime: '06:30',
    communes: 'Sainte-Marie-du-Mont · Quinéville',
    summary:
      'Plage la plus occidentale du dispositif allié, située dans le Cotentin. Malgré une dérive des péniches de 1 800 mètres vers le sud, le débarquement y fut rapide et relativement peu meurtrier.',
    color: '#1B365D',
    imageUrl: '/src/assets/images/utah_beach_normandy_1795139464530.jpg',
    center: { lat: 49.415, lng: -1.175 },
    zoom: 12,
  },
  pointe_airborne: {
    id: 'pointe_airborne',
    name: 'Pointe du Hoc & Secteur Aéroporté',
    shortName: 'Aéroporté & Hoc',
    forces: 'Rangers US · 82e & 101e Airborne',
    landingTime: '01:30 – 07:10',
    communes: 'Sainte-Mère-Église · Cricqueville-en-Bessin',
    summary:
      'Des parachutages nocturnes autour de Sainte-Mère-Église à l’assaut des falaises de 30 mètres de la Pointe du Hoc par les Rangers du colonel Rudder pour neutraliser les batteries côtières.',
    color: '#3F6212',
    center: { lat: 49.396, lng: -1.12 },
    zoom: 11,
  },
  omaha: {
    id: 'omaha',
    name: 'Omaha Beach',
    shortName: 'Omaha',
    forces: 'Forces américaines · 1re & 29e divisions',
    landingTime: '06:30',
    communes: 'Vierville · Saint-Laurent · Colleville-sur-Mer',
    summary:
      'Surnommée « Bloody Omaha », cette longue plage dominée par des falaises escarpées fut le théâtre des combats les plus âpres du Jour J. Le cimetière américain de Colleville-sur-Mer la surplombe aujourd’hui.',
    color: '#9A3412',
    imageUrl: '/src/assets/images/omaha_beach_normandy_1795139464108.jpg',
    center: { lat: 49.369, lng: -0.87 },
    zoom: 12,
  },
  gold: {
    id: 'gold',
    name: 'Gold Beach & Arromanches',
    shortName: 'Gold',
    forces: 'Forces britanniques · 50e division Northumbrian',
    landingTime: '07:25',
    communes: 'Asnelles · Arromanches-les-Bains · Longues-sur-Mer',
    summary:
      'Secteur central britannique, célèbre pour la batterie allemande de Longues-sur-Mer et surtout pour les vestiges monumentaux du port artificiel Mulberry B encore visibles à marée basse à Arromanches.',
    color: '#854D0E',
    imageUrl: '/src/assets/images/gold_beach_arromanches_1795139464508.jpg',
    center: { lat: 49.342, lng: -0.625 },
    zoom: 12,
  },
  juno: {
    id: 'juno',
    name: 'Juno Beach',
    shortName: 'Juno',
    forces: 'Forces canadiennes · 3e division d’infanterie',
    landingTime: '07:45',
    communes: 'Courseulles-sur-Mer · Bernières · Saint-Aubin',
    summary:
      'Plage confiée aux troupes canadiennes, qui durent affronter une mer agitée et des récifs rocheux avant de pénétrer profondément dans les terres vers Caen dès le soir du 6 juin.',
    color: '#991B1B',
    imageUrl: '/src/assets/images/juno_beach_normandy_1795139464508.jpg',
    center: { lat: 49.336, lng: -0.445 },
    zoom: 12,
  },
  sword: {
    id: 'sword',
    name: 'Sword Beach & Pegasus',
    shortName: 'Sword',
    forces: 'Forces franco-britanniques · Commando Kieffer',
    landingTime: '07:25',
    communes: 'Ouistreham · Hermanville · Bénouville · Caen',
    summary:
      'Extrémité orientale du débarquement où débarquèrent les 177 Français libres du commandant Kieffer, en liaison avec les troupes aéroportées britanniques ayant pris le pont Pegasus dès 00h16.',
    color: '#3730A3',
    imageUrl: '/src/assets/images/sword_beach_normandy_1795139464543.jpg',
    center: { lat: 49.28, lng: -0.27 },
    zoom: 11,
  },
};

export const SECTOR_ORDER: Array<Exclude<SectorId, 'all'>> = [
  'utah',
  'pointe_airborne',
  'omaha',
  'gold',
  'juno',
  'sword',
];

export const CATEGORY_LABELS: Record<SiteCategory, string> = {
  all: 'Tous les sites',
  beach: 'Plages & Sites',
  museum: 'Musées',
  memorial: 'Mémoriaux & Cimetières',
  battery: 'Batteries & Bunkers',
};

/**
 * Three geographically partitioned Places API (New) text queries covering the full
 * Normandy landing coast from West (Utah / Cotentin) to East (Sword / Caen).
 */
export const COASTAL_DISCOVERY_QUERIES = [
  {
    textQuery: 'Utah Beach Sainte-Mère-Église Pointe du Hoc musée mémorial cimetière Normandie',
    locationRestriction: {
      south: 49.22,
      west: -1.45,
      north: 49.55,
      east: -0.94,
    },
  },
  {
    textQuery: 'Omaha Beach Colleville-sur-Mer cimetière américain batterie Longues-sur-Mer musée',
    locationRestriction: {
      south: 49.24,
      west: -0.96,
      north: 49.45,
      east: -0.64,
    },
  },
  {
    textQuery: 'Arromanches Gold Beach Juno Beach Sword Beach Pegasus Bridge Mémorial de Caen',
    locationRestriction: {
      south: 49.15,
      west: -0.66,
      north: 49.42,
      east: -0.05,
    },
  },
];

export function inferSectorFromPlace(
  lat: number,
  lng: number,
  displayName: string
): Exclude<SectorId, 'all'> {
  const lower = displayName.toLowerCase();

  if (lower.includes('utah') || lower.includes('azevelle') || lower.includes('crisbecq')) {
    return 'utah';
  }
  if (
    lower.includes('pointe du hoc') ||
    lower.includes('sainte-mère') ||
    lower.includes('sainte mère') ||
    lower.includes('airborne') ||
    lower.includes('carentan') ||
    lower.includes('dead man') ||
    lower.includes('la cambe')
  ) {
    return 'pointe_airborne';
  }
  if (
    lower.includes('omaha') ||
    lower.includes('colleville') ||
    lower.includes('vierville') ||
    lower.includes('saint-laurent') ||
    lower.includes('overlord')
  ) {
    return 'omaha';
  }
  if (
    lower.includes('arromanches') ||
    lower.includes('gold') ||
    lower.includes('longues') ||
    lower.includes('mulberry') ||
    lower.includes('bayeux') ||
    lower.includes('port-en-bessin')
  ) {
    return 'gold';
  }
  if (
    lower.includes('juno') ||
    lower.includes('courseulles') ||
    lower.includes('bernières') ||
    lower.includes('graye') ||
    lower.includes('beny') ||
    lower.includes('bény')
  ) {
    return 'juno';
  }
  if (
    lower.includes('sword') ||
    lower.includes('pegasus') ||
    lower.includes('ouistreham') ||
    lower.includes('merville') ||
    lower.includes('caen') ||
    lower.includes('ranville') ||
    lower.includes('hillman') ||
    lower.includes('kieffer')
  ) {
    return 'sword';
  }

  // Fallback purely by geographic longitude West -> East along the Normandy coast
  if (lng < -1.14) return lat > 49.38 ? 'utah' : 'pointe_airborne';
  if (lng < -0.96) return 'pointe_airborne';
  if (lng < -0.73) return 'omaha';
  if (lng < -0.53) return 'gold';
  if (lng < -0.36) return 'juno';
  return 'sword';
}

export function inferCategoryFromPlace(
  types: string[],
  displayName: string
): Exclude<SiteCategory, 'all'> {
  const lower = displayName.toLowerCase();

  if (
    lower.includes('batterie') ||
    lower.includes('battery') ||
    lower.includes('bunker') ||
    lower.includes('blockhaus') ||
    lower.includes('wn62') ||
    lower.includes('hillman') ||
    lower.includes('pointe du hoc')
  ) {
    return 'battery';
  }
  if (
    types.includes('museum') ||
    lower.includes('musée') ||
    lower.includes('museum') ||
    lower.includes('centre juno') ||
    lower.includes('overlord') ||
    lower.includes('mémorial de caen') ||
    lower.includes('360')
  ) {
    return 'museum';
  }
  if (
    types.includes('cemetery') ||
    lower.includes('cimetière') ||
    lower.includes('cemetery') ||
    lower.includes('mémorial') ||
    lower.includes('memorial') ||
    lower.includes('monument') ||
    lower.includes('statue')
  ) {
    return 'memorial';
  }
  return 'beach';
}

export function normalizeGooglePlace(
  place: google.maps.places.Place
): LandingPlace | null {
  if (!place.id || !place.location || !place.displayName) {
    return null;
  }

  const lat = place.location.lat();
  const lng = place.location.lng();
  const displayName = place.displayName;
  const types = place.types ?? [];

  let photoUrl: string | undefined;
  if (place.photos && place.photos.length > 0) {
    try {
      photoUrl = place.photos[0].getURI({ maxWidth: 800, maxHeight: 500 });
    } catch {
      photoUrl = undefined;
    }
  }

  return {
    id: place.id,
    displayName,
    position: { lat, lng },
    formattedAddress: place.formattedAddress ?? undefined,
    rating: typeof place.rating === 'number' ? place.rating : undefined,
    userRatingCount:
      typeof place.userRatingCount === 'number' ? place.userRatingCount : undefined,
    editorialSummary: place.editorialSummary ?? undefined,
    primaryTypeDisplayName: place.primaryTypeDisplayName ?? undefined,
    types,
    photoUrl,
    googleMapsURI: place.googleMapsURI ?? undefined,
    websiteURI: place.websiteURI ?? undefined,
    weekdayDescriptions: place.regularOpeningHours?.weekdayDescriptions ?? undefined,
    sector: inferSectorFromPlace(lat, lng, displayName),
    category: inferCategoryFromPlace(types, displayName),
  };
}
