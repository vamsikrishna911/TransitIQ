import { TransitGraph, GraphEdge } from './graph';
import { PriorityQueue } from './priorityQueue';
import { calculateEfficiencyScore } from './scoring';
import { RouteCalculationResult, PathStep, OptimizationCriterion } from '../types/transit';

export function runDijkstra(
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
      algorithm: "Dijkstra's Algorithm",
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
      message: 'Origin or destination stop not found in transit network.'
    };
  }

  const distances = new Map<string, number>();
  const previous = new Map<string, { from: string; edge: GraphEdge } | null>();
  const pq = new PriorityQueue<string>();
  const visitedOrder: string[] = [];
  const visitedSet = new Set<string>();

  for (const stop of graph.getAllStops()) {
    distances.set(stop.id, Infinity);
    previous.set(stop.id, null);
  }

  distances.set(startId, 0);
  pq.enqueue(startId, 0);

  let targetReached = false;

  const getWeight = (edge: GraphEdge): number => {
    switch (optimizeBy) {
      case 'time':
        return edge.timeMin;
      case 'cost':
        return edge.fareInr;
      case 'balanced':
        // Composite normalized metric
        return edge.distanceKm * 0.4 + (edge.timeMin / 2) * 0.4 + (edge.fareInr / 5) * 0.2;
      case 'distance':
      default:
        return edge.distanceKm;
    }
  };

  while (!pq.isEmpty()) {
    const dequeued = pq.dequeue();
    if (!dequeued) break;

    const currentId = dequeued.element;
    const currentDist = dequeued.priority;

    if (!visitedSet.has(currentId)) {
      visitedSet.add(currentId);
      visitedOrder.push(currentId);
    }

    if (currentId === targetId) {
      targetReached = true;
      break;
    }

    if (currentDist > (distances.get(currentId) ?? Infinity)) {
      continue;
    }

    const neighbors = graph.getNeighbors(currentId);
    for (const edge of neighbors) {
      const weight = getWeight(edge);
      const tentative = currentDist + weight;

      if (tentative < (distances.get(edge.node) ?? Infinity)) {
        distances.set(edge.node, tentative);
        previous.set(edge.node, { from: currentId, edge });
        pq.enqueue(edge.node, tentative);
      }
    }
  }

  const executionTimeMs = Number((performance.now() - startTime).toFixed(3));

  if (!targetReached || distances.get(targetId) === Infinity) {
    return {
      success: false,
      algorithm: `Dijkstra's Algorithm (${optimizeBy})`,
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
      message: 'Destination is unreachable from the selected origin stop.'
    };
  }

  // Reconstruct path
  const path: PathStep[] = [];
  let curr = targetId;
  let totalDistance = 0;
  let totalTime = 0;
  let totalCost = 0;

  while (curr !== startId) {
    const prevEntry = previous.get(curr);
    if (!prevEntry) break;

    const stopObj = graph.getStop(curr)!;
    path.unshift({
      id: stopObj.id,
      name: stopObj.name,
      lat: stopObj.lat,
      lon: stopObj.lon,
      edgeFromPrev: {
        from: prevEntry.from,
        to: curr,
        distanceKm: prevEntry.edge.distanceKm,
        timeMin: prevEntry.edge.timeMin,
        fareInr: prevEntry.edge.fareInr,
        mode: prevEntry.edge.mode
      }
    });

    totalDistance += prevEntry.edge.distanceKm;
    totalTime += prevEntry.edge.timeMin;
    totalCost += prevEntry.edge.fareInr;
    curr = prevEntry.from;
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
    algorithm: `Dijkstra's Algorithm (${optimizeBy})`,
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
