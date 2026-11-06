export type TransportMode = 'bus' | 'walking' | 'mixed';

export type OptimizationCriterion = 'distance' | 'time' | 'cost' | 'balanced';

export type AlgorithmType = 'dijkstra' | 'astar' | 'bfs';

export interface TransitStop {
  id: string;
  name: string;
  lat: number;
  lon: number;
  type: string;
  zone?: string;
  platforms?: number;
}

export interface TransitConnection {
  from: string;
  to: string;
  distanceKm: number;
  timeMin: number;
  fareInr: number;
  mode: TransportMode;
}

export interface PathStep {
  id: string;
  name: string;
  lat: number;
  lon: number;
  edgeFromPrev: TransitConnection | null;
}

export interface RouteCalculationResult {
  success: boolean;
  algorithm: string;
  optimizationMetric: string;
  path: PathStep[];
  stopsCount: number;
  transfers: number;
  totalDistance: number;
  totalTime: number;
  totalCost: number;
  visitedOrder: string[];
  executionTimeMs: number;
  efficiencyScore: number;
  scoringBreakdown: {
    distanceImpact: number;
    timeImpact: number;
    costImpact: number;
    transferImpact: number;
  };
  message?: string;
}

export interface RouteComparisonItem {
  label: string;
  algorithm: string;
  distance: number;
  timeMin: number;
  fareInr: number;
  transfers: number;
  stopsCount: number;
  executionTimeMs: number;
  efficiencyScore: number;
  path: string[];
}

export interface RouteComparisonResult {
  source: string;
  destination: string;
  comparisons: RouteComparisonItem[];
}

export interface NetworkAnalytics {
  totalStops: number;
  totalRoutes: number;
  avgDistanceKm: number;
  avgTimeMin: number;
  avgCostInr: number;
  mostConnectedNode: {
    id: string;
    name: string;
    degree: number;
  };
  degreeDistribution: Array<{
    id: string;
    name: string;
    degree: number;
  }>;
}
