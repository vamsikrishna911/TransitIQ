import React, { useState } from 'react';
import {
  Download,
  Copy,
  Check,
  FileJson,
  FileText,
  Share2,
  X,
  ExternalLink,
  MapPin,
  Clock,
  CircleDollarSign,
  Ruler
} from 'lucide-react';
import { RouteCalculationResult } from '../types/transit';
import {
  generateRouteJson,
  generateRouteTextSummary,
  downloadFile
} from '../utils/routeExport';

interface RouteExportModalProps {
  route: RouteCalculationResult;
  isOpen: boolean;
  onClose: () => void;
}

export const RouteExportModal: React.FC<RouteExportModalProps> = ({
  route,
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'text' | 'json'>('text');
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const origin = route.path[0];
  const dest = route.path[route.path.length - 1];

  const originName = origin?.name || 'Origin';
  const destName = dest?.name || 'Destination';
  const fileBaseName = `transitiq-route-${origin?.id || 'start'}-to-${dest?.id || 'end'}`.toLowerCase();

  const textSummary = generateRouteTextSummary(route);
  const jsonContent = generateRouteJson(route);

  const handleCopy = async () => {
    const textToCopy = activeTab === 'text' ? textSummary : jsonContent;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        // Fallback for environments where clipboard API is constrained
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  const handleDownloadText = () => {
    downloadFile(textSummary, `${fileBaseName}.txt`, 'text/plain;charset=utf-8');
  };

  const handleDownloadJson = () => {
    downloadFile(jsonContent, `${fileBaseName}.json`, 'application/json;charset=utf-8');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#0d1322] border border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                Export & Share Travel Plan
              </h3>
              <p className="text-xs text-slate-400">
                {originName} &rarr; {destName} · {route.totalDistance.toFixed(1)} km · {route.totalTime} min
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Highlights Summary Bar */}
        <div className="grid grid-cols-4 gap-2 p-4 bg-slate-900/30 border-b border-slate-800/80 text-xs">
          <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              <Ruler className="w-3 h-3 text-cyan-400" /> Distance
            </div>
            <div className="font-bold text-slate-200 font-mono mt-0.5">{route.totalDistance.toFixed(1)} km</div>
          </div>
          <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-blue-400" /> Time
            </div>
            <div className="font-bold text-slate-200 font-mono mt-0.5">{route.totalTime} min</div>
          </div>
          <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              <CircleDollarSign className="w-3 h-3 text-emerald-400" /> Fare
            </div>
            <div className="font-bold text-emerald-400 font-mono mt-0.5">₹ {route.totalCost}</div>
          </div>
          <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-amber-400" /> Stops
            </div>
            <div className="font-bold text-slate-200 font-mono mt-0.5">{route.stopsCount}</div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center justify-between px-5 pt-3 border-b border-slate-800/60">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('text')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 -mb-[1px] ${
                activeTab === 'text'
                  ? 'border-cyan-400 text-cyan-400 bg-slate-900/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Shareable Text Summary</span>
            </button>
            <button
              onClick={() => setActiveTab('json')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 -mb-[1px] ${
                activeTab === 'json'
                  ? 'border-cyan-400 text-cyan-400 bg-slate-900/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileJson className="w-3.5 h-3.5" />
              <span>Structured JSON (Data / GIS)</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400">
            {activeTab === 'text' ? 'Ready to copy or save as .txt' : 'Full machine-readable schema'}
          </div>
        </div>

        {/* Tab Content / Preview */}
        <div className="p-5 flex-1 overflow-y-auto">
          {activeTab === 'text' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">Formatted Plain Text Itinerary:</span>
                <span className="text-[11px] text-cyan-400/80 font-mono">
                  {route.path.length} steps · {route.algorithm}
                </span>
              </div>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[11px] leading-relaxed overflow-x-auto whitespace-pre selection:bg-cyan-500/30 max-h-72">
                {textSummary}
              </pre>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">JSON Schema Payload:</span>
                <span className="text-[11px] text-emerald-400/80 font-mono">
                  Valid UTF-8 JSON
                </span>
              </div>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-72">
                {jsonContent}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Copy to Clipboard</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadText}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
              title="Download human-readable itinerary text"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Download .TXT</span>
            </button>

            <button
              onClick={handleDownloadJson}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all"
              title="Download machine-readable JSON route specification"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download JSON</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
