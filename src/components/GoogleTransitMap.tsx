// Source: Google Maps Platform Code Assist
import React, { useEffect, useRef, useState } from 'react';
import {
  APIProvider,
  Map as GoogleMap,
  AdvancedMarker,
  Pin,
  useMap
} from '@vis.gl/react-google-maps';
import { RotateCcw, MapPin } from 'lucide-react';
import { TransitStop, TransitConnection, RouteCalculationResult } from '../types/transit';
import { interpolateGeoPath, easeOutCubic } from '../utils/geo';

interface GoogleTransitMapProps {
  stops: TransitStop[];
  connections: TransitConnection[];
  activeRoute?: RouteCalculationResult | null;
  height?: string;
  onSelectStop?: (stopId: string) => void;
  apiKey?: string;
}

// Internal component inside APIProvider that has access to useMap()
const AnimatedGoogleRouteLayer: React.FC<{
  stops: TransitStop[];
  connections: TransitConnection[];
  activeRoute?: RouteCalculationResult | null;
  replayKey: number;
  onDrawingStateChange: (drawing: boolean) => void;
  onSelectStop?: (stopId: string) => void;
}> = ({ stops, connections, activeRoute, replayKey, onDrawingStateChange, onSelectStop }) => {
  const map = useMap();
  const connectionPolylinesRef = useRef<google.maps.Polyline[]>([]);
  const ghostPolylineRef = useRef<google.maps.Polyline | null>(null);
  const glowPolylineRef = useRef<google.maps.Polyline | null>(null);
  const corePolylineRef = useRef<google.maps.Polyline | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Render Network Connections
  useEffect(() => {
    if (!map) return;

    // Clear previous network lines
    connectionPolylinesRef.current.forEach(p => p.setMap(null));
    connectionPolylinesRef.current = [];

    const stopLookup: Record<string, TransitStop> = {};
    stops.forEach(s => {
      stopLookup[s.id] = s;
    });

    connections.forEach(edge => {
      const u = stopLookup[edge.from];
      const v = stopLookup[edge.to];
      if (u && v) {
        const poly = new google.maps.Polyline({
          path: [
            { lat: u.lat, lng: u.lon },
            { lat: v.lat, lng: v.lon }
          ],
          strokeColor: '#334155',
          strokeOpacity: 0.6,
          strokeWeight: 2,
          map
        });
        connectionPolylinesRef.current.push(poly);
      }
    });

    return () => {
      connectionPolylinesRef.current.forEach(p => p.setMap(null));
      connectionPolylinesRef.current = [];
    };
  }, [map, stops, connections]);

  // Animate Active Calculated Route
  useEffect(() => {
    if (!map) return;

    // Clean up previous animations & polylines
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (ghostPolylineRef.current) {
      ghostPolylineRef.current.setMap(null);
      ghostPolylineRef.current = null;
    }
    if (glowPolylineRef.current) {
      glowPolylineRef.current.setMap(null);
      glowPolylineRef.current = null;
    }
    if (corePolylineRef.current) {
      corePolylineRef.current.setMap(null);
      corePolylineRef.current = null;
    }

    if (!activeRoute || !activeRoute.success || activeRoute.path.length < 2) {
      onDrawingStateChange(false);
      return;
    }

    const pathLatLngs = activeRoute.path.map(step => ({ lat: step.lat, lng: step.lon }));
    const rawCoords: [number, number][] = activeRoute.path.map(step => [step.lat, step.lon]);

    // Fit map bounds to encompass the full journey
    const bounds = new google.maps.LatLngBounds();
    pathLatLngs.forEach(coord => bounds.extend(coord));
    map.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });

    // Ghost dashed guide line
    ghostPolylineRef.current = new google.maps.Polyline({
      path: pathLatLngs,
      strokeColor: '#0284c7',
      strokeOpacity: 0.25,
      strokeWeight: 3,
      map
    });

    // Interpolate points for smooth 60fps path drawing
    const interpolated = interpolateGeoPath(rawCoords, 140);
    const startPoint = { lat: interpolated[0][0], lng: interpolated[0][1] };

    // Outer glow polyline
    glowPolylineRef.current = new google.maps.Polyline({
      path: [startPoint],
      strokeColor: '#00e5ff',
      strokeOpacity: 0.5,
      strokeWeight: 8,
      map
    });

    // Core sharp polyline
    corePolylineRef.current = new google.maps.Polyline({
      path: [startPoint],
      strokeColor: '#38bdf8',
      strokeOpacity: 1,
      strokeWeight: 4,
      map
    });

    // Animation loop using requestAnimationFrame
    const ANIMATION_DURATION_MS = 1400;
    let startTime: number | null = null;
    onDrawingStateChange(true);

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(1, elapsed / ANIMATION_DURATION_MS);
      const eased = easeOutCubic(progress);

      const targetIndex = Math.min(
        interpolated.length - 1,
        Math.max(1, Math.floor(eased * (interpolated.length - 1)))
      );

      const currentPoints = interpolated.slice(0, targetIndex + 1).map(pt => ({
        lat: pt[0],
        lng: pt[1]
      }));

      if (glowPolylineRef.current) glowPolylineRef.current.setPath(currentPoints);
      if (corePolylineRef.current) corePolylineRef.current.setPath(currentPoints);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        if (glowPolylineRef.current) glowPolylineRef.current.setPath(pathLatLngs);
        if (corePolylineRef.current) corePolylineRef.current.setPath(pathLatLngs);
        onDrawingStateChange(false);
        animFrameRef.current = null;
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      if (ghostPolylineRef.current) ghostPolylineRef.current.setMap(null);
      if (glowPolylineRef.current) glowPolylineRef.current.setMap(null);
      if (corePolylineRef.current) corePolylineRef.current.setMap(null);
    };
  }, [map, activeRoute, replayKey]);

  return (
    <>
      {/* Advanced Markers for All Stops */}
      {stops.map(stop => {
        const isRouteOrigin = activeRoute?.path[0]?.id === stop.id;
        const isRouteDest = activeRoute?.path[activeRoute.path.length - 1]?.id === stop.id;
        const isWayPoint = activeRoute?.path.some((s, idx) => s.id === stop.id && idx > 0 && idx < activeRoute.path.length - 1);

        let background = '#0891b2';
        let glyphColor = '#ffffff';
        let borderColor = '#38bdf8';
        let scale = 0.9;

        if (isRouteOrigin) {
          background = '#10b981';
          borderColor = '#34d399';
          scale = 1.15;
        } else if (isRouteDest) {
          background = '#f59e0b';
          borderColor = '#fbbf24';
          scale = 1.15;
        } else if (isWayPoint) {
          background = '#0284c7';
          borderColor = '#38bdf8';
          scale = 1.05;
        }

        return (
          <AdvancedMarker
            key={stop.id}
            position={{ lat: stop.lat, lng: stop.lon }}
            title={`${stop.name} (${stop.id})`}
            onClick={() => onSelectStop && onSelectStop(stop.id)}
          >
            <Pin
              background={background}
              borderColor={borderColor}
              glyphColor={glyphColor}
              scale={scale}
            />
          </AdvancedMarker>
        );
      })}
    </>
  );
};

export const GoogleTransitMap: React.FC<GoogleTransitMapProps> = ({
  stops,
  connections,
  activeRoute,
  height = '480px',
  onSelectStop,
  apiKey
}) => {
  const [replayKey, setReplayKey] = useState<number>(0);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);

  // Resolved API key from props or Vite client env
  const mapsApiKey = apiKey || import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  // Default Vijayawada center
  const defaultCenter = { lat: 16.515, lng: 80.65 };

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-slate-800 shadow-xl bg-[#090d18]">
      <APIProvider apiKey={mapsApiKey}>
        <div style={{ height, width: '100%' }}>
          <GoogleMap
            defaultCenter={defaultCenter}
            defaultZoom={12}
            gestureHandling="greedy"
            disableDefaultUI={false}
            mapId="DEMO_MAP_ID"
            colorScheme="DARK"
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            style={{ width: '100%', height: '100%' }}
          >
            <AnimatedGoogleRouteLayer
              stops={stops}
              connections={connections}
              activeRoute={activeRoute}
              replayKey={replayKey}
              onDrawingStateChange={setIsDrawing}
              onSelectStop={onSelectStop}
            />
          </GoogleMap>
        </div>
      </APIProvider>

      {/* Control Overlay & Legend */}
      <div className="absolute bottom-3 left-3 right-3 sm:right-auto z-[1000] bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-800/80 text-[11px] flex flex-wrap items-center justify-between sm:justify-start gap-3 text-slate-300 pointer-events-auto shadow-lg">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
          <span>Stop</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
          <span>Origin (A)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
          <span>Destination (B)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-1 bg-cyan-400 rounded inline-block" />
          <span>Google Polyline</span>
        </div>

        {activeRoute && activeRoute.success && (
          <button
            onClick={() => setReplayKey(k => k + 1)}
            disabled={isDrawing}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700/60 text-cyan-300 font-semibold text-[11px] transition-all disabled:opacity-50 cursor-pointer shadow-sm ml-auto sm:ml-2"
            title="Replay animated path drawing on Google Maps"
          >
            <RotateCcw className={`w-3 h-3 ${isDrawing ? 'animate-spin text-cyan-400' : ''}`} />
            <span>{isDrawing ? 'Tracing...' : 'Replay Animation'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
