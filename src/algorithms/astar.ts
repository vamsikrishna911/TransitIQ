import { TransitGraph, GraphEdge } from './graph';
import { PriorityQueue } from './priorityQueue';
import { calculateEfficiencyScore } from './scoring';
import { RouteCalculationResult, PathStep, OptimizationCriterion } from '../types/transit';

/**
 * Haversine formula: Calculates great-circle geographic distance between coordinates in km.
 * Admissible heuristic for 2D spatial routing: straight-line distance is always <= road distance.
 */
export function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (angle: number) => (angle * Math.PI) / 180;
  const R = 6371; // Earth radius in km

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function runAStar(
  graph: TransitGraph,
  startId: string,
  targetId: string,
  optimizeBy: OptimizationCriterion = 'distance'
): RouteCalculationResult {
  const startTime = performance.now();
  const startStop = graph.getStop(startId);
  const targetStop = graph.getStop(targetId);

  if (!startStop || !targetStop) {
    return {
      success: false,
      algorithm: 'A* Search (Haversine Heuristic)',
      optimizationMetric: optimizeBy,
      path: [],
      stopsCount: 0,
      transfers: 0,
      totalDistance: 0,
      totalTime: 0,
      totalCost: 0,
      visitedOrder: [],
      executionTimeMs: 0,
      efficiencyScore: 0,
      scoringBreakdown: { distanceImpact: 0, timeImpact: 0, costImpact: 0, transferImpact: 0 },
      message: 'Invalid origin or destination stop.'
    };
  }

  const gScore = new Map<string, number>();
  const fScore = new Map<string, number>();
  const previous = new Map<string, { from: string; edge: GraphEdge }>();
  const openSet = new PriorityQueue<string>();
  const visitedOrder: string[] = [];
  const closedSet = new Set<string>();

  for (const stop of graph.getAllStops()) {
    gScore.set(stop.id, Infinity);
    fScore.set(stop.id, Infinity);
  }

  const getEdgeWeight = (edge: GraphEdge): number => {
    switch (optimizeBy) {
      case 'time':
        return edge.timeMin;
      case 'cost':
        return edge.fareInr;
      case 'balanced':
        return edge.distanceKm * 0.4 + (edge.timeMin / 2) * 0.4 + (edge.fareInr / 5) * 0.2;
      case 'distance':
      default:
        return edge.distanceKm;
    }
  };

  // Compute admissible heuristic h(n) towards target
  const getHeuristic = (stopId: string): number => {
    const currentStop = graph.getStop(stopId);
    if (!currentStop) return 0;
    const geoDistKm = haversineDistanceKm(currentStop.lat, currentStop.lon, targetStop.lat, targetStop.lon);

    switch (optimizeBy) {
      case 'time':
        // Assume maximum realistic bus speed (e.g. 60 km/h -> 1 min per km) to guarantee admissibility
        return (geoDistKm / 60) * 60; // 1 min/km lower bound
      case 'cost':
        // Assume minimal base fare per km (e.g. 2 INR/km) for admissibility
        return geoDistKm * 2;
      case 'balanced':
        return geoDistKm * 0.4 + (geoDistKm / 2) * 0.4 + (geoDistKm * 2 / 5) * 0.2;
      case 'distance':
      default:
        return geoDistKm;
    }
  };

  gScore.set(startId, 0);
  const initialH = getHeuristic(startId);
  fScore.set(startId, initialH);
  openSet.enqueue(startId, initialH);

  let targetFound = false;

  while (!openSet.isEmpty()) {
    const dequeued = openSet.dequeue();
    if (!dequeued) break;

    const currentId = dequeued.element;

    if (closedSet.has(currentId)) continue;
    closedSet.add(currentId);
    visitedOrder.push(currentId);

    if (currentId === targetId) {
      targetFound = true;
      break;
    }

    const currentG = gScore.get(currentId) ?? Infinity;
    const neighbors = graph.getNeighbors(currentId);

    for (const edge of neighbors) {
      const neighborId = edge.node;
      if (closedSet.has(neighborId)) continue;

      const edgeCost = getEdgeWeight(edge);
      const tentativeG = currentG + edgeCost;

      if (tentativeG < (gScore.get(neighborId) ?? Infinity)) {
        previous.set(neighborId, { from: currentId, edge });
        gScore.set(neighborId, tentativeG);

        const h = getHeuristic(neighborId);
        const f = tentativeG + h;
        fScore.set(neighborId, f);

        openSet.enqueue(neighborId, f);
      }
    }
  }

  const executionTimeMs = Number((performance.now() - startTime).toFixed(3));

  if (!targetFound) {
    return {
      success: false,
      algorithm: `A* Search (Haversine Heuristic)`,
      optimizationMetric: optimizeBy,
      path: [],
      stopsCount: 0,
      transfers: 0,
      totalDistance: 0,
      totalTime: 0,
      totalCost: 0,
      visitedOrder,
      executionTimeMs,
      efficiencyScore: 0,
      scoringBreakdown: { distanceImpact: 0, timeImpact: 0, costImpact: 0, transferImpact: 0 },
      message: 'Destination unreachable via A* search.'
    };
  }

  // Reconstruct path
  const path: PathStep[] = [];
  let curr = targetId;
  let totalDistance = 0;
  let totalTime = 0;
  let totalCost = 0;

  while (curr !== startId) {
    const prev = previous.get(curr);
    if (!prev) break;

    const stopObj = graph.getStop(curr)!;
    path.unshift({
      id: stopObj.id,
      name: stopObj.name,
      lat: stopObj.lat,
      lon: stopObj.lon,
      edgeFromPrev: {
        from: prev.from,
        to: curr,
        distanceKm: prev.edge.distanceKm,
        timeMin: prev.edge.timeMin,
        fareInr: prev.edge.fareInr,
        mode: prev.edge.mode
      }
    });

    totalDistance += prev.edge.distanceKm;
    totalTime += prev.edge.timeMin;
    totalCost += prev.edge.fareInr;
    curr = prev.from;
  }

  path.unshift({
    id: startStop.id,
    name: startStop.name,
    lat: startStop.lat,
    lon: startStop.lon,
    edgeFromPrev: null
  });

  const transfers = Math.max(0, path.length - 2);
  const roundedDist = Number(totalDistance.toFixed(2));
  const roundedTime = Math.round(totalTime);
  const roundedCost = Math.round(totalCost);

  const scoring = calculateEfficiencyScore(roundedDist, roundedTime, roundedCost, transfers);

  return {
    success: true,
    algorithm: `A* Search (Haversine Heuristic)`,
    optimizationMetric: optimizeBy,
    path,
    stopsCount: path.length,
    transfers,
    totalDistance: roundedDist,
    totalTime: roundedTime,
    totalCost: roundedCost,
    visitedOrder,
    executionTimeMs,
    efficiencyScore: scoring.efficiencyScore,
    scoringBreakdown: scoring.breakdown
  };
}
