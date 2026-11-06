import React, { useState } from 'react';
import { LeafletTransitMap } from './LeafletTransitMap';
import { GoogleTransitMap } from './GoogleTransitMap';
import { TransitStop, TransitConnection, RouteCalculationResult } from '../types/transit';
import { Layers, MapPin } from 'lucide-react';

interface UnifiedTransitMapProps {
  stops: TransitStop[];
  connections: TransitConnection[];
  activeRoute?: RouteCalculationResult | null;
  height?: string;
  onSelectStop?: (stopId: string) => void;
  defaultEngine?: 'google' | 'leaflet';
}

export const UnifiedTransitMap: React.FC<UnifiedTransitMapProps> = ({
  stops,
  connections,
  activeRoute,
  height = '480px',
  onSelectStop,
  defaultEngine = 'google'
}) => {
  const hasGoogleKey = Boolean(import.meta.env.VITE_GOOGLE_MAPS_API_KEY);
  const [engine, setEngine] = useState<'google' | 'leaflet'>(hasGoogleKey ? defaultEngine : 'google');

  return (
    <div className="relative group">
      {/* Map Engine Toggle in top-right */}
      <div className="absolute top-3 right-3 z-[1000] flex items-center bg-slate-900/95 backdrop-blur-md p-1 rounded-xl border border-slate-700/80 shadow-xl text-xs">
        <button
          type="button"
          onClick={() => setEngine('google')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
            engine === 'google'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Google Maps</span>
        </button>

        <button
          type="button"
          onClick={() => setEngine('leaflet')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
            engine === 'leaflet'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Leaflet OSM</span>
        </button>
      </div>

      {engine === 'google' ? (
        <GoogleTransitMap
          stops={stops}
          connections={connections}
          activeRoute={activeRoute}
          height={height}
          onSelectStop={onSelectStop}
        />
      ) : (
        <LeafletTransitMap
          stops={stops}
          connections={connections}
          activeRoute={activeRoute}
          height={height}
          onSelectStop={onSelectStop}
        />
      )}
    </div>
  );
};
