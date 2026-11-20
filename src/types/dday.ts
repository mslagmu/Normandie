export type SectorId =
  | 'all'
  | 'utah'
  | 'pointe_airborne'
  | 'omaha'
  | 'gold'
  | 'juno'
  | 'sword';

export type SiteCategory = 'all' | 'beach' | 'museum' | 'memorial' | 'battery';

export interface SectorMeta {
  id: Exclude<SectorId, 'all'>;
  name: string;
  shortName: string;
  forces: string;
  landingTime: string;
  communes: string;
  summary: string;
  color: string;
  imageUrl?: string;
  center: { lat: number; lng: number };
  zoom: number;
}

export interface LandingPlace {
  id: string;
  displayName: string;
  position: { lat: number; lng: number };
  formattedAddress?: string;
  rating?: number;
  userRatingCount?: number;
  editorialSummary?: string;
  primaryTypeDisplayName?: string;
  types: string[];
  photoUrl?: string;
  googleMapsURI?: string;
  websiteURI?: string;
  weekdayDescriptions?: string[];
  sector: Exclude<SectorId, 'all'>;
  category: Exclude<SiteCategory, 'all'>;
}

export interface RouteLegSummary {
  distanceMeters: number;
  durationMillis: number;
}

export interface RouteSummary {
  distanceMeters: number;
  durationMillis: number;
  legs: RouteLegSummary[];
}
