import { TransitGraph, GraphEdge } from './graph';
import { calculateEfficiencyScore } from './scoring';
import { RouteCalculationResult, PathStep } from '../types/transit';

/**
 * Breadth-First Search (BFS) for transit paths
 * Purpose: Find the route containing the minimum number of connections (hops/transfers)
 * in an unweighted view of the transportation graph.
 *
 * Time Complexity: O(|V| + |E|)
 * Space Complexity: O(|V|)
 */
export function runBFS(
  graph: TransitGraph,
  startId: string,
  targetId: string
): RouteCalculationResult {
  const startTime = performance.now();
  const startStop = graph.getStop(startId);
  const targetStop = graph.getStop(targetId);

  if (!startStop || !targetStop) {
    return {
      success: false,
      algorithm: 'Breadth-First Search (Hop-Minimal)',
      optimizationMetric: 'transfers',
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
      message: 'Origin or destination stop not found.'
    };
  }

  const visited = new Set<string>();
  const queue: string[] = [];
  const predecessor = new Map<string, { from: string; edge: GraphEdge }>();
  const visitedOrder: string[] = [];

  visited.add(startId);
  queue.push(startId);
  visitedOrder.push(startId);

  let targetFound = false;

  while (queue.length > 0) {
    const currentId = queue.shift()!;

    if (currentId === targetId) {
      targetFound = true;
      break;
    }

    const neighbors = graph.getNeighbors(currentId);
    for (const edge of neighbors) {
      if (!visited.has(edge.node)) {
        visited.add(edge.node);
        visitedOrder.push(edge.node);
        predecessor.set(edge.node, { from: currentId, edge });
        queue.push(edge.node);

        if (edge.node === targetId) {
          targetFound = true;
          break;
        }
      }
    }

    if (targetFound) break;
  }

  const executionTimeMs = Number((performance.now() - startTime).toFixed(3));

  if (!targetFound) {
    return {
      success: false,
      algorithm: 'Breadth-First Search (Hop-Minimal)',
      optimizationMetric: 'transfers',
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
      message: 'No route found via Breadth-First Search.'
    };
  }

  // Reconstruct path
  const path: PathStep[] = [];
  let curr = targetId;
  let totalDistance = 0;
  let totalTime = 0;
  let totalCost = 0;

  while (curr !== startId) {
    const step = predecessor.get(curr);
    if (!step) break;

    const stopObj = graph.getStop(curr)!;
    path.unshift({
      id: stopObj.id,
      name: stopObj.name,
      lat: stopObj.lat,
      lon: stopObj.lon,
      edgeFromPrev: {
        from: step.from,
        to: curr,
        distanceKm: step.edge.distanceKm,
        timeMin: step.edge.timeMin,
        fareInr: step.edge.fareInr,
        mode: step.edge.mode
      }
    });

    totalDistance += step.edge.distanceKm;
    totalTime += step.edge.timeMin;
    totalCost += step.edge.fareInr;
    curr = step.from;
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
    algorithm: 'Breadth-First Search (Hop-Minimal)',
    optimizationMetric: 'transfers',
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
