import React from 'react';
import {
  AdvancedMarker,
  type AdvancedMarkerProps,
  useAdvancedMarkerRef,
} from '@vis.gl/react-google-maps';

type AdvancedMarkerInstance = google.maps.marker.AdvancedMarkerElement;

interface AdvancedMarkerWithRefProps extends Omit<AdvancedMarkerProps, 'onClick'> {
  indexLabel: string;
  accentColor: string;
  isSelected: boolean;
  isHovered: boolean;
  itineraryStep?: number;
  placeTitle: string;
  onMarkerClick: (marker: AdvancedMarkerInstance) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export const AdvancedMarkerWithRef: React.FC<AdvancedMarkerWithRefProps> = ({
  indexLabel,
  accentColor,
  isSelected,
  isHovered,
  itineraryStep,
  placeTitle,
  onMarkerClick,
  onMouseEnter,
  onMouseLeave,
  ...advancedMarkerProps
}) => {
  const [markerRef, marker] = useAdvancedMarkerRef();

  const active = isSelected || isHovered;
  const inItinerary = typeof itineraryStep === 'number';

  return (
    <AdvancedMarker
      ref={markerRef}
      title={placeTitle}
      onClick={() => {
        if (marker) {
          onMarkerClick(marker);
        }
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      {...advancedMarkerProps}
    >
      <div
        className="group relative flex flex-col items-center cursor-pointer select-none transition-transform duration-150"
        style={{
          transform: active ? 'scale(1.14) translateY(-2px)' : 'scale(1)',
        }}
      >
        <div
          className="flex items-center justify-center rounded-md px-2 py-1 font-mono text-[11px] font-medium tabular-nums shadow-md transition-colors duration-150 border"
          style={{
            backgroundColor: isSelected
              ? '#1C1917'
              : inItinerary
              ? '#1B365D'
              : '#FFFFFF',
            color: isSelected || inItinerary ? '#FFFFFF' : '#1C1917',
            borderColor: isSelected
              ? '#1C1917'
              : inItinerary
              ? '#1B365D'
              : accentColor,
            boxShadow: active
              ? '0 8px 18px rgba(28, 25, 23, 0.28)'
              : '0 2px 6px rgba(28, 25, 23, 0.18)',
          }}
        >
          <span
            className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 shrink-0"
            style={{
              backgroundColor: isSelected || inItinerary ? '#F8F6F1' : accentColor,
            }}
          />
          <span>{inItinerary ? `É${itineraryStep}` : indexLabel}</span>
        </div>
        <div
          className="w-2 h-2 rotate-45 -mt-1 border-r border-b"
          style={{
            backgroundColor: isSelected
              ? '#1C1917'
              : inItinerary
              ? '#1B365D'
              : '#FFFFFF',
            borderColor: isSelected
              ? '#1C1917'
              : inItinerary
              ? '#1B365D'
              : accentColor,
          }}
        />
      </div>
    </AdvancedMarker>
  );
};
