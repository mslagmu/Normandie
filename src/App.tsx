import { useCallback, useEffect, useState } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { LandingMapExplorer } from './components/LandingMapExplorer';
import { SectorsOverview } from './components/SectorsOverview';
import type { SectorId } from './types/dday';

const GOOGLE_MAPS_API_KEY =
  (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) ?? '';

export default function App() {
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [activeSector, setActiveSector] = useState<SectorId>('all');
  const [sidebarTab, setSidebarTab] = useState<'places' | 'itinerary'>('places');
  const [itineraryCount, setItineraryCount] = useState(0);

  useEffect(() => {
    const handleQuota = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuota);
  }, []);

  const handleSelectSectorFromOverview = useCallback(
    (sectorId: Exclude<SectorId, 'all'>) => {
      setActiveSector(sectorId);
      setSidebarTab('places');
      const mapEl = document.getElementById('carte');
      if (mapEl) {
        mapEl.scrollIntoView({ behavior: 'smooth' });
      }
    },
    []
  );

  const handleOpenItinerary = useCallback(() => {
    setSidebarTab('itinerary');
    const mapEl = document.getElementById('carte');
    if (mapEl) {
      mapEl.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F6F1] text-[#1C1917]">
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="h-16 bg-white border-b border-[#E4DFD5] px-6 lg:px-10 flex items-center justify-between gap-8 shrink-0">
        {/* Zone 1: Single-line brand wordmark */}
        <a
          href="#carte"
          className="font-serif text-lg lg:text-xl font-semibold tracking-tight text-[#1C1917] whitespace-nowrap shrink-0"
        >
          Normandie · 6 Juin 1944
        </a>

        {/* Zone 2: 4 single-line nav links */}
        <nav
          aria-label="Navigation principale"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-[#57534E]"
        >
          <a
            href="#carte"
            className="hover:text-[#1C1917] transition-colors whitespace-nowrap shrink-0"
          >
            Carte interactive
          </a>
          <a
            href="#plages"
            className="hover:text-[#1C1917] transition-colors whitespace-nowrap shrink-0"
          >
            Les 5 Plages
          </a>
          <a
            href="#reperes"
            className="hover:text-[#1C1917] transition-colors whitespace-nowrap shrink-0"
          >
            Repères
          </a>
          <a
            href="#apropos"
            className="hover:text-[#1C1917] transition-colors whitespace-nowrap shrink-0"
          >
            À propos
          </a>
        </nav>

        {/* Zone 3: 1 primary CTA */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={handleOpenItinerary}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#1B365D] text-white hover:bg-[#152a49] transition-colors whitespace-nowrap shrink-0 tabular-nums"
          >
            {itineraryCount > 0 ? `Mon circuit (${itineraryCount})` : 'Planifier un circuit'}
          </button>
        </div>
      </header>

      <main className="flex-1">
        {!GOOGLE_MAPS_API_KEY ? (
          <div className="max-w-xl mx-auto my-20 bg-white border border-[#E4DFD5] rounded-xl p-8 text-center space-y-3">
            <h1 className="font-serif text-2xl font-semibold text-[#1C1917]">
              Clé Google Maps Platform requise
            </h1>
            <p className="text-sm text-[#57534E] leading-relaxed">
              La variable d’environnement <code className="font-mono text-xs">VITE_GOOGLE_MAPS_API_KEY</code>{' '}
              n’est pas encore configurée dans cet environnement.
            </p>
          </div>
        ) : (
          <APIProvider
            apiKey={GOOGLE_MAPS_API_KEY}
            libraries={['places', 'routes', 'marker']}
            language="fr"
            region="FR"
          >
            <LandingMapExplorer
              activeSector={activeSector}
              onSectorChange={setActiveSector}
              sidebarTab={sidebarTab}
              onSidebarTabChange={setSidebarTab}
              onItineraryCountChange={setItineraryCount}
            />
          </APIProvider>
        )}

        <SectorsOverview
          activeSector={activeSector}
          onSelectSector={handleSelectSectorFromOverview}
        />
      </main>
    </div>
  );
}
