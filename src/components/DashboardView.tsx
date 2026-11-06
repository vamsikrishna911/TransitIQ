import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import {
  MapPin,
  GitCommit,
  Ruler,
  Clock,
  CircleDollarSign,
  Share2,
  Navigation,
  ArrowRight,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { LeafletTransitMap } from './LeafletTransitMap';
import { TransitStop, TransitConnection, NetworkAnalytics, RouteCalculationResult } from '../types/transit';

Chart.register(...registerables);

interface DashboardViewProps {
  stops: TransitStop[];
  connections: TransitConnection[];
  analytics: NetworkAnalytics | null;
  onNavigateToPlanner: (source?: string, destination?: string) => void;
  activeRoute: RouteCalculationResult | null;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stops,
  connections,
  analytics,
  onNavigateToPlanner,
  activeRoute
}) => {
  const chartCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  // Render Degree Distribution Chart
  useEffect(() => {
    if (!chartCanvasRef.current || !analytics?.degreeDistribution) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const labels = analytics.degreeDistribution.map(d => {
      // Truncate long names for chart readability
      return d.name.length > 18 ? d.name.slice(0, 16) + '...' : d.name;
    });
    const dataValues = analytics.degreeDistribution.map(d => d.degree);

    chartInstanceRef.current = new Chart(chartCanvasRef.current, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Incident Connections (Degree)',
            data: dataValues,
            backgroundColor: 'rgba(6, 182, 212, 0.45)',
            borderColor: '#06b6d4',
            borderWidth: 1.5,
            borderRadius: 6,
            hoverBackgroundColor: 'rgba(6, 182, 212, 0.75)'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: '#0f172a',
            titleColor: '#f8fafc',
            bodyColor: '#38bdf8',
            borderColor: '#334155',
            borderWidth: 1,
            padding: 10,
            displayColors: false
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: '#94a3b8',
              font: { size: 10, family: 'Inter' },
              maxRotation: 45,
              minRotation: 25
            }
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(51, 65, 85, 0.4)' },
            ticks: {
              color: '#94a3b8',
              stepSize: 1,
              font: { family: 'JetBrains Mono', size: 11 }
            }
          }
        }
      }
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [analytics]);

  const kpis = [
    {
      label: 'Total Transit Stops',
      value: analytics?.totalStops ?? stops.length,
      sub: 'Graph Vertices (|V|)',
      icon: <MapPin className="w-5 h-5 text-cyan-400" />,
      color: 'from-cyan-500/10 to-transparent'
    },
    {
      label: 'Active Route Segments',
      value: analytics?.totalRoutes ?? connections.length,
      sub: 'Undirected Edges (|E|)',
      icon: <GitCommit className="w-5 h-5 text-blue-400" />,
      color: 'from-blue-500/10 to-transparent'
    },
    {
      label: 'Average Hop Distance',
      value: `${analytics?.avgDistanceKm ?? 5.2} km`,
      sub: 'Calculated road baseline',
      icon: <Ruler className="w-5 h-5 text-emerald-400" />,
      color: 'from-emerald-500/10 to-transparent'
    },
    {
      label: 'Average Segment Time',
      value: `${analytics?.avgTimeMin ?? 14} min`,
      sub: 'Estimated transit weight',
      icon: <Clock className="w-5 h-5 text-amber-400" />,
      color: 'from-amber-500/10 to-transparent'
    },
    {
      label: 'Average Base Fare',
      value: `₹ ${analytics?.avgCostInr ?? 22}`,
      sub: 'Simulated fare per leg',
      icon: <CircleDollarSign className="w-5 h-5 text-purple-400" />,
      color: 'from-purple-500/10 to-transparent'
    },
    {
      label: 'Highest Centrality Hub',
      value: analytics?.mostConnectedNode ? analytics.mostConnectedNode.id : 'BENZ_CIR',
      sub: `${analytics?.mostConnectedNode?.degree ?? 4} direct connections`,
      icon: <Share2 className="w-5 h-5 text-rose-400" />,
      color: 'from-rose-500/10 to-transparent'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0f172a] via-[#111c33] to-[#0a1326] border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800/60 text-cyan-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>DSA-Powered Transit Intelligence</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-100 tracking-tight">
              Vijayawada Public Transportation Graph
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl">
              Algorithmic modeling of bus and rail corridors connecting Central Terminals, Interstate Bus Station (PNBS), Benz Circle, and Vijayawada Airport using Adjacency Lists and Min-Heap Priority Queues.
            </p>
          </div>

          <button
            onClick={() => onNavigateToPlanner('PNBS', 'BENZ_CIR')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/20 transition-all shrink-0"
          >
            <Navigation className="w-4 h-4" />
            <span>Launch Route Planner</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {kpis.map((kpi, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-xl bg-[#0d1322] border border-slate-800/80 bg-gradient-to-b ${kpi.color} shadow-sm hover:border-slate-700 transition-colors`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-xs font-medium">{kpi.label}</span>
              <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                {kpi.icon}
              </div>
            </div>
            <div className="text-xl font-bold text-slate-100 font-mono tracking-tight">
              {kpi.value}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Main Visuals: Leaflet Network Map + Degree Connectivity Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Map Panel */}
        <div className="lg:col-span-7 bg-[#0d1322] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-100 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-400" />
                <span>Geospatial Transit Network</span>
              </h3>
              <p className="text-xs text-slate-400">
                Click any station node or road edge to inspect coordinates and transit weights.
              </p>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950/70 border border-cyan-800/50 text-cyan-400">
              CartoDB Dark Matter
            </span>
          </div>

          <LeafletTransitMap
            stops={stops}
            connections={connections}
            activeRoute={activeRoute}
            height="440px"
          />
        </div>

        {/* Station Connectivity Chart & Quick Search */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Degree Chart */}
          <div className="bg-[#0d1322] border border-slate-800 rounded-2xl p-5 shadow-lg flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-slate-100 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  <span>Station Connectivity (Node Degree)</span>
                </h3>
                <p className="text-xs text-slate-400">Number of incident edges per vertex</p>
              </div>
              <span className="text-xs font-mono text-slate-400">deg(v)</span>
            </div>

            <div className="h-64 w-full relative flex-1">
              <canvas ref={chartCanvasRef} />
            </div>
          </div>

          {/* Quick Route Shortcuts */}
          <div className="bg-[#0d1322] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Navigation className="w-3.5 h-3.5 text-cyan-400" />
              <span>Recommended High-Traffic Corridors</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={() => onNavigateToPlanner('PNBS', 'BENZ_CIR')}
                className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800/70 text-left transition-all group"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-slate-200 group-hover:text-cyan-300">
                  <span>PNBS &rarr; Benz Circle</span>
                  <span className="text-[10px] text-cyan-400 font-mono">4.5 km</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">Commercial Transit Trunk Line</p>
              </button>

              <button
                onClick={() => onNavigateToPlanner('VJA_RLY', 'VJA_AIRPORT')}
                className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800/70 text-left transition-all group"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-slate-200 group-hover:text-cyan-300">
                  <span>Railway &rarr; Airport</span>
                  <span className="text-[10px] text-cyan-400 font-mono">22.5 km</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">High-Speed Express Corridor</p>
              </button>

              <button
                onClick={() => onNavigateToPlanner('BENZ_CIR', 'AUTO_NGR')}
                className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800/70 text-left transition-all group"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-slate-200 group-hover:text-cyan-300">
                  <span>Benz Circle &rarr; Autonagar</span>
                  <span className="text-[10px] text-cyan-400 font-mono">3.1 km</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">Industrial Commuter Route</p>
              </button>

              <button
                onClick={() => onNavigateToPlanner('GOV_PET', 'PORANKI')}
                className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800/70 text-left transition-all group"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-slate-200 group-hover:text-cyan-300">
                  <span>Governorpet &rarr; Poranki</span>
                  <span className="text-[10px] text-cyan-400 font-mono">13.2 km</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">East Highway Suburb Link</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
