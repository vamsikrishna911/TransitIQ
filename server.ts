import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { TransitGraph } from './src/algorithms/graph';
import { runDijkstra } from './src/algorithms/dijkstra';
import { runBFS } from './src/algorithms/bfs';
import { runAStar } from './src/algorithms/astar';
import { calculateEfficiencyScore } from './src/algorithms/scoring';
import { INITIAL_STOPS, INITIAL_CONNECTIONS } from './src/data/transitData';
import { TransitStop, TransitConnection, OptimizationCriterion, AlgorithmType } from './src/types/transit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  // Dynamic In-Memory Transit Data State
  let currentStops: TransitStop[] = JSON.parse(JSON.stringify(INITIAL_STOPS));
  let currentConnections: TransitConnection[] = JSON.parse(JSON.stringify(INITIAL_CONNECTIONS));

  // Initialize Adjacency List Graph
  const graph = new TransitGraph(currentStops, currentConnections);

  // Health endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'healthy',
      system: 'TransitIQ Route Engine',
      stopsCount: currentStops.length,
      connectionsCount: currentConnections.length,
      timestamp: new Date().toISOString()
    });
  });

  // Get all transit stops
  app.get('/api/stops', (_req, res) => {
    res.json(currentStops);
  });

  // Get all transit connections
  app.get('/api/routes', (_req, res) => {
    res.json(currentConnections);
  });

  // Network Analytics Overview
  app.get('/api/analytics', (_req, res) => {
    const totalStops = currentStops.length;
    const totalRoutes = currentConnections.length;

    const totalDist = currentConnections.reduce((sum, c) => sum + c.distanceKm, 0);
    const totalTime = currentConnections.reduce((sum, c) => sum + c.timeMin, 0);
    const totalCost = currentConnections.reduce((sum, c) => sum + c.fareInr, 0);

    const avgDistanceKm = totalRoutes > 0 ? Number((totalDist / totalRoutes).toFixed(2)) : 0;
    const avgTimeMin = totalRoutes > 0 ? Math.round(totalTime / totalRoutes) : 0;
    const avgCostInr = totalRoutes > 0 ? Math.round(totalCost / totalRoutes) : 0;

    const degreeDistribution = currentStops.map(stop => ({
      id: stop.id,
      name: stop.name,
      degree: graph.getDegree(stop.id)
    })).sort((a, b) => b.degree - a.degree);

    res.json({
      totalStops,
      totalRoutes,
      avgDistanceKm,
      avgTimeMin,
      avgCostInr,
      mostConnectedNode: degreeDistribution[0] || null,
      degreeDistribution
    });
  });

  // Calculate single route using specified DSA algorithm
  app.post('/api/route/calculate', (req, res) => {
    const { source, destination, algorithm = 'dijkstra', optimizeBy = 'distance' } = req.body as {
      source: string;
      destination: string;
      algorithm: AlgorithmType;
      optimizeBy: OptimizationCriterion;
    };

    if (!source || !destination) {
      return res.status(400).json({ error: 'Origin (source) and destination stops are required.' });
    }

    if (source === destination) {
      return res.status(400).json({ error: 'Origin and destination stops must be distinct.' });
    }

    const startStop = graph.getStop(source);
    const destStop = graph.getStop(destination);

    if (!startStop || !destStop) {
      return res.status(404).json({ error: 'One or both specified stops do not exist in the transit network.' });
    }

    let result;
    switch (algorithm.toLowerCase()) {
      case 'bfs':
        result = runBFS(graph, source, destination);
        break;
      case 'astar':
        result = runAStar(graph, source, destination, optimizeBy);
        break;
      case 'dijkstra':
      default:
        result = runDijkstra(graph, source, destination, optimizeBy);
        break;
    }

    if (!result.success) {
      return res.status(422).json(result);
    }

    return res.json(result);
  });

  // Multi-algorithm comparison endpoint
  app.post('/api/route/compare', (req, res) => {
    const { source, destination } = req.body as { source: string; destination: string };

    if (!source || !destination || source === destination) {
      return res.status(400).json({ error: 'Valid distinct source and destination are required.' });
    }

    const startStop = graph.getStop(source);
    const destStop = graph.getStop(destination);

    if (!startStop || !destStop) {
      return res.status(404).json({ error: 'One or both stops do not exist.' });
    }

    const dijkstraDist = runDijkstra(graph, source, destination, 'distance');
    const dijkstraTime = runDijkstra(graph, source, destination, 'time');
    const dijkstraCost = runDijkstra(graph, source, destination, 'cost');
    const dijkstraBalanced = runDijkstra(graph, source, destination, 'balanced');
    const bfsHops = runBFS(graph, source, destination);
    const astarDist = runAStar(graph, source, destination, 'distance');

    const runs = [
      { label: 'Dijkstra (Shortest Distance)', run: dijkstraDist },
      { label: 'Dijkstra (Minimum Time)', run: dijkstraTime },
      { label: 'Dijkstra (Lowest Fare)', run: dijkstraCost },
      { label: 'Dijkstra (Balanced Route)', run: dijkstraBalanced },
      { label: 'A* Search (Haversine Heuristic)', run: astarDist },
      { label: 'BFS (Fewest Transfers/Hops)', run: bfsHops }
    ];

    const comparisons = runs
      .filter(r => r.run.success)
      .map(item => ({
        label: item.label,
        algorithm: item.run.algorithm,
        distance: item.run.totalDistance,
        timeMin: item.run.totalTime,
        fareInr: item.run.totalCost,
        transfers: item.run.transfers,
        stopsCount: item.run.stopsCount,
        executionTimeMs: item.run.executionTimeMs,
        efficiencyScore: item.run.efficiencyScore,
        path: item.run.path.map(p => p.name)
      }));

    return res.json({
      source: startStop.name,
      destination: destStop.name,
      comparisons
    });
  });

  // Import custom dataset (JSON)
  app.post('/api/data/import', (req, res) => {
    try {
      const { stops, connections, replace = true } = req.body as {
        stops?: TransitStop[];
        connections?: TransitConnection[];
        replace?: boolean;
      };

      if (!Array.isArray(stops) || !Array.isArray(connections)) {
        return res.status(400).json({ error: 'Invalid payload: stops and connections must both be arrays.' });
      }

      if (replace) {
        currentStops = stops;
        currentConnections = connections;
      } else {
        // Append unique stops
        const existingIds = new Set(currentStops.map(s => s.id));
        for (const s of stops) {
          if (!existingIds.has(s.id)) {
            currentStops.push(s);
            existingIds.add(s.id);
          }
        }
        currentConnections.push(...connections);
      }

      // Re-populate graph
      graph.populate(currentStops, currentConnections);

      return res.json({
        success: true,
        message: `Dataset successfully ${replace ? 'replaced' : 'updated'}.`,
        totalStops: currentStops.length,
        totalRoutes: currentConnections.length
      });
    } catch (err) {
      console.error('Import error:', err);
      return res.status(500).json({ error: 'Failed to process dataset import.' });
    }
  });

  // Reset dataset to initial Vijayawada state
  app.post('/api/data/reset', (_req, res) => {
    currentStops = JSON.parse(JSON.stringify(INITIAL_STOPS));
    currentConnections = JSON.parse(JSON.stringify(INITIAL_CONNECTIONS));
    graph.populate(currentStops, currentConnections);

    return res.json({
      success: true,
      message: 'Transit dataset reset to default Vijayawada simulated network.',
      totalStops: currentStops.length,
      totalRoutes: currentConnections.length
    });
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TransitIQ Full-Stack Engine running on http://localhost:${PORT}`);
    console.log(`Loaded ${currentStops.length} stops and ${currentConnections.length} connections`);
  });
}

startServer().catch(err => {
  console.error('Failed to start TransitIQ server:', err);
  process.exit(1);
});
