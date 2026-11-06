import { RouteCalculationResult } from '../types/transit';

export interface RouteExportPayload {
  transitIq: {
    app: string;
    version: string;
    exportedAt: string;
    origin: {
      id: string;
      name: string;
      lat: number;
      lon: number;
    };
    destination: {
      id: string;
      name: string;
      lat: number;
      lon: number;
    };
    algorithm: string;
    optimizationMetric: string;
    metrics: {
      totalDistanceKm: number;
      totalTimeMin: number;
      totalFareInr: number;
      stopsCount: number;
      transfers: number;
      efficiencyScore: number;
      executionTimeMs: number;
    };
    scoringBreakdown: {
      distanceImpact: number;
      timeImpact: number;
      costImpact: number;
      transferImpact: number;
    };
    itinerary: Array<{
      stepNumber: number;
      stopId: string;
      stopName: string;
      coordinates: {
        latitude: number;
        longitude: number;
      };
      segmentFromPrevious: {
        distanceKm: number;
        timeMin: number;
        fareInr: number;
        mode: string;
      } | null;
    }>;
    geoCoordinates: Array<[number, number]>;
  };
}

/**
 * Builds structured JSON representation of calculated optimal transit route.
 */
export function buildRouteExportPayload(route: RouteCalculationResult): RouteExportPayload {
  const originStep = route.path[0];
  const destStep = route.path[route.path.length - 1];

  return {
    transitIq: {
      app: 'TransitIQ – Public Transportation Route Analytics and Optimization System',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      origin: {
        id: originStep?.id || 'UNKNOWN',
        name: originStep?.name || 'Unknown Origin',
        lat: originStep?.lat || 0,
        lon: originStep?.lon || 0
      },
      destination: {
        id: destStep?.id || 'UNKNOWN',
        name: destStep?.name || 'Unknown Destination',
        lat: destStep?.lat || 0,
        lon: destStep?.lon || 0
      },
      algorithm: route.algorithm,
      optimizationMetric: route.optimizationMetric,
      metrics: {
        totalDistanceKm: route.totalDistance,
        totalTimeMin: route.totalTime,
        totalFareInr: route.totalCost,
        stopsCount: route.stopsCount,
        transfers: route.transfers,
        efficiencyScore: route.efficiencyScore,
        executionTimeMs: route.executionTimeMs
      },
      scoringBreakdown: route.scoringBreakdown,
      itinerary: route.path.map((step, idx) => ({
        stepNumber: idx + 1,
        stopId: step.id,
        stopName: step.name,
        coordinates: {
          latitude: step.lat,
          longitude: step.lon
        },
        segmentFromPrevious: step.edgeFromPrev
          ? {
              distanceKm: step.edgeFromPrev.distanceKm,
              timeMin: step.edgeFromPrev.timeMin,
              fareInr: step.edgeFromPrev.fareInr,
              mode: step.edgeFromPrev.mode
            }
          : null
      })),
      geoCoordinates: route.path.map((step) => [step.lat, step.lon])
    }
  };
}

/**
 * Serializes route export payload to pretty-printed JSON.
 */
export function generateRouteJson(route: RouteCalculationResult): string {
  const payload = buildRouteExportPayload(route);
  return JSON.stringify(payload, null, 2);
}

/**
 * Generates an easy-to-read, shareable plain-text travel itinerary.
 */
export function generateRouteTextSummary(route: RouteCalculationResult): string {
  const origin = route.path[0];
  const dest = route.path[route.path.length - 1];
  const now = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  const lines: string[] = [
    '======================================================================',
    ' TRANSITIQ - OPTIMAL TRANSIT ITINERARY & TRAVEL PLAN',
    ' Smart Routes. Better Journeys.',
    '======================================================================',
    `Export Date:     ${now}`,
    `Origin:          ${origin?.name || 'Unknown'} (${origin?.id || 'N/A'})`,
    `Destination:     ${dest?.name || 'Unknown'} (${dest?.id || 'N/A'})`,
    `Algorithm:       ${route.algorithm} (Criterion: ${route.optimizationMetric})`,
    `DSA Execution:   ${route.executionTimeMs} ms`,
    '',
    '----------------------------------------------------------------------',
    ' JOURNEY SUMMARY METRICS',
    '----------------------------------------------------------------------',
    `• Total Road Distance:    ${route.totalDistance.toFixed(1)} km`,
    `• Estimated Travel Time:  ${route.totalTime} min`,
    `• Estimated Transit Fare: ₹ ${route.totalCost} INR`,
    `• Total Stations / Stops: ${route.stopsCount} stops (${route.transfers} transfers)`,
    `• Route Efficiency Score: ${route.efficiencyScore} / 100`,
    `  Score Penalty Details:  -${route.scoringBreakdown.distanceImpact} (dist) ` +
      `-${route.scoringBreakdown.timeImpact} (time) ` +
      `-${route.scoringBreakdown.costImpact} (fare) ` +
      `-${route.scoringBreakdown.transferImpact} (transfers)`,
    '',
    '----------------------------------------------------------------------',
    ' STEP-BY-STEP STATION ITINERARY',
    '----------------------------------------------------------------------'
  ];

  route.path.forEach((step, idx) => {
    const isStart = idx === 0;
    const isEnd = idx === route.path.length - 1;
    const badge = isStart ? '[ORIGIN]' : isEnd ? '[DESTINATION]' : `[STOP ${idx + 1}]`;

    lines.push(`${badge.padEnd(16)} ${step.name} (${step.id})`);
    lines.push(`                 Coordinates: ${step.lat.toFixed(5)}, ${step.lon.toFixed(5)}`);

    if (step.edgeFromPrev) {
      lines.push(
        `                 Transit Leg: +${step.edgeFromPrev.distanceKm} km · ${step.edgeFromPrev.timeMin} min · ₹ ${step.edgeFromPrev.fareInr} · Mode: ${step.edgeFromPrev.mode.toUpperCase()}`
      );
    }
    if (!isEnd) {
      lines.push('                 │');
      lines.push('                 ▼');
    }
  });

  lines.push('');
  lines.push('======================================================================');
  lines.push(' Generated by TransitIQ Transportation Route Analytics Engine');
  lines.push('======================================================================');

  return lines.join('\n');
}

/**
 * Triggers client-side file download via dynamic Blob link.
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
