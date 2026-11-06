import React, { useEffect, useRef, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Activity,
  Layers,
  Zap,
  ArrowRight
} from 'lucide-react';
import { TransitStop, TransitConnection, NetworkAnalytics, RouteComparisonItem } from '../types/transit';

Chart.register(...registerables);

interface AnalyticsViewProps {
  stops: TransitStop[];
  connections: TransitConnection[];
  analytics: NetworkAnalytics | null;
  onBenchmarkCorridor: (source: string, destination: string) => Promise<RouteComparisonItem[]>;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  stops,
  connections,
  analytics,
  onBenchmarkCorridor
}) => {
  const [benchmarkSource, setBenchmarkSource] = useState<string>('PNBS');
  const [benchmarkDest, setBenchmarkDest] = useState<string>('VJA_AIRPORT');
  const [benchmarkItems, setBenchmarkItems] = useState<RouteComparisonItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const latencyChartRef = useRef<HTMLCanvasElement | null>(null);
  const latencyChartInstance = useRef<Chart | null>(null);

  const metricsChartRef = useRef<HTMLCanvasElement | null>(null);
  const metricsChartInstance = useRef<Chart | null>(null);

  const costDistChartRef = useRef<HTMLCanvasElement | null>(null);
  const costDistChartInstance = useRef<Chart | null>(null);

  // Run benchmark on corridor selection
  const runCorridorBenchmark = async (src: string, dest: string) => {
    setIsLoading(true);
    try {
      const items = await onBenchmarkCorridor(src, dest);
      setBenchmarkItems(items);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runCorridorBenchmark(benchmarkSource, benchmarkDest);
  }, []);

  // Update Charts when benchmarkItems changes
  useEffect(() => {
    if (benchmarkItems.length === 0) return;

    const labels = benchmarkItems.map(b => b.label.split(' ')[0]);

    // 1. Latency Chart (DSA Execution time in ms)
    if (latencyChartRef.current) {
      if (latencyChartInstance.current) latencyChartInstance.current.destroy();

      latencyChartInstance.current = new Chart(latencyChartRef.current, {
        type: 'bar',
        data: {
          labels: benchmarkItems.map(b => b.label),
          datasets: [
            {
              label: 'Execution Time (ms)',
              data: benchmarkItems.map(b => b.executionTimeMs),
              backgroundColor: 'rgba(56, 189, 248, 0.5)',
              borderColor: '#38bdf8',
              borderWidth: 1.5,
              borderRadius: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: '#94a3b8', font: { size: 10 } }
            },
            y: {
              grid: { color: 'rgba(51, 65, 85, 0.4)' },
              ticks: { color: '#94a3b8', font: { family: 'JetBrains Mono', size: 10 } }
            }
          }
        }
      });
    }

    // 2. Multi-Metric Distance & Time Chart
    if (metricsChartRef.current) {
      if (metricsChartInstance.current) metricsChartInstance.current.destroy();

      metricsChartInstance.current = new Chart(metricsChartRef.current, {
        type: 'bar',
        data: {
          labels: benchmarkItems.map(b => b.label.slice(0, 15)),
          datasets: [
            {
              label: 'Distance (km)',
              data: benchmarkItems.map(b => b.distance),
              backgroundColor: 'rgba(16, 185, 129, 0.5)',
              borderColor: '#10b981',
              borderWidth: 1,
              borderRadius: 4
            },
            {
              label: 'Time (min)',
              data: benchmarkItems.map(b => b.timeMin),
              backgroundColor: 'rgba(245, 158, 11, 0.5)',
              borderColor: '#f59e0b',
              borderWidth: 1,
              borderRadius: 4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: { color: '#cbd5e1', font: { size: 11 } }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: '#94a3b8', font: { size: 10 } }
            },
            y: {
              grid: { color: 'rgba(51, 65, 85, 0.4)' },
              ticks: { color: '#94a3b8', font: { family: 'JetBrains Mono', size: 10 } }
            }
          }
        }
      });
    }

    // 3. Efficiency Score vs Fare Chart
    if (costDistChartRef.current) {
      if (costDistChartInstance.current) costDistChartInstance.current.destroy();

      costDistChartInstance.current = new Chart(costDistChartRef.current, {
        type: 'line',
        data: {
          labels: benchmarkItems.map(b => b.label.slice(0, 15)),
          datasets: [
            {
              label: 'Route Efficiency Score (0-100)',
              data: benchmarkItems.map(b => b.efficiencyScore),
              borderColor: '#06b6d4',
              backgroundColor: 'rgba(6, 182, 212, 0.1)',
              fill: true,
              tension: 0.3,
              pointBackgroundColor: '#06b6d4',
              pointRadius: 4
            },
            {
              label: 'Estimated Fare (₹)',
              data: benchmarkItems.map(b => b.fareInr),
              borderColor: '#a855f7',
              backgroundColor: 'rgba(168, 85, 247, 0.05)',
              fill: false,
              tension: 0.3,
              pointBackgroundColor: '#a855f7',
              pointRadius: 4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: { color: '#cbd5e1', font: { size: 11 } }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: '#94a3b8', font: { size: 10 } }
            },
            y: {
              grid: { color: 'rgba(51, 65, 85, 0.4)' },
              ticks: { color: '#94a3b8', font: { family: 'JetBrains Mono', size: 10 } }
            }
          }
        }
      });
    }

    return () => {
      if (latencyChartInstance.current) latencyChartInstance.current.destroy();
      if (metricsChartInstance.current) metricsChartInstance.current.destroy();
      if (costDistChartInstance.current) costDistChartInstance.current.destroy();
    };
  }, [benchmarkItems]);

  return (
    <div className="space-y-6">
      {/* Corridor Benchmark Controller */}
      <div className="p-5 rounded-2xl bg-[#0d1322] border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>Empirical Algorithmic Benchmark Suite</span>
          </h3>
          <p className="text-xs text-slate-400">
            Compare latency, optimality guarantees, and cost curves across real DSA executions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={benchmarkSource}
            onChange={(e) => setBenchmarkSource(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
          >
            {stops.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <span className="text-slate-500 text-xs">&rarr;</span>

          <select
            value={benchmarkDest}
            onChange={(e) => setBenchmarkDest(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
          >
            {stops.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <button
            onClick={() => runCorridorBenchmark(benchmarkSource, benchmarkDest)}
            disabled={isLoading || benchmarkSource === benchmarkDest}
            className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs disabled:opacity-50 transition-all cursor-pointer"
          >
            {isLoading ? 'Benchmarking...' : 'Run Benchmark'}
          </button>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Latency */}
        <div className="bg-[#0d1322] border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="font-semibold text-slate-100 text-xs flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span>DSA Execution Latency</span>
              </h4>
              <p className="text-[11px] text-slate-400">Time to compute path in milliseconds</p>
            </div>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800/50">
              ms
            </span>
          </div>
          <div className="h-64 relative flex-1">
            <canvas ref={latencyChartRef} />
          </div>
        </div>

        {/* Chart 2: Distance vs Duration */}
        <div className="bg-[#0d1322] border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="font-semibold text-slate-100 text-xs flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Distance vs Travel Time</span>
              </h4>
              <p className="text-[11px] text-slate-400">Trajectory trade-offs per algorithm</p>
            </div>
          </div>
          <div className="h-64 relative flex-1">
            <canvas ref={metricsChartRef} />
          </div>
        </div>

        {/* Chart 3: Efficiency vs Fare */}
        <div className="bg-[#0d1322] border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="font-semibold text-slate-100 text-xs flex items-center gap-1.5">
                <PieChart className="w-4 h-4 text-purple-400" />
                <span>Efficiency Score vs Fare</span>
              </h4>
              <p className="text-[11px] text-slate-400">Multi-criteria score vs ticket fare</p>
            </div>
          </div>
          <div className="h-64 relative flex-1">
            <canvas ref={costDistChartRef} />
          </div>
        </div>
      </div>

      {/* Benchmark Summary Table */}
      <div className="bg-[#0d1322] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
        <h4 className="font-bold text-slate-100 text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>Algorithmic Execution Metrics Table</span>
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-mono">
                <th className="p-3">Algorithm Variant</th>
                <th className="p-3">Distance (km)</th>
                <th className="p-3">Time (min)</th>
                <th className="p-3">Fare (₹)</th>
                <th className="p-3">Transfers</th>
                <th className="p-3">Execution (ms)</th>
                <th className="p-3">Efficiency Score</th>
                <th className="p-3">Calculated Path Sequence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {benchmarkItems.map((b, i) => (
                <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-3 font-semibold text-slate-200">{b.label}</td>
                  <td className="p-3 text-slate-300">{b.distance}</td>
                  <td className="p-3 text-slate-300">{b.timeMin}</td>
                  <td className="p-3 text-emerald-400">₹ {b.fareInr}</td>
                  <td className="p-3 text-slate-300">{b.transfers}</td>
                  <td className="p-3 text-cyan-400">{b.executionTimeMs} ms</td>
                  <td className="p-3 text-cyan-300 font-bold">{b.efficiencyScore} / 100</td>
                  <td className="p-3 text-[11px] text-slate-400 max-w-xs truncate font-sans">
                    {b.path.join(' → ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
