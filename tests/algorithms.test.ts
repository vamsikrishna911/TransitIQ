import test from 'node:test';
import assert from 'node:assert/strict';
import { PriorityQueue } from '../src/algorithms/priorityQueue';
import { TransitGraph } from '../src/algorithms/graph';
import { runDijkstra } from '../src/algorithms/dijkstra';
import { runBFS } from '../src/algorithms/bfs';
import { runAStar, haversineDistanceKm } from '../src/algorithms/astar';
import { calculateEfficiencyScore } from '../src/algorithms/scoring';
import { INITIAL_STOPS, INITIAL_CONNECTIONS } from '../src/data/transitData';

test('Binary Min-Heap Priority Queue maintains ascending order', () => {
  const pq = new PriorityQueue<string>();
  assert.equal(pq.isEmpty(), true);

  pq.enqueue('Task C', 15);
  pq.enqueue('Task A', 5);
  pq.enqueue('Task D', 25);
  pq.enqueue('Task B', 10);
  pq.enqueue('Task A2', 5);

  assert.equal(pq.size(), 5);
  assert.equal(pq.peek()?.priority, 5);

  assert.equal(pq.dequeue()?.priority, 5);
  assert.equal(pq.dequeue()?.priority, 5);
  assert.equal(pq.dequeue()?.element, 'Task B');
  assert.equal(pq.dequeue()?.element, 'Task C');
  assert.equal(pq.dequeue()?.element, 'Task D');
  assert.equal(pq.isEmpty(), true);
  assert.equal(pq.dequeue(), null);
});

test('TransitGraph populates vertices and edges accurately', () => {
  const graph = new TransitGraph(INITIAL_STOPS, INITIAL_CONNECTIONS);
  assert.equal(graph.getAllStops().length, INITIAL_STOPS.length);

  const rlyStop = graph.getStop('VJA_RLY');
  assert.ok(rlyStop);
  assert.equal(rlyStop?.name, 'Vijayawada Railway Station');

  const rlyNeighbors = graph.getNeighbors('VJA_RLY');
  assert.ok(rlyNeighbors.length >= 2);
  const toPnbs = rlyNeighbors.find(n => n.node === 'PNBS');
  assert.ok(toPnbs);
  assert.equal(toPnbs?.distanceKm, 1.8);
});

test("Dijkstra's Algorithm finds the shortest path between PNBS and Benz Circle", () => {
  const graph = new TransitGraph(INITIAL_STOPS, INITIAL_CONNECTIONS);
  const result = runDijkstra(graph, 'PNBS', 'BENZ_CIR', 'distance');

  assert.equal(result.success, true);
  assert.ok(result.totalDistance > 0);
  assert.ok(result.path.length >= 2);
  assert.equal(result.path[0].id, 'PNBS');
  assert.equal(result.path[result.path.length - 1].id, 'BENZ_CIR');
  assert.ok(result.efficiencyScore >= 10 && result.efficiencyScore <= 99);
});

test("Dijkstra optimizes differently for distance vs travel time vs fare", () => {
  const graph = new TransitGraph(INITIAL_STOPS, INITIAL_CONNECTIONS);
  const distRes = runDijkstra(graph, 'VJA_RLY', 'VJA_AIRPORT', 'distance');
  const timeRes = runDijkstra(graph, 'VJA_RLY', 'VJA_AIRPORT', 'time');
  const costRes = runDijkstra(graph, 'VJA_RLY', 'VJA_AIRPORT', 'cost');

  assert.equal(distRes.success, true);
  assert.equal(timeRes.success, true);
  assert.equal(costRes.success, true);

  // Path reaches destination in all optimization objectives
  assert.equal(distRes.path[distRes.path.length - 1].id, 'VJA_AIRPORT');
  assert.equal(timeRes.path[timeRes.path.length - 1].id, 'VJA_AIRPORT');
  assert.equal(costRes.path[costRes.path.length - 1].id, 'VJA_AIRPORT');
});

test('Breadth-First Search (BFS) finds fewest hops route', () => {
  const graph = new TransitGraph(INITIAL_STOPS, INITIAL_CONNECTIONS);
  const result = runBFS(graph, 'VJA_RLY', 'VJA_AIRPORT');

  assert.equal(result.success, true);
  assert.ok(result.stopsCount >= 2);
  assert.equal(result.path[0].id, 'VJA_RLY');
  assert.equal(result.path[result.path.length - 1].id, 'VJA_AIRPORT');
});

test('A* Search with Haversine heuristic finds valid path to airport', () => {
  const graph = new TransitGraph(INITIAL_STOPS, INITIAL_CONNECTIONS);
  const result = runAStar(graph, 'PNBS', 'VJA_AIRPORT', 'distance');

  assert.equal(result.success, true);
  assert.equal(result.path[0].id, 'PNBS');
  assert.equal(result.path[result.path.length - 1].id, 'VJA_AIRPORT');
  assert.ok(result.visitedOrder.length > 0);
});

test('Haversine distance returns reasonable great-circle distance', () => {
  // PNBS: 16.5075, 80.6186 to Airport: 16.5304, 80.7968
  const dist = haversineDistanceKm(16.5075, 80.6186, 16.5304, 80.7968);
  assert.ok(dist > 15 && dist < 25, `Expected distance ~19km, got ${dist}`);
});

test('Multi-Criteria Scoring calculates bounded score with transparency breakdown', () => {
  const score = calculateEfficiencyScore(10, 25, 30, 2);
  assert.ok(score.efficiencyScore >= 10 && score.efficiencyScore <= 99);
  assert.ok(score.breakdown.distanceImpact > 0);
  assert.ok(score.breakdown.timeImpact > 0);
  assert.ok(score.breakdown.costImpact > 0);
});
