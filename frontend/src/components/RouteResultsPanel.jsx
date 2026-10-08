import React from 'react';
import { Navigation, Clock, ShieldCheck, AlertTriangle, CheckCircle2, Info, MapPin, CloudRain, Gauge, Mountain, ArrowRight } from 'lucide-react';

const ROUTE_ACCENTS = [
  { border: 'border-emerald-500', bg: 'bg-emerald-500/10', text: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  { border: 'border-amber-500', bg: 'bg-amber-500/10', text: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  { border: 'border-blue-500', bg: 'bg-blue-500/10', text: 'text-blue-400', badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40' }
];

export default function RouteResultsPanel({ routeData, selectedRouteId, onSelectRoute }) {
  if (!routeData || !routeData.routes || routeData.routes.length === 0) {
    return null;
  }

  const { routes, recommendedRouteId } = routeData;
  const activeRoute = routes.find(r => r.id === selectedRouteId) || routes[0];
  const recommendedRoute = routes.find(r => r.id === recommendedRouteId) || routes[0];

  const formatDuration = (secs) => {
    const mins = Math.round(secs / 60);
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const remMins = mins % 60;
      return `${hrs} h ${remMins} min`;
    }
    return `~${mins} min`;
  };

  const formatDistance = (meters) => {
    return `${(meters / 1000).toFixed(1)} km`;
  };

  const detectedHotspots = activeRoute.risk?.detectedHotspots || [];
  const textualEvidences = activeRoute.historicalIntelligence?.textualEvidences || [];

  return (
    <div className="space-y-6">
      
      {/* 4. RECOMMENDED ROUTE HERO BANNER */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-950 border border-emerald-500/40 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-extrabold uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              RECOMMENDED ROUTE
            </div>

            <h3 className="text-2xl font-black text-white flex items-center gap-2">
              {recommendedRoute.name}
            </h3>

            <p className="text-xs text-slate-300 font-medium">
              Lower estimated waterlogging risk with a reasonable travel-time tradeoff.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-4 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 shrink-0">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Risk Score</span>
              <span className={`text-xl font-black ${
                recommendedRoute.risk.maximum >= 75 ? 'text-rose-400' : recommendedRoute.risk.maximum >= 50 ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {recommendedRoute.risk.average} <span className="text-xs text-slate-500 font-normal">/ 100</span>
              </span>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Peak Risk</span>
              <span className="text-xl font-black text-amber-300">
                {recommendedRoute.risk.maximum}
              </span>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Distance / Time</span>
              <span className="text-sm font-extrabold text-white block">
                {formatDistance(recommendedRoute.distanceMeters)} · {formatDuration(recommendedRoute.durationSeconds)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Route Comparison Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-base font-extrabold text-white flex items-center gap-2 uppercase tracking-wider">
            <Navigation className="w-4 h-4 text-teal-400" />
            Route Comparison ({routes.length} Genuine Alternatives)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Evaluated by OpenRouteService routing engine & FloodSafe risk analysis layer
          </p>
        </div>

        {routeData.mode === 'historical' && (
          <span className="text-xs text-amber-300 bg-amber-950/50 border border-amber-800/60 px-3 py-1 rounded-full font-semibold">
            Historical Replay — July 8, 2023
          </span>
        )}
      </div>

      {/* 3. ROUTE CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {routes.map((r, idx) => {
          const isSelected = r.id === activeRoute.id;
          const isRec = r.id === recommendedRouteId;
          const timeDiffMins = Math.round((r.durationSeconds - recommendedRoute.durationSeconds) / 60);
          const accent = ROUTE_ACCENTS[idx % ROUTE_ACCENTS.length];
          const hasHotspot = r.risk?.detectedHotspots && r.risk.detectedHotspots.length > 0;

          return (
            <div
              key={r.id}
              onClick={() => onSelectRoute(r.id)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                isSelected
                  ? `bg-slate-950 ${accent.border} shadow-xl ring-1 ${accent.border}`
                  : 'bg-slate-950/60 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900/50'
              }`}
            >
              {/* Card Header & Badges */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                    isRec ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : `${accent.badge} border`
                  }`}>
                    {isRec ? 'RECOMMENDED' : `OPTION ${idx + 1}`}
                  </span>

                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md border ${
                    r.severityLevel === 'SEVERE' || r.severityLevel === 'HIGH'
                      ? 'bg-rose-950/60 text-rose-300 border-rose-800'
                      : r.severityLevel === 'MODERATE'
                      ? 'bg-amber-950/60 text-amber-300 border-amber-800'
                      : 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                  }`}>
                    {r.severityLevel} RISK
                  </span>
                </div>

                <h4 className="text-base font-bold text-white pt-1">
                  {r.name}
                </h4>

                {/* Risk Score & Peak */}
                <div className="text-xs text-slate-300 font-mono">
                  <span className="font-bold text-white">{r.risk.average}</span> average · <span className="font-bold text-amber-300">{r.risk.maximum}</span> peak
                </div>

                {/* Distance & Time */}
                <div className="text-xs text-slate-400 font-medium">
                  {formatDistance(r.distanceMeters)} · {formatDuration(r.durationSeconds)}
                  {timeDiffMins > 0 && <span className="text-amber-400 ml-1.5">(+{timeDiffMins}m detour)</span>}
                </div>
              </div>

              {/* Hotspot Alert Indicator */}
              {hasHotspot ? (
                <div className="text-[11px] text-amber-300 font-semibold bg-amber-950/40 border border-amber-800/50 p-2 rounded-xl flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>⚠ Historical hotspot nearby</span>
                </div>
              ) : (
                <div className="text-[11px] text-emerald-400 font-medium bg-emerald-950/30 border border-emerald-800/30 p-2 rounded-xl flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>No direct hotspot detected</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 5. WHY THIS ROUTE HAS THIS RISK (Selected Route Detailed Risk Analysis) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm space-y-6">
        
        {/* Selected Route Title */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-teal-400" />
              Why this route has this risk: {activeRoute.name}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Distance: {formatDistance(activeRoute.distanceMeters)} | Duration: {formatDuration(activeRoute.durationSeconds)} | Risk Score: {activeRoute.risk.average}/100
            </p>
          </div>

          <span className={`text-xs font-extrabold uppercase px-3 py-1 rounded-lg border ${
            activeRoute.isRecommended
              ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
              : 'bg-slate-800 text-slate-300 border-slate-700'
          }`}>
            {activeRoute.isRecommended ? '★ Recommended Safe Choice' : 'Selected Option'}
          </span>
        </div>

        {/* Historical Hotspot Emphasis Section */}
        {detectedHotspots.length > 0 ? (
          <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-950/60 via-amber-950/40 to-slate-950 border border-amber-500/50 shadow-xl space-y-3">
            <div className="flex items-center gap-2 text-rose-400 font-extrabold text-sm uppercase tracking-wider">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <span>Documented Historical Waterlogging Hotspot</span>
            </div>

            {detectedHotspots.map((spot, idx) => (
              <div key={idx} className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-black text-white">{spot.name}</h4>
                  <span className="text-xs font-extrabold text-amber-300 bg-amber-950 border border-amber-700 px-3 py-1 rounded-full">
                    {spot.distanceMeters}m from route
                  </span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  Documented waterlogging location during the July 8, 2023 heavy-rain event.
                </p>
                <p className="text-[11px] text-slate-400 pt-1">
                  <strong>Source:</strong> {spot.source || 'Indian Express'} / {spot.coordinateSource || 'Delhi Government PWD document'}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>No coordinate-backed historical waterlogging hotspot detected along this route.</span>
          </div>
        )}

        {/* Textual Evidence List */}
        {textualEvidences.length > 0 && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
            <span className="font-bold text-slate-300 block uppercase tracking-wider">
              Additional Textual Flood Evidence (July 8, 2023 Event):
            </span>
            <div className="flex flex-wrap gap-2">
              {textualEvidences.map((ev, idx) => (
                <span key={idx} className="bg-slate-900 border border-slate-700 px-2.5 py-1 rounded-md text-slate-300">
                  • {ev.name} ({ev.severity} severity)
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Explanations List */}
        <div className="space-y-3">
          <h4 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider">
            Risk Explanation Summary
          </h4>
          <div className="space-y-2">
            {activeRoute.riskExplanation && activeRoute.riskExplanation.map((exp, idx) => (
              <div key={idx} className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-200 flex items-start gap-2.5">
                <span className="text-teal-400 font-bold shrink-0">•</span>
                <span>{exp}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 4-Component Risk Breakdown Progress Bars */}
        <div className="space-y-4 pt-2 border-t border-slate-800">
          <h4 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider">
            4-Component Risk Breakdown
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <CloudRain className="w-3.5 h-3.5 text-cyan-400" /> Rainfall Intensity (30%)
                </span>
                <span className="font-bold text-cyan-300">{activeRoute.risk.components?.rainfallRisk || 0} / 100</span>
              </div>
              <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div className="h-full bg-cyan-400 transition-all duration-500" style={{ width: `${activeRoute.risk.components?.rainfallRisk || 0}%` }} />
              </div>
            </div>

            <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" /> Historical Waterlogging (35%)
                </span>
                <span className="font-bold text-amber-300">{activeRoute.risk.components?.historicalWaterloggingRisk || 0} / 100</span>
              </div>
              <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div className="h-full bg-amber-400 transition-all duration-500" style={{ width: `${activeRoute.risk.components?.historicalWaterloggingRisk || 0}%` }} />
              </div>
            </div>

            <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-teal-400" /> Historical Similarity (20%)
                </span>
                <span className="font-bold text-teal-300">{activeRoute.risk.components?.rainfallSimilarityRisk || 0} / 100</span>
              </div>
              <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div className="h-full bg-teal-400 transition-all duration-500" style={{ width: `${activeRoute.risk.components?.rainfallSimilarityRisk || 0}%` }} />
              </div>
            </div>

            <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Mountain className="w-3.5 h-3.5 text-emerald-400" /> Terrain Elevation (15%)
                </span>
                <span className="font-bold text-emerald-300">{activeRoute.risk.components?.terrainRisk || 0} / 100</span>
              </div>
              <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div className="h-full bg-emerald-400 transition-all duration-500" style={{ width: `${activeRoute.risk.components?.terrainRisk || 0}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="pt-2 text-[11px] text-slate-400 flex items-center gap-1.5 border-t border-slate-800">
          <Info className="w-3.5 h-3.5 text-teal-400 shrink-0" />
          <span>FloodSafe risk indicators express estimated waterlogging probability based on historically documented evidence and elevation profiles.</span>
        </div>
      </div>
    </div>
  );
}

