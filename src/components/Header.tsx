import React from 'react';
import { Database, Navigation, Menu } from 'lucide-react';
import { NavView } from './Sidebar';

interface HeaderProps {
  currentView: NavView;
  onOpenImport: () => void;
  onQuickPlan: () => void;
  isBackendHealthy: boolean;
  onToggleMobile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onOpenImport,
  onQuickPlan,
  isBackendHealthy,
  onToggleMobile
}) => {
  const titles: Record<NavView, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Transportation Network Dashboard',
      subtitle: 'Real-time overview and analytical topology of the Vijayawada transit system.'
    },
    planner: {
      title: 'Multi-Modal Route Planner & Optimizer',
      subtitle: 'Compute optimal transit trajectories using Dijkstra, A* Search, and BFS.'
    },
    analytics: {
      title: 'Algorithmic Route Analytics',
      subtitle: 'Performance benchmarks, cost-distance correlations, and network efficiency distributions.'
    },
    network: {
      title: 'Graph Adjacency Topology',
      subtitle: 'Explore the underlying Adjacency List, node degrees, and import custom transit datasets.'
    },
    dsa: {
      title: 'DSA Engineering & Academic Specifications',
      subtitle: 'Theoretical foundations, time & space complexities, pseudocode, and interactive step stepper.'
    }
  };

  const info = titles[currentView] || titles.dashboard;

  return (
    <header className="min-h-16 md:min-h-20 bg-[#0d1322]/95 backdrop-blur-md border-b border-slate-800 px-4 md:px-6 py-3 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {/* Mobile Menu Button */}
        <button
          onClick={onToggleMobile}
          className="md:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-base md:text-xl font-bold text-slate-100 flex items-center gap-2">
            {info.title}
          </h2>
          <p className="text-[11px] md:text-xs text-slate-400 mt-0.5 line-clamp-1">{info.subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {/* Backend Status indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs">
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isBackendHealthy ? 'bg-emerald-400' : 'bg-rose-400'
            }`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${
              isBackendHealthy ? 'bg-emerald-500' : 'bg-rose-500'
            }`} />
          </span>
          <span className="text-slate-300 font-medium font-mono text-[11px]">
            {isBackendHealthy ? 'DSA REST Engine Online' : 'Engine Offline'}
          </span>
        </div>

        {/* Quick actions */}
        <button
          onClick={onOpenImport}
          className="flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700/60 transition-colors"
          title="Import or modify JSON transit graph data"
        >
          <Database className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Import Data</span>
        </button>

        {currentView !== 'planner' && (
          <button
            onClick={onQuickPlan}
            className="flex items-center gap-1.5 px-3 md:px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-semibold text-xs shadow-md shadow-cyan-500/10 transition-all shrink-0"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Plan Route</span>
          </button>
        )}
      </div>
    </header>
  );
};
