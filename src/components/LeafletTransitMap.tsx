import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { RotateCcw } from 'lucide-react';
import { TransitStop, TransitConnection, RouteCalculationResult } from '../types/transit';
import { interpolateGeoPath, easeOutCubic } from '../utils/geo';

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
  const animFrameRef = useRef<number | null>(null);

  const [replayKey, setReplayKey] = useState<number>(0);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);

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
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
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

  // Smoothly Animate Active Route polyline when calculated or replayed
  useEffect(() => {
    if (!mapInstanceRef.current || !activeRouteLayerRef.current) return;

    // Cancel any ongoing drawing animation
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    activeRouteLayerRef.current.clearLayers();

    if (!activeRoute || !activeRoute.success || activeRoute.path.length < 2) {
      setIsDrawing(false);
      return;
    }

    const pathCoords: [number, number][] = activeRoute.path.map(step => [step.lat, step.lon]);

    // 1. Ghost Polyline (subtle background dashed trajectory)
    const ghostLine = L.polyline(pathCoords, {
      color: '#0284c7',
      weight: 3,
      opacity: 0.3,
      dashArray: '4, 6',
      lineCap: 'round',
      lineJoin: 'round'
    });
    activeRouteLayerRef.current.addLayer(ghostLine);

    // 2. Auto-fit bounds immediately so the user sees the whole corridor
    mapInstanceRef.current.fitBounds(ghostLine.getBounds(), {
      padding: [50, 50],
      maxZoom: 14,
      animate: true
    });

    // Helper: create custom stop badge marker
    const createStepMarker = (step: any, idx: number, isLast: boolean) => {
      const isStart = idx === 0;
      let bgColor = '#0284c7';
      let labelText = `${idx + 1}`;
      let borderColor = '#38bdf8';

      if (isStart) {
        bgColor = '#10b981'; // Green for Origin
        borderColor = '#34d399';
        labelText = 'A';
      } else if (isLast) {
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
            width: 26px;
            height: 26px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: 800;
            box-shadow: 0 0 14px ${borderColor};
            transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          ">
            ${labelText}
          </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      });

      const marker = L.marker([step.lat, step.lon], { icon: customIcon });
      marker.bindPopup(`
        <div class="text-xs">
          <p class="font-bold text-slate-100">${idx + 1}. ${step.name}</p>
          ${isStart ? '<span class="text-emerald-400 font-semibold font-mono text-[10px]">Route Origin</span>' : ''}
          ${isLast ? '<span class="text-amber-400 font-semibold font-mono text-[10px]">Route Destination</span>' : ''}
          ${step.edgeFromPrev ? `
            <div class="mt-1 pt-1 border-t border-slate-700 font-mono text-[11px] text-slate-300">
              Leg: ${step.edgeFromPrev.distanceKm} km · ${step.edgeFromPrev.timeMin} min · ₹${step.edgeFromPrev.fareInr}
            </div>
          ` : ''}
        </div>
      `);
      return marker;
    };

    // 3. Add Origin Marker (A) right at the start
    const originMarker = createStepMarker(activeRoute.path[0], 0, false);
    activeRouteLayerRef.current.addLayer(originMarker);

    // 4. Generate dense interpolated points for 60fps smooth path advancement
    const interpolated = interpolateGeoPath(pathCoords, 140);

    // 5. Active animated lines (Glow + Core)
    const initialPoint = [interpolated[0][0], interpolated[0][1]] as [number, number];

    const glowLine = L.polyline([initialPoint], {
      color: '#00e5ff',
      weight: 9,
      opacity: 0.45,
      lineCap: 'round',
      lineJoin: 'round'
    });

    const coreLine = L.polyline([initialPoint], {
      color: '#38bdf8',
      weight: 4,
      opacity: 1,
      lineCap: 'round',
      lineJoin: 'round'
    });

    activeRouteLayerRef.current.addLayer(glowLine);
    activeRouteLayerRef.current.addLayer(coreLine);

    // 6. Leading Animated Pulse Marker (the animated drawing head)
    const headIcon = L.divIcon({
      className: 'custom-head-marker-container',
      html: `
        <div style="position: relative; width: 24px; height: 24px;">
          <div class="route-head-marker" style="
            width: 16px;
            height: 16px;
            background: #00e5ff;
            border: 2px solid #ffffff;
            border-radius: 50%;
            position: absolute;
            top: 4px;
            left: 4px;
          "></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const headMarker = L.marker(initialPoint, { icon: headIcon });
    activeRouteLayerRef.current.addLayer(headMarker);

    // Track added intermediate stop markers
    const addedMarkers = new Set<number>([0]);
    const intermediateStops = activeRoute.path.map((step, idx) => ({
      step,
      idx,
      lat: step.lat,
      lon: step.lon,
      isEnd: idx === activeRoute.path.length - 1
    }));

    // 7. Execute requestAnimationFrame loop
    const ANIMATION_DURATION_MS = 1400; // 1.4s smooth glide
    let startTime: number | null = null;
    setIsDrawing(true);

    const animateFrame = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const linearProgress = Math.min(1, elapsed / ANIMATION_DURATION_MS);
      const easedProgress = easeOutCubic(linearProgress);

      const targetIndex = Math.min(
        interpolated.length - 1,
        Math.max(1, Math.floor(easedProgress * (interpolated.length - 1)))
      );

      const currentPoints = interpolated.slice(0, targetIndex + 1);

      glowLine.setLatLngs(currentPoints);
      coreLine.setLatLngs(currentPoints);

      const currentHeadPoint = interpolated[targetIndex];
      headMarker.setLatLng(currentHeadPoint);

      // Check if animation has reached any intermediate stop
      for (const item of intermediateStops) {
        if (!item.isEnd && !addedMarkers.has(item.idx)) {
          // Check proximity in coordinate distance
          const dLat = item.lat - currentHeadPoint[0];
          const dLon = item.lon - currentHeadPoint[1];
          const dist = Math.sqrt(dLat * dLat + dLon * dLon);
          if (dist < 0.005 || linearProgress >= (item.idx / (activeRoute.path.length - 1))) {
            const m = createStepMarker(item.step, item.idx, false);
            activeRouteLayerRef.current?.addLayer(m);
            addedMarkers.add(item.idx);
          }
        }
      }

      if (linearProgress < 1) {
        animFrameRef.current = requestAnimationFrame(animateFrame);
      } else {
        // Animation Complete:
        // Set exact path coordinates
        glowLine.setLatLngs(pathCoords);
        coreLine.setLatLngs(pathCoords);

        // Remove the pulse head marker
        if (activeRouteLayerRef.current?.hasLayer(headMarker)) {
          activeRouteLayerRef.current.removeLayer(headMarker);
        }

        // Add any remaining intermediate markers
        for (const item of intermediateStops) {
          if (!item.isEnd && !addedMarkers.has(item.idx)) {
            const m = createStepMarker(item.step, item.idx, false);
            activeRouteLayerRef.current?.addLayer(m);
            addedMarkers.add(item.idx);
          }
        }

        // Add destination marker (B)
        const lastIdx = activeRoute.path.length - 1;
        const destMarker = createStepMarker(activeRoute.path[lastIdx], lastIdx, true);
        activeRouteLayerRef.current?.addLayer(destMarker);

        setIsDrawing(false);
        animFrameRef.current = null;
      }
    };

    animFrameRef.current = requestAnimationFrame(animateFrame);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [activeRoute, replayKey]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-slate-800 shadow-xl bg-[#090d18]">
      <div ref={mapContainerRef} style={{ height, width: '100%' }} />

      {/* Map Control & Legend Overlay */}
      <div className="absolute bottom-3 left-3 right-3 sm:right-auto z-[1000] bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-800/80 text-[11px] flex flex-wrap items-center justify-between sm:justify-start gap-3.5 text-slate-300 pointer-events-auto shadow-lg">
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
          <span>Trajectory</span>
        </div>

        {/* Replay Animation Control */}
        {activeRoute && activeRoute.success && (
          <button
            onClick={() => setReplayKey(k => k + 1)}
            disabled={isDrawing}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700/60 text-cyan-300 font-semibold text-[11px] transition-all disabled:opacity-50 cursor-pointer shadow-sm ml-auto sm:ml-2"
            title="Replay animated path drawing"
          >
            <RotateCcw className={`w-3 h-3 ${isDrawing ? 'animate-spin text-cyan-400' : ''}`} />
            <span>{isDrawing ? 'Tracing...' : 'Replay Animation'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
