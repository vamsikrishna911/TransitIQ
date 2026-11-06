import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { TransitStop, TransitConnection, RouteCalculationResult } from '../types/transit';

interface LeafletTransitMapProps {
  stops: TransitStop[];
  connections: TransitConnection[];
  activeRoute?: RouteCalculationResult | null;
  height?: string;
  onSelectStop?: (stopId: string) => void;
}

export const LeafletTransitMap: React.FC<LeafletTransitMapProps> = ({
  stops,
  connections,
  activeRoute,
  height = '480px',
  onSelectStop
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const connectionsLayerRef = useRef<L.LayerGroup | null>(null);
  const activeRouteLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize Leaflet Map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Default center Vijayawada coordinates
    const vjaCenter: [number, number] = [16.515, 80.65];

    const map = L.map(mapContainerRef.current, {
      center: vjaCenter,
      zoom: 12,
      zoomControl: true,
      scrollWheelZoom: true
    });

    // Free OpenStreetMap Tiles with dark inversion filter
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
      subdomains: ['a', 'b', 'c']
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    connectionsLayerRef.current = L.layerGroup().addTo(map);
    activeRouteLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    // Invalidate size shortly after mount to ensure smooth canvas sizing
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Render Base Network (Stops and Connections)
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current || !connectionsLayerRef.current) return;

    markersLayerRef.current.clearLayers();
    connectionsLayerRef.current.clearLayers();

    const stopMap = new Map<string, TransitStop>();
    stops.forEach(s => stopMap.set(s.id, s));

    // 1. Draw Network Connections
    connections.forEach(edge => {
      const u = stopMap.get(edge.from);
      const v = stopMap.get(edge.to);
      if (u && v) {
        const poly = L.polyline([[u.lat, u.lon], [v.lat, v.lon]], {
          color: '#1e293b',
          weight: 2,
          opacity: 0.7,
          dashArray: '3, 6'
        });
        poly.bindTooltip(
          `<div class="text-xs font-mono"><strong>${u.name}</strong> &harr; <strong>${v.name}</strong><br/>${edge.distanceKm} km · ${edge.timeMin} min · ₹${edge.fareInr}</div>`,
          { sticky: true }
        );
        connectionsLayerRef.current?.addLayer(poly);
      }
    });

    // 2. Draw Stop Markers
    stops.forEach(stop => {
      const circle = L.circleMarker([stop.lat, stop.lon], {
        radius: 6,
        fillColor: '#00e5ff',
        color: '#ffffff',
        weight: 1.5,
        opacity: 0.9,
        fillOpacity: 0.85
      });

      circle.bindTooltip(
        `<div class="text-xs"><strong>${stop.name}</strong><br/><span class="text-cyan-400 font-mono text-[10px]">${stop.type}</span></div>`,
        { direction: 'top', offset: [0, -5] }
      );

      circle.on('click', () => {
        if (onSelectStop) {
          onSelectStop(stop.id);
        }
      });

      markersLayerRef.current?.addLayer(circle);
    });
  }, [stops, connections, onSelectStop]);

  // Render Active Route overlay when calculated
  useEffect(() => {
    if (!mapInstanceRef.current || !activeRouteLayerRef.current) return;

    activeRouteLayerRef.current.clearLayers();

    if (!activeRoute || !activeRoute.success || activeRoute.path.length < 2) return;

    const pathCoords: [number, number][] = activeRoute.path.map(step => [step.lat, step.lon]);

    // Active Path Line (Outer Glow)
    const glowLine = L.polyline(pathCoords, {
      color: '#00e5ff',
      weight: 8,
      opacity: 0.35,
      lineCap: 'round',
      lineJoin: 'round'
    });

    // Active Path Line (Core)
    const coreLine = L.polyline(pathCoords, {
      color: '#38bdf8',
      weight: 4,
      opacity: 1,
      lineCap: 'round',
      lineJoin: 'round'
    });

    activeRouteLayerRef.current.addLayer(glowLine);
    activeRouteLayerRef.current.addLayer(coreLine);

    // Numbered Markers for Route Steps
    activeRoute.path.forEach((step, idx) => {
      const isStart = idx === 0;
      const isEnd = idx === activeRoute.path.length - 1;

      let bgColor = '#0284c7';
      let labelText = `${idx + 1}`;
      let borderColor = '#38bdf8';

      if (isStart) {
        bgColor = '#10b981'; // Green for Origin
        borderColor = '#34d399';
        labelText = 'A';
      } else if (isEnd) {
        bgColor = '#f59e0b'; // Amber for Destination
        borderColor = '#fbbf24';
        labelText = 'B';
      }

      const customIcon = L.divIcon({
        className: 'custom-route-marker',
        html: `
          <div style="
            background: ${bgColor};
            border: 2px solid ${borderColor};
            color: #020617;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: 800;
            box-shadow: 0 0 12px ${borderColor};
          ">
            ${labelText}
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = L.marker([step.lat, step.lon], { icon: customIcon });
      marker.bindPopup(`
        <div class="text-xs">
          <p class="font-bold text-slate-100">${idx + 1}. ${step.name}</p>
          ${isStart ? '<span class="text-emerald-400 font-semibold font-mono text-[10px]">Route Origin</span>' : ''}
          ${isEnd ? '<span class="text-amber-400 font-semibold font-mono text-[10px]">Route Destination</span>' : ''}
          ${step.edgeFromPrev ? `
            <div class="mt-1 pt-1 border-t border-slate-700 font-mono text-[11px] text-slate-300">
              Leg: ${step.edgeFromPrev.distanceKm} km · ${step.edgeFromPrev.timeMin} min · ₹${step.edgeFromPrev.fareInr}
            </div>
          ` : ''}
        </div>
      `);

      activeRouteLayerRef.current?.addLayer(marker);
    });

    // Auto-fit bounds
    mapInstanceRef.current.fitBounds(coreLine.getBounds(), {
      padding: [45, 45],
      maxZoom: 14,
      animate: true
    });
  }, [activeRoute]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-slate-800 shadow-xl bg-[#090d18]">
      <div ref={mapContainerRef} style={{ height, width: '100%' }} />

      {/* Map Legend Overlay */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-800/80 text-[11px] flex items-center gap-4 text-slate-300 pointer-events-auto">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
          <span>Transit Stop</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
          <span>Origin</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
          <span>Destination</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-0.5 bg-cyan-400 inline-block" />
          <span>Trajectory</span>
        </div>
      </div>
    </div>
  );
};
