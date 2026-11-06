import React from 'react';
import {
  LayoutDashboard,
  Navigation,
  BarChart3,
  Network,
  Cpu,
  Info,
  RotateCcw,
  X
} from 'lucide-react';

export type NavView = 'dashboard' | 'planner' | 'analytics' | 'network' | 'dsa';

interface SidebarProps {
  currentView: NavView;
  onSelectView: (view: NavView) => void;
  onResetData: () => void;
  stopsCount: number;
  routesCount: number;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  onResetData,
  stopsCount,
  routesCount,
  isMobileOpen = false,
  onCloseMobile
}) => {
  const navItems: Array<{ id: NavView; label: string; icon: React.ReactNode; badge?: string }> = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'planner', label: 'Route Planner', icon: <Navigation className="w-5 h-5" />, badge: 'DSA' },
    { id: 'analytics', label: 'Route Analytics', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'network', label: 'Network Topology', icon: <Network className="w-5 h-5" /> },
    { id: 'dsa', label: 'DSA Academy & Specs', icon: <Cpu className="w-5 h-5" />, badge: 'VIVA' }
  ];

  const handleNavClick = (view: NavView) => {
    onSelectView(view);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 md:static w-72 bg-[#0d1322] border-r border-slate-800 flex flex-col h-screen shrink-0 transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-cyan-500/20">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-400 bg-clip-text text-transparent">
                  TransitIQ
                </h1>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-semibold">
                  v1.0
                </span>
              </div>
              <p className="text-xs text-slate-400 tracking-wide font-medium">Smart Routes. Better Journeys.</p>
            </div>
          </div>

          {/* Mobile Close Button */}
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1.5 flex-1 overflow-y-auto">
          <div className="px-3 py-1.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Routing & Analytics
          </div>

          {navItems.map(item => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/15 to-blue-500/5 text-cyan-300 border-l-4 border-cyan-400 shadow-sm'
                    : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-cyan-400' : 'text-slate-400'}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                    isActive ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Network Stats Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#090d18]/60 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Active Graph:</span>
            <span className="font-mono text-cyan-400 font-medium">{stopsCount} Stops · {routesCount} Edges</span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
            <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>Academic Demonstration</span>
            </div>
            <p className="leading-relaxed text-[11px] text-slate-400">
              Vijayawada transit network (AP, India). All fares and times are simulated research metrics.
            </p>
          </div>

          <button
            onClick={onResetData}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700/80 text-xs text-slate-300 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Network Dataset</span>
          </button>
        </div>
      </aside>
    </>
  );
};
