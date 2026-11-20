import React from 'react';
import { ArrowUpRight, Compass } from 'lucide-react';
import { SECTORS } from '../data/sectors';
import type { SectorId } from '../types/dday';

interface SectorsOverviewProps {
  activeSector: SectorId;
  onSelectSector: (sectorId: Exclude<SectorId, 'all'>) => void;
}

const BEACH_KEYS: Array<Exclude<SectorId, 'all'>> = [
  'utah',
  'omaha',
  'gold',
  'juno',
  'sword',
];

const CHRONOLOGY_STEPS = [
  {
    index: '01.',
    time: '00:16 – 02:30',
    title: 'Assaut aéroporté nocturne',
    detail:
      'La 6e division aéroportée britannique sécurise Pegasus Bridge à Bénouville, tandis que les 82e et 101e Airborne américaines sautent sur le Cotentin autour de Sainte-Mère-Église.',
  },
  {
    index: '02.',
    time: '06:30',
    title: 'Premières vagues à l’Ouest',
    detail:
      'Les troupes américaines abordent Utah Beach et affrontent les défenses escarpées d’Omaha Beach. À 07h10, les Rangers escaladent les falaises de la Pointe du Hoc.',
  },
  {
    index: '03.',
    time: '07:25 – 07:45',
    title: 'Secteurs anglo-canadiens',
    detail:
      'Les forces britanniques, canadiennes et les 177 Français libres du commandant Kieffer débarquent à Gold, Juno et Sword, ouvrant la voie vers Bayeux et Caen.',
  },
  {
    index: '04.',
    time: '7 – 20 juin 1944',
    title: 'Le port artificiel d’Arromanches',
    detail:
      'Des centaines de caissons en béton Phoenix sont remorqués à travers la Manche pour assembler Mulberry B, permettant le ravitaillement continu des armées alliées.',
  },
];

export const SectorsOverview: React.FC<SectorsOverviewProps> = ({
  activeSector,
  onSelectSector,
}) => {
  return (
    <div className="bg-[#F8F6F1] border-t border-[#E4DFD5]">
      {/* Section 1: Les 5 Plages du Débarquement */}
      <section
        id="plages"
        className="max-w-[1360px] mx-auto px-6 lg:px-10 py-16 lg:py-20"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[#E4DFD5]">
          <div className="max-w-2xl">
            <p className="text-xs font-sans uppercase tracking-widest text-[#57534E] mb-2">
              Secteurs côtiers · D’Ouest en Est (80 km de littoral)
            </p>
            <h2 className="font-serif text-3xl lg:text-4xl font-semibold text-[#1C1917] leading-tight [text-wrap:balance]">
              Les cinq plages du 6 juin 1944
            </h2>
          </div>
          <p className="text-sm text-[#57534E] max-w-md leading-relaxed">
            Sélectionnez un secteur pour filtrer les musées, batteries côtières et
            mémoriaux correspondants directement sur la carte interactive.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
          {BEACH_KEYS.map((key, idx) => {
            const sector = SECTORS[key];
            const isSelected = activeSector === key;
            return (
              <article
                key={sector.id}
                className={`group bg-white border rounded-xl overflow-hidden flex flex-col transition-colors duration-200 ${
                  isSelected
                    ? 'border-[#1B365D] ring-1 ring-[#1B365D]'
                    : 'border-[#E4DFD5] hover:border-[#C6BEB0]'
                }`}
              >
                <div className="relative aspect-video w-full bg-[#EBE6DF] overflow-hidden">
                  {sector.imageUrl ? (
                    <img
                      src={sector.imageUrl}
                      alt={sector.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Compass className="w-8 h-8 text-[#78716C]" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white text-xs">
                    <span className="font-mono tabular-nums tracking-wide">
                      0{idx + 1} · Heure H {sector.landingTime}
                    </span>
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full border border-white/80"
                      style={{ backgroundColor: sector.color }}
                    />
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <div className="text-xs text-[#57534E] mb-1.5">
                    {sector.forces}
                  </div>
                  <h3 className="font-serif text-xl font-semibold text-[#1C1917] mb-2">
                    {sector.name}
                  </h3>
                  <p className="text-xs text-[#78716C] mb-3 font-medium">
                    {sector.communes}
                  </p>
                  <p className="text-sm text-[#44403C] leading-relaxed flex-1">
                    {sector.summary}
                  </p>

                  <div className="mt-5 pt-4 border-t border-[#F0ECE4]">
                    <button
                      type="button"
                      onClick={() => onSelectSector(sector.id)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1B365D] hover:text-[#9A3412] transition-colors whitespace-nowrap"
                    >
                      <span>Explorer {sector.shortName} sur la carte</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}

          {/* 6th card: Pointe du Hoc & Secteur Aéroporté */}
          <article
            className={`bg-white border rounded-xl p-6 flex flex-col justify-between transition-colors duration-200 ${
              activeSector === 'pointe_airborne'
                ? 'border-[#1B365D] ring-1 ring-[#1B365D]'
                : 'border-[#E4DFD5] hover:border-[#C6BEB0]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between text-xs text-[#57534E] mb-3">
                <span className="font-mono tabular-nums">
                  06 · {SECTORS.pointe_airborne.landingTime}
                </span>
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: SECTORS.pointe_airborne.color }}
                />
              </div>
              <div className="text-xs text-[#57534E] mb-1.5">
                {SECTORS.pointe_airborne.forces}
              </div>
              <h3 className="font-serif text-xl font-semibold text-[#1C1917] mb-2">
                {SECTORS.pointe_airborne.name}
              </h3>
              <p className="text-xs text-[#78716C] mb-3 font-medium">
                {SECTORS.pointe_airborne.communes}
              </p>
              <p className="text-sm text-[#44403C] leading-relaxed">
                {SECTORS.pointe_airborne.summary}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-[#F0ECE4]">
              <button
                type="button"
                onClick={() => onSelectSector('pointe_airborne')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1B365D] hover:text-[#9A3412] transition-colors whitespace-nowrap"
              >
                <span>Explorer ce secteur sur la carte</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </article>
        </div>
      </section>

      {/* Section 2: Repères historiques */}
      <section
        id="reperes"
        className="border-t border-[#E4DFD5] bg-white"
      >
        <div className="max-w-[1360px] mx-auto px-6 lg:px-10 py-16">
          <div className="max-w-2xl mb-10">
            <p className="text-xs uppercase tracking-widest text-[#57534E] mb-2">
              Chronologie & Repères
            </p>
            <h2 className="font-serif text-3xl font-semibold text-[#1C1917] [text-wrap:balance]">
              Comprendre le littoral avant de partir
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {CHRONOLOGY_STEPS.map((item) => (
              <div
                key={item.index}
                className="border-t border-[#E4DFD5] pt-5 flex flex-col"
              >
                <div className="flex items-baseline justify-between gap-2 mb-2">
                  <span className="font-serif text-lg font-semibold text-[#1B365D]">
                    {item.index}
                  </span>
                  <span className="font-mono text-xs text-[#57534E] tabular-nums">
                    {item.time}
                  </span>
                </div>
                <h3 className="font-serif text-lg font-semibold text-[#1C1917] mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-[#57534E] leading-relaxed">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Editorial Footer */}
      <footer
        id="apropos"
        className="border-t border-[#E4DFD5] bg-[#F8F6F1] py-8 px-6 lg:px-10"
      >
        <div className="max-w-[1360px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#57534E]">
          <div>
            <span className="font-serif font-semibold text-[#1C1917]">
              Normandie · 6 Juin 1944
            </span>
            <span className="mx-2" aria-hidden="true">
              ·
            </span>
            <span>
              Données cartographiques, horaires et lieux fournis en direct via Google Maps Platform.
            </span>
          </div>
          <a
            href="#carte"
            className="text-[#1B365D] font-medium hover:underline whitespace-nowrap shrink-0"
          >
            Revenir à la carte interactive
          </a>
        </div>
      </footer>
    </div>
  );
};
