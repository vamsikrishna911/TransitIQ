import React, { useState } from 'react';
import {
  Cpu,
  Layers,
  Code2,
  CheckCircle2,
  ArrowRight,
  Play,
  RotateCcw,
  Sparkles,
  GitBranch,
  Crosshair,
  Compass,
  Split,
  Award,
  Hash,
  Database
} from 'lucide-react';
import { TransitStop, TransitConnection } from '../types/transit';

interface AlgorithmExplorerViewProps {
  stops: TransitStop[];
  connections: TransitConnection[];
}

export const AlgorithmExplorerView: React.FC<AlgorithmExplorerViewProps> = ({
  stops,
  connections
}) => {
  const [selectedAlgo, setSelectedAlgo] = useState<'dijkstra' | 'astar' | 'bfs' | 'heap' | 'graph'>('dijkstra');
  const [interactiveStep, setInteractiveStep] = useState<number>(0);
  const [stepperRunning, setStepperRunning] = useState<boolean>(false);

  // Simulated Stepper Sequence for PNBS -> Benz Circle -> Airport
  const stepperStates = [
    {
      step: 1,
      title: 'Initialize Min-Heap & Distance Map',
      description: 'Set dist(PNBS) = 0, all other nodes = ∞. Push (PNBS, 0) into Binary Min-Heap.',
      heap: [{ node: 'PNBS', prio: 0 }],
      visited: ['PNBS'],
      current: 'PNBS',
      explanation: 'Binary Min-Heap root holds PNBS with priority 0. Distance map initialized in O(|V|).'
    },
    {
      step: 2,
      title: 'Extract-Min (PNBS) and Relax Neighbors',
      description: 'Pop (PNBS, 0). Inspect neighbors: GOV_PET (1.9km), BENZ_CIR (4.5km), VJA_RLY (1.8km).',
      heap: [{ node: 'VJA_RLY', prio: 1.8 }, { node: 'GOV_PET', prio: 1.9 }, { node: 'BENZ_CIR', prio: 4.5 }],
      visited: ['PNBS', 'VJA_RLY'],
      current: 'PNBS',
      explanation: 'Heapify bubbles up lowest cost edge. VJA_RLY is now at root of Min-Heap with dist = 1.8.'
    },
    {
      step: 3,
      title: 'Extract-Min (VJA_RLY) and Relax',
      description: 'Pop (VJA_RLY, 1.8). Check neighbor GOV_PET: 1.8 + 1.5 = 3.3km (greater than direct 1.9km, discard).',
      heap: [{ node: 'GOV_PET', prio: 1.9 }, { node: 'BENZ_CIR', prio: 4.5 }],
      visited: ['PNBS', 'VJA_RLY', 'GOV_PET'],
      current: 'VJA_RLY',
      explanation: 'Tentative distance is not strictly less than known shortest distance. Distances remain optimal.'
    },
    {
      step: 4,
      title: 'Extract-Min (GOV_PET) & Discover Junctions',
      description: 'Pop (GOV_PET, 1.9). Relax neighbor RAM_PADU (1.9 + 5.2 = 7.1km) and BENZ_CIR (1.9 + 3.4 = 5.3km > 4.5km).',
      heap: [{ node: 'BENZ_CIR', prio: 4.5 }, { node: 'RAM_PADU', prio: 7.1 }],
      visited: ['PNBS', 'VJA_RLY', 'GOV_PET', 'BENZ_CIR'],
      current: 'GOV_PET',
      explanation: 'Direct route PNBS -> BENZ_CIR (4.5km) remains superior to PNBS -> GOV_PET -> BENZ_CIR (5.3km).'
    },
    {
      step: 5,
      title: 'Extract-Min (BENZ_CIR) - Target Reached',
      description: 'BENZ_CIR extracted from heap. Optimal path reconstructed via predecessor pointer chain.',
      heap: [{ node: 'RAM_PADU', prio: 7.1 }],
      visited: ['PNBS', 'VJA_RLY', 'GOV_PET', 'BENZ_CIR'],
      current: 'BENZ_CIR',
      explanation: 'Shortest path found: PNBS → Benz Circle (4.5 km, 14 min, ₹20). Algorithm halts.'
    }
  ];

  const handleNextStep = () => {
    if (interactiveStep < stepperStates.length - 1) {
      setInteractiveStep(prev => prev + 1);
    } else {
      setInteractiveStep(0);
    }
  };

  const handleResetStepper = () => {
    setInteractiveStep(0);
    setStepperRunning(false);
  };

  const currentStepData = stepperStates[interactiveStep];

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0d1322] via-[#101b33] to-[#0a1426] border border-slate-800 shadow-xl space-y-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 text-xs font-semibold border border-cyan-800/60">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Academic Viva & Engineering Documentation</span>
        </div>
        <h2 className="text-2xl font-black text-slate-100">
          How TransitIQ Uses Data Structures and Algorithms
        </h2>
        <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
          TransitIQ leverages rigorous computational graph theory, priority queues, and heuristics to solve real-world transit pathfinding, multi-criteria optimization, and network degree centrality.
        </p>
      </div>

      {/* Foundational Data Structures Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Database className="w-4 h-4 text-cyan-400" />
          <span>Foundational Data Structures in TransitIQ</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl bg-[#0d1322] border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-cyan-400" />
                <span>Adjacency List Graph</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                O(|V| + |E|)
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Stores transit stops as vertices in a hash map, with directed/undirected physical road segments stored as linked neighbor arrays containing distance, time, and fare weights.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#0d1322] border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                <span>Binary Min-Heap</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                O(log |V|)
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Provides constant-time lookup of minimum unvisited path cost and logarithmic bubble-up/sink-down extractions, superseding flat-array scans during frontier expansion.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#0d1322] border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <Hash className="w-4 h-4 text-emerald-400" />
                <span>Hash Maps & Sets</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                O(1) Avg
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Maintains constant-time distance tables, predecessor back-pointers for path reconstruction, closed set tracking, and heuristic caching.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Step-by-Step Algorithm Stepper */}
      <div className="p-6 rounded-2xl bg-[#0d1322] border border-slate-800 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 font-bold border border-cyan-800/60">
                LIVE DEMO
              </span>
              <h3 className="font-bold text-slate-100 text-sm">
                Interactive Stepper: Dijkstra Frontier Expansion
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Watch the Min-Heap priority queue, distance relaxation, and visited set change step-by-step.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetStepper}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs border border-slate-800"
              title="Reset stepper"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleNextStep}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20"
            >
              <span>{interactiveStep === stepperStates.length - 1 ? 'Restart Simulation' : 'Execute Next Step'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Stepper Status Display */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Step Narrative */}
          <div className="lg:col-span-6 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Step {currentStepData.step} of {stepperStates.length}</span>
              <span className="text-cyan-400 font-bold">State: Relaxing</span>
            </div>
            <h4 className="text-base font-bold text-slate-100">{currentStepData.title}</h4>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
              {currentStepData.description}
            </p>
            <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/40 text-xs text-cyan-200 font-mono">
              💡 {currentStepData.explanation}
            </div>
          </div>

          {/* Heap & Visited State */}
          <div className="lg:col-span-6 space-y-3">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-[11px] font-mono text-cyan-400 font-semibold uppercase tracking-wider block">
                Binary Min-Heap Content [Element, Priority]:
              </span>
              <div className="flex flex-wrap gap-2">
                {currentStepData.heap.map((item, idx) => (
                  <span
                    key={idx}
                    className={`px-2.5 py-1 rounded font-mono text-xs font-bold border ${
                      idx === 0
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60 shadow-sm'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    {idx === 0 && '⚡ ROOT: '}
                    {item.node} ({item.prio} km)
                  </span>
                ))}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-[11px] font-mono text-emerald-400 font-semibold uppercase tracking-wider block">
                Visited Nodes Set:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {currentStepData.visited.map((v, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded bg-emerald-950/70 text-emerald-300 border border-emerald-800/60 text-xs font-mono"
                  >
                    {v}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Algorithm Deep Dives Tabs */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          {(['dijkstra', 'astar', 'bfs', 'heap'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setSelectedAlgo(tab)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                selectedAlgo === tab
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              {tab === 'dijkstra' && "Dijkstra's Algorithm"}
              {tab === 'astar' && 'A* Search (Heuristic)'}
              {tab === 'bfs' && 'Breadth-First Search'}
              {tab === 'heap' && 'Binary Min-Heap'}
            </button>
          ))}
        </div>

        {/* Algorithm Tab Content */}
        {selectedAlgo === 'dijkstra' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#0d1322] border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Crosshair className="w-5 h-5 text-cyan-400" />
                  <span>Dijkstra's Shortest Path Algorithm</span>
                </h4>
                <span className="text-xs font-mono text-cyan-400 px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800">
                  Greedy Paradigm
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Dijkstra calculates the guaranteed minimum distance, fastest travel time, or lowest fare from a source terminal to all reachable stops on graphs with non-negative edge weights.
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Time Complexity</span>
                  <span className="text-sm font-bold font-mono text-cyan-400">O((|V| + |E|) · log |V|)</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">With Binary Min-Heap Priority Queue</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Space Complexity</span>
                  <span className="text-sm font-bold font-mono text-emerald-400">O(|V| + |E|)</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">Distance map & predecessor pointers</p>
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <span className="text-xs font-semibold text-slate-300">Input & Output Specification:</span>
                <ul className="text-xs text-slate-400 space-y-1 list-disc pl-4">
                  <li><strong>Input:</strong> Adjacency List $G=(V,E)$, source vertex $s$, destination vertex $t$, weight criteria $w(e) \ge 0$.</li>
                  <li><strong>Output:</strong> Minimal cost scalar, reconstructed path $[s, v_1, v_2, \dots, t]$, stop sequence, and transfers.</li>
                </ul>
              </div>
            </div>

            <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs overflow-x-auto text-slate-300">
              <span className="text-cyan-400 font-bold block mb-2">// Dijkstra Pseudocode</span>
              <pre>{`function Dijkstra(Graph G, Source s, Target t):
  distances = Map(all nodes -> Infinity)
  previous = Map(all nodes -> null)
  pq = new BinaryMinHeap()

  distances[s] = 0
  pq.enqueue(s, 0)

  while not pq.isEmpty():
    (u, currentDist) = pq.dequeue()
    if u == t: break
    if currentDist > distances[u]: continue

    for each edge (u, v, weight) in G.neighbors(u):
      tentative = distances[u] + weight
      if tentative < distances[v]:
        distances[v] = tentative
        previous[v] = u
        pq.enqueue(v, tentative)

  return reconstructPath(previous, s, t)`}</pre>
            </div>
          </div>
        )}

        {selectedAlgo === 'astar' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#0d1322] border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Compass className="w-5 h-5 text-cyan-400" />
                  <span>A* Search (Haversine Euclidean Heuristic)</span>
                </h4>
                <span className="text-xs font-mono text-cyan-400 px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800">
                  Heuristic Search
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                A* incorporates the spherical Haversine formula as an admissible heuristic $h(n) \le d^*(n, t)$, guiding search direction specifically towards the target coordinates and reducing explored search space.
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Time Complexity</span>
                  <span className="text-sm font-bold font-mono text-cyan-400">O(|E|) Best · O(b^d) Worst</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">Prunes branches far from target</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Heuristic Admissibility</span>
                  <span className="text-sm font-bold font-mono text-emerald-400">h(n) ≤ d*(n, goal)</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">Great-circle distance never overestimates</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs overflow-x-auto text-slate-300">
              <span className="text-cyan-400 font-bold block mb-2">// A* Search Pseudocode</span>
              <pre>{`function AStar(Graph G, Source s, Target t):
  gScore = Map(nodes -> Infinity)
  fScore = Map(nodes -> Infinity)
  openSet = new BinaryMinHeap()

  gScore[s] = 0
  fScore[s] = haversine(s, t)
  openSet.enqueue(s, fScore[s])

  while not openSet.isEmpty():
    u = openSet.dequeue()
    if u == t: return reconstructPath()

    for each edge (u, v, cost) in G.neighbors(u):
      tentative_g = gScore[u] + cost
      if tentative_g < gScore[v]:
        previous[v] = u
        gScore[v] = tentative_g
        fScore[v] = tentative_g + haversine(v, t)
        openSet.enqueue(v, fScore[v])`}</pre>
            </div>
          </div>
        )}

        {selectedAlgo === 'bfs' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#0d1322] border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Split className="w-5 h-5 text-cyan-400" />
                  <span>Breadth-First Search (BFS)</span>
                </h4>
                <span className="text-xs font-mono text-cyan-400 px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800">
                  Unweighted Traversal
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                BFS explores graph vertices tier-by-tier using a FIFO Queue. It minimizes the total number of intermediate connections (transfers/hops), regardless of road distance or duration.
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Time Complexity</span>
                  <span className="text-sm font-bold font-mono text-cyan-400">O(|V| + |E|)</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">Visits each vertex and edge once</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Space Complexity</span>
                  <span className="text-sm font-bold font-mono text-emerald-400">O(|V|)</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">Queue and visited boolean array</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs overflow-x-auto text-slate-300">
              <span className="text-cyan-400 font-bold block mb-2">// BFS Pseudocode</span>
              <pre>{`function BFS(Graph G, Source s, Target t):
  queue = new FIFOQueue()
  visited = Set([s])
  predecessor = Map()

  queue.push(s)

  while not queue.isEmpty():
    u = queue.shift()
    if u == t: break

    for each edge (u, v) in G.neighbors(u):
      if v not in visited:
        visited.add(v)
        predecessor[v] = u
        queue.push(v)

  return reconstructPath(predecessor, s, t)`}</pre>
            </div>
          </div>
        )}

        {selectedAlgo === 'heap' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#0d1322] border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-cyan-400" />
                  <span>Binary Min-Heap Priority Queue</span>
                </h4>
                <span className="text-xs font-mono text-cyan-400 px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800">
                  Complete Binary Tree
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                The heap stores nodes sequentially in an array where for any index $i$, children reside at $2i + 1$ and $2i + 2$, and parent at $\lfloor(i - 1)/2\rfloor$. The root node always holds the minimum element.
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Enqueue (Bubble Up)</span>
                  <span className="text-sm font-bold font-mono text-cyan-400">O(log n)</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Dequeue (Sink Down)</span>
                  <span className="text-sm font-bold font-mono text-emerald-400">O(log n)</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs overflow-x-auto text-slate-300">
              <span className="text-cyan-400 font-bold block mb-2">// Binary Min-Heap Core Mechanics</span>
              <pre>{`Parent(i)      = floor((i - 1) / 2)
LeftChild(i)   = 2 * i + 1
RightChild(i)  = 2 * i + 2

bubbleUp(index):
  while index > 0 and heap[index].prio < heap[parent].prio:
    swap(index, parent)
    index = parent

sinkDown(index):
  while hasLeftChild(index):
    smallerChild = findMinChild(index)
    if heap[index].prio <= heap[smallerChild].prio: break
    swap(index, smallerChild)
    index = smallerChild`}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
