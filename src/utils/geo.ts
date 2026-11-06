/**
 * Utility functions for spatial geometry and smooth polyline path interpolation.
 */

export function interpolateGeoPath(
  points: [number, number][],
  totalSteps: number = 100
): [number, number][] {
  if (!points || points.length === 0) return [];
  if (points.length === 1) return [points[0]];

  // Calculate Euclidean distances for each segment
  const segmentLengths: number[] = [];
  let totalLength = 0;

  for (let i = 0; i < points.length - 1; i++) {
    const dLat = points[i + 1][0] - points[i][0];
    const dLon = points[i + 1][1] - points[i][1];
    const len = Math.sqrt(dLat * dLat + dLon * dLon);
    segmentLengths.push(len);
    totalLength += len;
  }

  if (totalLength === 0) return points;

  const interpolated: [number, number][] = [points[0]];

  for (let s = 1; s <= totalSteps; s++) {
    const targetDist = (s / totalSteps) * totalLength;
    let accumulated = 0;

    for (let i = 0; i < segmentLengths.length; i++) {
      const nextAccum = accumulated + segmentLengths[i];
      if (targetDist <= nextAccum || i === segmentLengths.length - 1) {
        const segLen = segmentLengths[i];
        const segFrac = segLen > 0 ? (targetDist - accumulated) / segLen : 1;
        const clampedFrac = Math.max(0, Math.min(1, segFrac));

        const lat = points[i][0] + (points[i + 1][0] - points[i][0]) * clampedFrac;
        const lon = points[i][1] + (points[i + 1][1] - points[i][1]) * clampedFrac;
        interpolated.push([Number(lat.toFixed(6)), Number(lon.toFixed(6))]);
        break;
      }
      accumulated = nextAccum;
    }
  }

  return interpolated;
}

/**
 * Standard cubic ease-out easing function: 1 - (1 - t)^3
 */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}
