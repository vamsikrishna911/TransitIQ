import test from 'node:test';
import assert from 'node:assert';
import {
  buildRouteExportPayload,
  generateRouteJson,
  generateRouteTextSummary
} from '../src/utils/routeExport.ts';
import { RouteCalculationResult } from '../src/types/transit.ts';

const mockRoute: RouteCalculationResult = {
  success: true,
  algorithm: "Dijkstra's Algorithm",
  optimizationMetric: 'distance',
  stopsCount: 3,
  transfers: 0,
  totalDistance: 7.6,
  totalTime: 22,
  totalCost: 35,
  visitedOrder: ['PNBS', 'BENZ_CIR', 'AUTO_NGR'],
  executionTimeMs: 0.42,
  efficiencyScore: 84,
  scoringBreakdown: {
    distanceImpact: 5.7,
    timeImpact: 8.8,
    costImpact: 7.0,
    transferImpact: 0
  },
  path: [
    {
      id: 'PNBS',
      name: 'Pandit Nehru Bus Station',
      lat: 16.50385,
      lon: 80.62762,
      edgeFromPrev: null
    },
    {
      id: 'BENZ_CIR',
      name: 'Benz Circle',
      lat: 16.50392,
      lon: 80.64183,
      edgeFromPrev: {
        from: 'PNBS',
        to: 'BENZ_CIR',
        distanceKm: 4.5,
        timeMin: 14,
        fareInr: 20,
        mode: 'bus'
      }
    },
    {
      id: 'AUTO_NGR',
      name: 'Autonagar Terminal',
      lat: 16.49524,
      lon: 80.66981,
      edgeFromPrev: {
        from: 'BENZ_CIR',
        to: 'AUTO_NGR',
        distanceKm: 3.1,
        timeMin: 8,
        fareInr: 15,
        mode: 'bus'
      }
    }
  ]
};

test('buildRouteExportPayload creates valid structured schema', () => {
  const payload = buildRouteExportPayload(mockRoute);
  assert.strictEqual(payload.transitIq.origin.id, 'PNBS');
  assert.strictEqual(payload.transitIq.destination.id, 'AUTO_NGR');
  assert.strictEqual(payload.transitIq.metrics.totalDistanceKm, 7.6);
  assert.strictEqual(payload.transitIq.metrics.totalFareInr, 35);
  assert.strictEqual(payload.transitIq.metrics.stopsCount, 3);
  assert.strictEqual(payload.transitIq.itinerary.length, 3);
  assert.strictEqual(payload.transitIq.geoCoordinates.length, 3);
});

test('generateRouteJson produces valid parseable JSON with required attributes', () => {
  const jsonStr = generateRouteJson(mockRoute);
  const parsed = JSON.parse(jsonStr);
  assert.ok(parsed.transitIq);
  assert.strictEqual(parsed.transitIq.algorithm, "Dijkstra's Algorithm");
  assert.strictEqual(parsed.transitIq.itinerary[1].segmentFromPrevious.mode, 'bus');
  assert.strictEqual(parsed.transitIq.itinerary[1].segmentFromPrevious.distanceKm, 4.5);
});

test('generateRouteTextSummary outputs readable itinerary with metrics', () => {
  const summary = generateRouteTextSummary(mockRoute);
  assert.ok(summary.includes('TRANSITIQ - OPTIMAL TRANSIT ITINERARY'));
  assert.ok(summary.includes('Pandit Nehru Bus Station'));
  assert.ok(summary.includes('Autonagar Terminal'));
  assert.ok(summary.includes('7.6 km'));
  assert.ok(summary.includes('₹ 35 INR'));
  assert.ok(summary.includes('84 / 100'));
});
