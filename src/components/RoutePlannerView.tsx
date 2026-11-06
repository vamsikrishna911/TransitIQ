import React, { useState } from 'react';
import {
  Zap,
  GitCompare,
  RotateCcw,
  Clock,
  Ruler,
  CircleDollarSign,
  Layers,
  ArrowRight,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Info,
  Timer,
  Award,
  ChevronRight,
  Share2,
  Download,
  FileJson,
  FileText
} from 'lucide-react';
import { UnifiedTransitMap } from './UnifiedTransitMap';
import { RouteExportModal } from './RouteExportModal';
import {
  TransitStop,
  TransitConnection,
  RouteCalculationResult,
  RouteComparisonResult,
  OptimizationCriterion,
  AlgorithmType,
  TransportMode
} from '../types/transit';

interface RoutePlannerViewProps {
  stops: TransitStop[];
  connections: TransitConnection[];
  initialSource?: string;
  initialDestination?: string;
  activeRoute: RouteCalculationResult | null;
  onCalculateRoute: (
    source: string,
    destination: string,
    algorithm: AlgorithmType,
    optimizeBy: OptimizationCriterion,
    mode: TransportMode
  ) => Promise<void>;
  onCompareRoutes: (source: string, destination: string) => Promise<void>;
  comparisonResult: RouteComparisonResult | null;
  isCalculating: boolean;
  isComparing: boolean;
  error: string | null;
  onResetRoute: () => void;
}

export const RoutePlannerView: React.FC<RoutePlannerViewProps> = ({
  stops,
  connections,
  initialSource = 'PNBS',
  initialDestination = 'BENZ_CIR',
  activeRoute,
  onCalculateRoute,
  onCompareRoutes,
  comparisonResult,
  isCalculating,
  isComparing,
  error,
  onResetRoute
}) => {
  const [source, setSource] = useState<string>(initialSource);
  const [destination, setDestination] = useState<string>(initialDestination);
  const [algorithm, setAlgorithm] = useState<AlgorithmType>('dijkstra');
  const [optimizeBy, setOptimizeBy] = useState<OptimizationCriterion>('distance');
  const [mode, setMode] = useState<TransportMode>('bus');
  const [showComparison, setShowComparison] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCalculateRoute(source, destination, algorithm, optimizeBy, mode);
  };

  const handleCompareClick = async () => {
    setShowComparison(true);
    await onCompareRoutes(source, destination);
  };

  return (
    <div className="space-y-6">
      {/* Top Planner Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Panel */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          <div className="bg-[#0d1322] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">Path Optimization Engine</h3>
                  <p className="text-xs text-slate-400">Configure parameters for backend DSA execution</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onResetRoute}
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 p-1.5 rounded hover:bg-slate-800 transition-colors"
                title="Reset form"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Origin Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                  <span>Origin Station (Source)</span>
                </label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-400 font-medium cursor-pointer"
                  required
                >
                  {stops.map((s) => (
                    <option key={s.id} value={s.id} className="bg-slate-900 text-slate-100">
                      {s.name} ({s.id}) · {s.zone || s.type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Destination Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                  <span>Destination Station</span>
                </label>
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-400 font-medium cursor-pointer"
                  required
                >
                  {stops.map((s) => (
                    <option key={s.id} value={s.id} className="bg-slate-900 text-slate-100">
                      {s.name} ({s.id}) · {s.zone || s.type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mode & Optimization Preferences */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                {/* Algorithm Selection */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-400">DSA Algorithm</label>
                  <select
                    value={algorithm}
                    onChange={(e) => setAlgorithm(e.target.value as AlgorithmType)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-mono"
                  >
                    <option value="dijkstra">Dijkstra (Binary Heap)</option>
                    <option value="astar">A* Search (Haversine)</option>
                    <option value="bfs">BFS (Shortest Hops)</option>
                  </select>
                </div>

                {/* Optimization Preference */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-400">Optimization Goal</label>
                  <select
                    value={optimizeBy}
                    onChange={(e) => setOptimizeBy(e.target.value as OptimizationCriterion)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                    disabled={algorithm === 'bfs'}
                  >
                    <option value="distance">Shortest Distance (km)</option>
                    <option value="time">Minimum Travel Time (min)</option>
                    <option value="cost">Lowest Fare (₹ INR)</option>
                    <option value="balanced">Balanced Composite Route</option>
                  </select>
                </div>
              </div>

              {/* Transport Mode */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-400">Transit Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['bus', 'walking', 'mixed'] as TransportMode[]).map((m) => (
                    <button
                      type="button"
                      key={m}
                      onClick={() => setMode(m)}
                      className={`py-1.5 px-2 rounded-lg text-xs capitalize font-medium transition-all ${
                        mode === m
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                          : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <button
                  type="submit"
                  disabled={isCalculating}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all cursor-pointer"
                >
                  <Zap className="w-4 h-4 fill-slate-950" />
                  <span>{isCalculating ? 'Computing via Min-Heap...' : 'Calculate Route'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCompareClick}
                  disabled={isComparing || source === destination}
                  className="flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-slate-200 text-xs font-semibold border border-slate-700 disabled:opacity-50 transition-all cursor-pointer"
                >
                  <GitCompare className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{isComparing ? 'Benchmarking...' : 'Compare Algorithms'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Solution Metrics Card */}
          {activeRoute && activeRoute.success && (
            <div className="bg-[#0d1322] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-semibold">
                    Optimal Solution
                  </span>
                  <h4 className="text-sm font-bold text-slate-100">{activeRoute.algorithm}</h4>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsExportModalOpen(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800/80 text-cyan-300 font-medium text-xs transition-colors shadow-sm"
                    title="Export route as JSON or shareable text summary"
                  >
                    <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Export Plan</span>
                  </button>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 font-mono text-xs text-slate-300">
                    <Timer className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{activeRoute.executionTimeMs} ms</span>
                  </div>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                    <Ruler className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Total Distance</span>
                  </div>
                  <div className="text-lg font-bold text-slate-100 font-mono">
                    {activeRoute.totalDistance} <span className="text-xs text-slate-400 font-normal">km</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Travel Time</span>
                  </div>
                  <div className="text-lg font-bold text-slate-100 font-mono">
                    {activeRoute.totalTime} <span className="text-xs text-slate-400 font-normal">min</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                    <CircleDollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Estimated Fare</span>
                  </div>
                  <div className="text-lg font-bold text-emerald-400 font-mono">
                    ₹ {activeRoute.totalCost}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                    <Layers className="w-3.5 h-3.5 text-purple-400" />
                    <span>Stops & Transfers</span>
                  </div>
                  <div className="text-lg font-bold text-slate-100 font-mono">
                    {activeRoute.stopsCount} <span className="text-xs text-slate-400 font-normal">({activeRoute.transfers} transfers)</span>
                  </div>
                </div>
              </div>

              {/* Efficiency Score Progress Banner */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/40 via-blue-950/20 to-slate-900 border border-cyan-800/40 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-300">
                    <Award className="w-4 h-4 text-cyan-400" />
                    <span>Multi-Criteria Efficiency Score</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Penalty: -{activeRoute.scoringBreakdown.distanceImpact} (dist) -{activeRoute.scoringBreakdown.timeImpact} (time) -{activeRoute.scoringBreakdown.costImpact} (cost)
                  </p>
                </div>
                <div className="text-2xl font-black font-mono text-cyan-400">
                  {activeRoute.efficiencyScore}
                  <span className="text-xs text-slate-400 font-normal">/100</span>
                </div>
              </div>

              {/* Traversed Path Stepper */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="text-xs font-semibold text-slate-300">Station Traversal Order:</span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {activeRoute.path.map((step, idx) => {
                    const isStart = idx === 0;
                    const isEnd = idx === activeRoute.path.length - 1;
                    return (
                      <div
                        key={step.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              isStart
                                ? 'bg-emerald-500 text-slate-950'
                                : isEnd
                                ? 'bg-amber-500 text-slate-950'
                                : 'bg-slate-800 text-cyan-400 border border-cyan-800'
                            }`}
                          >
                            {isStart ? 'A' : isEnd ? 'B' : idx + 1}
                          </span>
                          <span className="font-medium text-slate-200">{step.name}</span>
                        </div>

                        {step.edgeFromPrev && (
                          <span className="font-mono text-[11px] text-slate-400">
                            +{step.edgeFromPrev.distanceKm} km · {step.edgeFromPrev.timeMin}m · ₹{step.edgeFromPrev.fareInr}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Export Action Bar */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-2">
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Save Travel Plan:</span>
                </span>
                <button
                  onClick={() => setIsExportModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-cyan-200 border border-cyan-900/60 text-xs font-semibold transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Export JSON / Summary</span>
                </button>
              </div>

              {/* Export Modal */}
              <RouteExportModal
                route={activeRoute}
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
              />
            </div>
          )}
        </div>

        {/* Map Panel */}
        <div className="lg:col-span-7 bg-[#0d1322] border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-100 text-sm">Optimal Trajectory Visualizer</h3>
              <p className="text-xs text-slate-400">Interactive geographic rendering of reconstructed path</p>
            </div>
            {activeRoute && activeRoute.success && (
              <span className="px-2.5 py-1 rounded bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 font-mono text-xs flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Path Reconstructed</span>
              </span>
            )}
          </div>

          <div className="flex-1">
            <UnifiedTransitMap
              stops={stops}
              connections={connections}
              activeRoute={activeRoute}
              height="580px"
              onSelectStop={(id) => {
                if (!source) setSource(id);
                else if (!destination) setDestination(id);
                else setDestination(id);
              }}
            />
          </div>
        </div>
      </div>

      {/* Algorithmic Comparison Section */}
      {showComparison && comparisonResult && (
        <div className="bg-[#0d1322] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-slate-100 flex items-center gap-2">
                <GitCompare className="w-4 h-4 text-cyan-400" />
                <span>Algorithm Benchmark & Comparison Matrix</span>
              </h3>
              <p className="text-xs text-slate-400">
                Side-by-side empirical performance for trajectory {comparisonResult.source} &rarr; {comparisonResult.destination}
              </p>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-400">
              {comparisonResult.comparisons.length} Variants Executed
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-mono">
                  <th className="p-3">Algorithm & Objective</th>
                  <th className="p-3">Distance (km)</th>
                  <th className="p-3">Time (min)</th>
                  <th className="p-3">Fare (₹)</th>
                  <th className="p-3">Stops</th>
                  <th className="p-3">Transfers</th>
                  <th className="p-3">DSA Execution</th>
                  <th className="p-3">Efficiency Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {comparisonResult.comparisons.map((c, i) => (
                  <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3 font-semibold text-slate-200 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      <span>{c.label}</span>
                    </td>
                    <td className="p-3 font-mono text-slate-300">{c.distance} km</td>
                    <td className="p-3 font-mono text-slate-300">{c.timeMin} min</td>
                    <td className="p-3 font-mono text-emerald-400">₹ {c.fareInr}</td>
                    <td className="p-3 font-mono text-slate-300">{c.stopsCount}</td>
                    <td className="p-3 font-mono text-slate-300">{c.transfers}</td>
                    <td className="p-3 font-mono text-cyan-400">{c.executionTimeMs} ms</td>
                    <td className="p-3 font-mono">
                      <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-bold border border-cyan-800/60">
                        {c.efficiencyScore} / 100
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
