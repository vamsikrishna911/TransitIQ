import React, { useState, useEffect } from 'react';
import { Sidebar, NavView } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { RoutePlannerView } from './components/RoutePlannerView';
import { AnalyticsView } from './components/AnalyticsView';
import { NetworkView } from './components/NetworkView';
import { AlgorithmExplorerView } from './components/AlgorithmExplorerView';
import {
  TransitStop,
  TransitConnection,
  NetworkAnalytics,
  RouteCalculationResult,
  RouteComparisonResult,
  RouteComparisonItem,
  OptimizationCriterion,
  AlgorithmType,
  TransportMode
} from './types/transit';

import { AlertTriangle, ExternalLink } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<NavView>('dashboard');
  const [stops, setStops] = useState<TransitStop[]>([]);
  const [connections, setConnections] = useState<TransitConnection[]>([]);
  const [analytics, setAnalytics] = useState<NetworkAnalytics | null>(null);
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean>(true);
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  const [quotaExceeded, setQuotaExceeded] = useState<boolean>(false);

  // Listen for Google Maps quota exceeded event (Tier 2 quota defense)
  useEffect(() => {
    const handleQuotaExceeded = () => {
      setQuotaExceeded(true);
    };
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    return () => {
      window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    };
  }, []);

  // Planner state
  const [plannerSource, setPlannerSource] = useState<string>('PNBS');
  const [plannerDest, setPlannerDest] = useState<string>('BENZ_CIR');
  const [activeRoute, setActiveRoute] = useState<RouteCalculationResult | null>(null);
  const [comparisonResult, setComparisonResult] = useState<RouteComparisonResult | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial data from REST backend
  const loadSystemData = async () => {
    try {
      const [healthRes, stopsRes, routesRes, analyticsRes] = await Promise.all([
        fetch('/api/health'),
        fetch('/api/stops'),
        fetch('/api/routes'),
        fetch('/api/analytics')
      ]);

      if (healthRes.ok) setIsBackendHealthy(true);
      else setIsBackendHealthy(false);

      if (stopsRes.ok) {
        const stopsData = await stopsRes.json();
        setStops(stopsData);
      }

      if (routesRes.ok) {
        const routesData = await routesRes.json();
        setConnections(routesData);
      }

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setAnalytics(analyticsData);
      }
    } catch (err) {
      console.error('Failed to communicate with TransitIQ backend:', err);
      setIsBackendHealthy(false);
    }
  };

  useEffect(() => {
    loadSystemData();
  }, []);

  // Compute Optimal Route via backend API
  const handleCalculateRoute = async (
    source: string,
    destination: string,
    algorithm: AlgorithmType,
    optimizeBy: OptimizationCriterion,
    mode: TransportMode
  ) => {
    if (source === destination) {
      setError('Origin and destination stations must be distinct.');
      return;
    }

    setIsCalculating(true);
    setError(null);

    try {
      const response = await fetch('/api/route/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, destination, algorithm, optimizeBy, mode })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to compute route.');
        setActiveRoute(null);
      } else {
        setActiveRoute(data);
      }
    } catch (err: any) {
      setError('Connection failure while reaching route calculation API.');
      setActiveRoute(null);
    } finally {
      setIsCalculating(false);
    }
  };

  // Compare all algorithms via backend API
  const handleCompareRoutes = async (source: string, destination: string) => {
    setIsComparing(true);
    setError(null);

    try {
      const response = await fetch('/api/route/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, destination })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to execute algorithm comparison matrix.');
      } else {
        setComparisonResult(data);
      }
    } catch (err) {
      setError('Error communicating with algorithm comparison engine.');
    } finally {
      setIsComparing(false);
    }
  };

  // Benchmark a corridor from analytics view
  const handleBenchmarkCorridor = async (
    source: string,
    destination: string
  ): Promise<RouteComparisonItem[]> => {
    const response = await fetch('/api/route/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source, destination })
    });
    if (!response.ok) {
      throw new Error('Benchmark failed');
    }
    const data: RouteComparisonResult = await response.json();
    return data.comparisons;
  };

  // Import custom dataset via backend API
  const handleImportData = async (
    newStops: TransitStop[],
    newConnections: TransitConnection[],
    replace: boolean
  ) => {
    const response = await fetch('/api/data/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stops: newStops, connections: newConnections, replace })
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || 'Import failed');
    }

    await loadSystemData();
  };

  // Reset dataset to initial state
  const handleResetData = async () => {
    try {
      const res = await fetch('/api/data/reset', { method: 'POST' });
      if (res.ok) {
        await loadSystemData();
        setActiveRoute(null);
        setComparisonResult(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Navigation shortcuts
  const handleNavigateToPlanner = (src?: string, dest?: string) => {
    if (src) setPlannerSource(src);
    if (dest) setPlannerDest(dest);
    setCurrentView('planner');
  };

  return (
    <div className="flex min-h-screen bg-[#0b0f19] text-slate-100 selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onSelectView={setCurrentView}
        onResetData={handleResetData}
        stopsCount={stops.length}
        routesCount={connections.length}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {quotaExceeded && (
          <div className="bg-amber-950/90 border-b border-amber-500/50 text-amber-200 px-4 py-2.5 text-xs flex items-center justify-between gap-3 z-50">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Google Maps Demo Quota Limit:</strong> The demo key quota has been reached for today. The application has automatically switched to the Leaflet OpenStreetMap fallback engine.
              </span>
            </div>
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-amber-300 hover:text-white underline font-medium shrink-0"
            >
              Learn More <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        <Header
          currentView={currentView}
          onOpenImport={() => setCurrentView('network')}
          onQuickPlan={() => handleNavigateToPlanner()}
          isBackendHealthy={isBackendHealthy}
          onToggleMobile={() => setIsMobileOpen(prev => !prev)}
        />

        <main className="p-6 md:p-8 flex-1 max-w-7xl w-full mx-auto">
          {currentView === 'dashboard' && (
            <DashboardView
              stops={stops}
              connections={connections}
              analytics={analytics}
              onNavigateToPlanner={handleNavigateToPlanner}
              activeRoute={activeRoute}
            />
          )}

          {currentView === 'planner' && (
            <RoutePlannerView
              stops={stops}
              connections={connections}
              initialSource={plannerSource}
              initialDestination={plannerDest}
              activeRoute={activeRoute}
              onCalculateRoute={handleCalculateRoute}
              onCompareRoutes={handleCompareRoutes}
              comparisonResult={comparisonResult}
              isCalculating={isCalculating}
              isComparing={isComparing}
              error={error}
              onResetRoute={() => {
                setActiveRoute(null);
                setComparisonResult(null);
                setError(null);
              }}
            />
          )}

          {currentView === 'analytics' && (
            <AnalyticsView
              stops={stops}
              connections={connections}
              analytics={analytics}
              onBenchmarkCorridor={handleBenchmarkCorridor}
            />
          )}

          {currentView === 'network' && (
            <NetworkView
              stops={stops}
              connections={connections}
              onImportData={handleImportData}
              onResetData={handleResetData}
              onSelectForPlanning={(s, d) => handleNavigateToPlanner(s, d)}
            />
          )}

          {currentView === 'dsa' && (
            <AlgorithmExplorerView
              stops={stops}
              connections={connections}
            />
          )}
        </main>
      </div>
    </div>
  );
}
