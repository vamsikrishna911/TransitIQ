import React, { useState } from 'react';
import {
  Network,
  Upload,
  RotateCcw,
  Search,
  ExternalLink,
  MapPin,
  GitCommit,
  CheckCircle2,
  FileJson,
  Layers,
  ArrowRight
} from 'lucide-react';
import { UnifiedTransitMap } from './UnifiedTransitMap';
import { TransitStop, TransitConnection } from '../types/transit';

interface NetworkViewProps {
  stops: TransitStop[];
  connections: TransitConnection[];
  onImportData: (stops: TransitStop[], connections: TransitConnection[], replace: boolean) => Promise<void>;
  onResetData: () => Promise<void>;
  onSelectForPlanning: (sourceId: string, destId: string) => void;
}

export const NetworkView: React.FC<NetworkViewProps> = ({
  stops,
  connections,
  onImportData,
  onResetData,
  onSelectForPlanning
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [jsonInput, setJsonInput] = useState<string>('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  const stopMap = new Map<string, TransitStop>();
  stops.forEach(s => stopMap.set(s.id, s));

  const filteredConnections = connections.filter(c => {
    const fromName = stopMap.get(c.from)?.name.toLowerCase() || '';
    const toName = stopMap.get(c.to)?.name.toLowerCase() || '';
    const term = searchTerm.toLowerCase();
    return c.from.toLowerCase().includes(term) ||
           c.to.toLowerCase().includes(term) ||
           fromName.includes(term) ||
           toName.includes(term);
  });

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setImportError(null);
    setImportSuccess(null);

    try {
      const parsed = JSON.parse(jsonInput);
      if (!parsed.stops || !parsed.connections) {
        throw new Error("JSON payload must contain 'stops' and 'connections' arrays.");
      }
      await onImportData(parsed.stops, parsed.connections, true);
      setImportSuccess(`Successfully imported ${parsed.stops.length} stops and ${parsed.connections.length} routes.`);
      setTimeout(() => setIsImportModalOpen(false), 1500);
    } catch (err: any) {
      setImportError(err.message || 'Invalid JSON format');
    }
  };

  const loadSamplePayload = () => {
    setJsonInput(JSON.stringify({ stops, connections }, null, 2));
  };

  return (
    <div className="space-y-6">
      {/* Network Header Banner */}
      <div className="p-6 rounded-2xl bg-[#0d1322] border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-semibold">
              G = (V, E)
            </span>
            <h2 className="text-xl font-bold text-slate-100">Transportation Network Graph</h2>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            Adjacency list topology modeling transit hubs as vertices and road segments as weighted undirected edges.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              loadSamplePayload();
              setIsImportModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>Import Custom Dataset</span>
          </button>

          <button
            onClick={onResetData}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs border border-slate-800 transition-colors"
            title="Restore original dataset"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Visual Network Map */}
      <div className="bg-[#0d1322] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
            <Network className="w-4 h-4 text-cyan-400" />
            <span>Interactive Network Map</span>
          </h3>
          <span className="text-xs font-mono text-slate-400">
            {stops.length} Nodes · {connections.length} Segments
          </span>
        </div>
        <UnifiedTransitMap stops={stops} connections={connections} height="420px" />
      </div>

      {/* Adjacency List & Edge Registry */}
      <div className="bg-[#0d1322] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="font-bold text-slate-100 text-sm">Adjacency List & Edge Registry</h3>
            <p className="text-xs text-slate-400">Direct connections, distances, estimated durations, and fares</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search station or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-mono">
                <th className="p-3">Origin (u)</th>
                <th className="p-3">Destination (v)</th>
                <th className="p-3">Distance</th>
                <th className="p-3">Time</th>
                <th className="p-3">Fare</th>
                <th className="p-3">Mode</th>
                <th className="p-3 text-right">Quick Plan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredConnections.map((edge, i) => {
                const u = stopMap.get(edge.from);
                const v = stopMap.get(edge.to);
                return (
                  <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3">
                      <div className="font-semibold text-slate-200">{u?.name || edge.from}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{edge.from} · {u?.type}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-200">{v?.name || edge.to}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{edge.to} · {v?.type}</div>
                    </td>
                    <td className="p-3 font-mono text-slate-300">{edge.distanceKm} km</td>
                    <td className="p-3 font-mono text-slate-300">{edge.timeMin} min</td>
                    <td className="p-3 font-mono text-emerald-400 font-semibold">₹ {edge.fareInr}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono capitalize">
                        {edge.mode}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => onSelectForPlanning(edge.from, edge.to)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        <span>Calculate</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dataset Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0d1322] border border-slate-800 rounded-2xl p-6 max-w-2xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileJson className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-slate-100 text-sm">Import Custom Transportation Dataset</h3>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                Close
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Paste a custom JSON object containing <code className="text-cyan-300">stops</code> and <code className="text-cyan-300">connections</code> arrays. The backend will parse, validate, and rebuild the transit adjacency list in memory.
            </p>

            <form onSubmit={handleImportSubmit} className="space-y-3">
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                rows={12}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                placeholder='{ "stops": [...], "connections": [...] }'
                required
              />

              {importError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  {importError}
                </div>
              )}

              {importSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{importSuccess}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={loadSamplePayload}
                  className="text-xs text-cyan-400 hover:underline"
                >
                  Load Active Dataset Template
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsImportModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20"
                  >
                    Rebuild Transit Graph
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
