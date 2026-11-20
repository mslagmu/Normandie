import { useEffect, useRef } from 'react';
import { useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import type { LandingPlace, RouteSummary } from '../types/dday';

interface RouteOverlayProps {
  itinerary: LandingPlace[];
  onRouteComputed: (summary: RouteSummary | null) => void;
  onRouteLoadingChange: (loading: boolean) => void;
  onRouteError: (error: string | null) => void;
}

export function RouteOverlay({
  itinerary,
  onRouteComputed,
  onRouteLoadingChange,
  onRouteError,
}: RouteOverlayProps) {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  useEffect(() => {
    // Clean up existing polylines first
    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];

    if (itinerary.length < 2) {
      onRouteComputed(null);
      onRouteError(null);
      onRouteLoadingChange(false);
      return;
    }

    if (!routesLib || !map) {
      return;
    }

    let cancelled = false;
    onRouteLoadingChange(true);
    onRouteError(null);

    const origin = itinerary[0].position;
    const destination = itinerary[itinerary.length - 1].position;
    const intermediates =
      itinerary.length > 2
        ? itinerary.slice(1, -1).map((stop) => ({
            location: stop.position,
          }))
        : undefined;

    const request: google.maps.routes.ComputeRoutesRequest = {
      origin,
      destination,
      ...(intermediates ? { intermediates } : {}),
      travelMode: 'DRIVING',
      language: 'fr',
      region: 'fr',
      fields: ['path', 'distanceMeters', 'durationMillis', 'viewport', 'legs'],
    };

    routesLib.Route.computeRoutes(request)
      .then(({ routes }) => {
        if (cancelled) return;
        onRouteLoadingChange(false);

        if (!routes || routes.length === 0) {
          onRouteComputed(null);
          onRouteError('Aucun itinéraire routier trouvé entre ces étapes.');
          return;
        }

        const primaryRoute = routes[0];
        const newPolylines = primaryRoute.createPolylines();
        newPolylines.forEach((polyline) => {
          polyline.setOptions({
            strokeColor: '#1B365D',
            strokeWeight: 5,
            strokeOpacity: 0.88,
          });
          polyline.setMap(map);
        });
        polylinesRef.current = newPolylines;

        if (primaryRoute.viewport) {
          map.fitBounds(primaryRoute.viewport, 64);
        }

        const legs = (primaryRoute.legs ?? []).map((leg) => ({
          distanceMeters: leg.distanceMeters ?? 0,
          durationMillis: leg.durationMillis ?? 0,
        }));

        onRouteComputed({
          distanceMeters: primaryRoute.distanceMeters ?? 0,
          durationMillis: primaryRoute.durationMillis ?? 0,
          legs,
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        onRouteLoadingChange(false);
        const message = err instanceof Error ? err.message : String(err);
        if (
          message.includes('RESOURCE_EXHAUSTED') ||
          message.includes('OVER_QUERY_LIMIT') ||
          message.includes('429')
        ) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
        onRouteComputed(null);
        onRouteError(
          'Impossible de calculer cet itinéraire pour le moment. Vérifiez les étapes sélectionnées.'
        );
      });

    return () => {
      cancelled = true;
      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current = [];
    };
  }, [
    itinerary,
    map,
    routesLib,
    onRouteComputed,
    onRouteError,
    onRouteLoadingChange,
  ]);

  return null;
}
