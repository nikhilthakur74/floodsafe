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

  const fastestRoute = routes.reduce((prev, curr) => curr.durationSeconds < prev.durationSeconds ? curr : prev, routes[0]);
  const isFlipScenario = recommendedRoute.id !== fastestRoute.id;
  const timeDiffMins = isFlipScenario ? Math.max(1, Math.round((recommendedRoute.durationSeconds - fastestRoute.durationSeconds) / 60)) : 0;

  const detectedHotspots = activeRoute.risk?.detectedHotspots || [];
  const textualEvidences = activeRoute.historicalIntelligence?.textualEvidences || [];

  const isLiveMode = routeData.scenarioMode === 'live' || routeData.mode === 'live';
  const isWeatherUnavailable = isLiveMode && (routeData.dataStatus?.weather?.status === 'unavailable' || routeData.liveRiskAssessed === false || activeRoute.risk?.liveRiskAssessed === false);
  const isElevationUnavailable = routeData.dataStatus?.elevation?.status === 'unavailable' || activeRoute.risk?.components?.terrainRisk === null;

  return (
    <div className="space-y-6">
      
      {/* LIVE RISK UNAVAILABLE WARNING BANNER */}
      {isWeatherUnavailable && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/90 via-rose-950/80 to-slate-950 border border-amber-500/60 shadow-2xl space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-extrabold text-sm uppercase tracking-wider">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <span>Live Risk Assessment Unavailable</span>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed">
            {routeData.dataStatus?.weather?.message || 'Live weather forecast data is currently unavailable (HTTP 429 Rate Limited or network error). Live flood risk could not be assessed.'}
          </p>
          <div className="text-[11px] text-amber-300/90 font-semibold bg-amber-950/60 border border-amber-800/60 px-3 py-1.5 rounded-lg inline-block">
            💡 Tip: Switch to <strong>Historical Replay</strong> mode to analyze route flood risks using documented historical storm datasets.
          </div>
        </div>
      )}

      {/* 1. RECOMMENDED ROUTE HERO BANNER */}
      <div className={`p-6 rounded-2xl bg-gradient-to-r ${
        isWeatherUnavailable
          ? 'from-slate-900 via-slate-900 to-amber-950/40 border-amber-500/40'
          : 'from-emerald-950/80 via-slate-900 to-slate-950 border-emerald-500/40'
      } border shadow-2xl relative overflow-hidden`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5 max-w-xl">
            <div className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider ${
              isWeatherUnavailable
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
            }`}>
              {isWeatherUnavailable ? <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
              {isWeatherUnavailable ? 'LIVE RISK UNASSESSED' : 'RECOMMENDED ROUTE'}
            </div>

            <h3 className="text-2xl font-black text-white flex items-center gap-2">
              {recommendedRoute.name}
            </h3>

            <p className="text-xs text-slate-300 font-medium leading-relaxed">
              {isWeatherUnavailable
                ? 'Route selected based on travel duration because live flood risk could not be assessed.'
                : 'Comparatively preferable alternative with lower estimated waterlogging risk among available options.'}
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-4 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 shrink-0">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Prototype Risk Index</span>
              {isWeatherUnavailable || recommendedRoute.risk.average === null ? (
                <span className="text-base font-bold text-amber-400">N/A <span className="text-[10px] text-slate-400 font-normal">(Live weather offline)</span></span>
              ) : (
                <span className={`text-xl font-black ${
                  recommendedRoute.risk.maximum >= 75 ? 'text-rose-400' : recommendedRoute.risk.maximum >= 50 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {recommendedRoute.risk.average} <span className="text-xs text-slate-500 font-normal">/ 100</span>
                </span>
              )}
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Peak Risk Index</span>
              {isWeatherUnavailable || recommendedRoute.risk.maximum === null ? (
                <span className="text-base font-bold text-amber-400">N/A</span>
              ) : (
                <span className="text-xl font-black text-amber-300">
                  {recommendedRoute.risk.maximum} <span className="text-xs text-slate-500 font-normal">/ 100</span>
                </span>
              )}
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

      {/* Dynamic Route Flip Rationale Banner */}
      {isFlipScenario && !isWeatherUnavailable && (
        <div className="p-4.5 rounded-xl bg-gradient-to-r from-teal-950/90 via-slate-900 to-slate-950 border border-teal-500/50 shadow-lg text-xs flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-sm">
                Fastest Route ≠ Safest Route Rationale
              </span>
              <span className="text-[10px] font-extrabold bg-teal-500/20 text-teal-300 border border-teal-500/40 px-2.5 py-0.5 rounded-full uppercase">
                Route Comparison Rationale
              </span>
            </div>
            <p className="text-slate-200 leading-relaxed">
              FloodSafe recommends <strong>{recommendedRoute.name}</strong>. It is ~{timeDiffMins} minute{timeDiffMins > 1 ? 's' : ''} slower than the fastest route ({fastestRoute.name}), but has lower prototype risk index ({recommendedRoute.risk.maximum || recommendedRoute.risk.average} / 100 vs {fastestRoute.risk.maximum || fastestRoute.risk.average} / 100)
              {routeData.routeFlip?.hotspotName ? (
                <> because <strong>{fastestRoute.name}</strong> passes through documented waterlogging location ({routeData.routeFlip.hotspotName}).</>
              ) : (
                <> due to elevated comparative risk along the fastest route corridor.</>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Route Comparison Section Header & Coverage Disclosures */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-base font-extrabold text-white flex items-center gap-2 uppercase tracking-wider">
            <Navigation className="w-4 h-4 text-teal-400" />
            Route Comparison ({routes.length} Route Alternatives)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Evaluated by {routeData.provider || 'OpenRouteService'} routing engine & FloodSafe risk model
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
            isWeatherUnavailable
              ? 'text-rose-300 bg-rose-950/60 border border-rose-800'
              : 'text-amber-300 bg-amber-950/50 border border-amber-800/60'
          }`}>
            {routeData.mode === 'historical'
              ? `Historical Replay — ${activeRoute.historicalIntelligence?.matchedIncidentTitle || '8 July 2023 Torrential Downpour'}`
              : (isWeatherUnavailable ? 'Live Weather Unavailable' : 'Live Weather Analysis')}
          </span>
          <span className="text-xs text-slate-300 bg-slate-900 border border-slate-700 px-3 py-1 rounded-full">
            Historical coverage: 1 of 12 recorded waterlogging locations has coordinates
          </span>
        </div>
      </div>

      {/* ROUTE CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {routes.map((r, idx) => {
          const isSelected = r.id === activeRoute.id;
          const isRec = r.id === recommendedRouteId;
          const timeDiffMins = Math.round((r.durationSeconds - recommendedRoute.durationSeconds) / 60);
          const accent = ROUTE_ACCENTS[idx % ROUTE_ACCENTS.length];
          const primaryHotspot = r.risk?.detectedHotspots && r.risk.detectedHotspots.length > 0 ? r.risk.detectedHotspots[0] : null;

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
                    isRec
                      ? (isWeatherUnavailable ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40')
                      : `${accent.badge} border`
                  }`}>
                    {isRec ? (isWeatherUnavailable ? 'RECOMMENDED (BY TIME)' : 'RECOMMENDED') : `OPTION ${idx + 1}`}
                  </span>

                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md border ${
                    isWeatherUnavailable || r.severityLevel === 'UNAVAILABLE'
                      ? 'bg-amber-950/60 text-amber-300 border-amber-800'
                      : r.severityLevel === 'SEVERE' || r.severityLevel === 'HIGH'
                      ? 'bg-rose-950/60 text-rose-300 border-rose-800'
                      : r.severityLevel === 'MODERATE'
                      ? 'bg-amber-950/60 text-amber-300 border-amber-800'
                      : 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                  }`}>
                    {isWeatherUnavailable || r.severityLevel === 'UNAVAILABLE' ? 'RISK UNAVAILABLE' : `${r.severityLevel} PROTOTYPE RISK`}
                  </span>
                </div>

                <h4 className="text-base font-bold text-white pt-1">
                  {r.name}
                </h4>

                {/* Standardized Prototype Risk Index */}
                <div className="text-xs text-slate-300 font-mono">
                  {isWeatherUnavailable || r.risk?.average === null ? (
                    <span>Prototype risk index: <span className="font-bold text-amber-400">N/A</span> (Live weather offline)</span>
                  ) : (
                    <>Prototype risk index: <span className="font-bold text-white">{r.risk.average}</span> / 100 · Peak: <span className="font-bold text-amber-300">{r.risk.maximum}</span></>
                  )}
                </div>

                {/* Distance & Time */}
                <div className="text-xs text-slate-400 font-medium">
                  {formatDistance(r.distanceMeters)} · {formatDuration(r.durationSeconds)}
                  {timeDiffMins > 0 && <span className="text-amber-400 ml-1.5">(+{timeDiffMins}m detour)</span>}
                </div>
              </div>

              {/* Hotspot Alert Indicator */}
              {isWeatherUnavailable ? (
                <div className="text-[11px] text-amber-300 font-medium bg-amber-950/30 border border-amber-800/30 p-2 rounded-xl flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Live weather data unavailable; risk unassessed.</span>
                </div>
              ) : primaryHotspot ? (
                <div className="text-[11px] text-amber-300 font-semibold bg-amber-950/40 border border-amber-800/50 p-2 rounded-xl flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Documented Hotspot: {primaryHotspot.name} — {primaryHotspot.distanceMeters}m away</span>
                </div>
              ) : (
                <div className="text-[11px] text-emerald-400 font-medium bg-emerald-950/30 border border-emerald-800/30 p-2 rounded-xl flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>No coordinate-backed hotspot detected on this route.</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* WHY THIS ROUTE HAS THIS RISK (Selected Route Detailed Risk Analysis) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm space-y-6">
        
        {/* Selected Route Title */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-teal-400" />
              Why this route has this risk: {activeRoute.name}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Distance: {formatDistance(activeRoute.distanceMeters)} | Duration: {formatDuration(activeRoute.durationSeconds)} | Prototype risk index: {isWeatherUnavailable || activeRoute.risk?.average === null ? 'N/A' : `${activeRoute.risk.average} / 100`}
            </p>
          </div>

          <span className={`text-xs font-extrabold uppercase px-3 py-1 rounded-lg border ${
            activeRoute.isRecommended
              ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
              : 'bg-slate-800 text-slate-300 border-slate-700'
          }`}>
            {activeRoute.isRecommended ? '★ Recommended Alternative' : 'Selected Option'}
          </span>
        </div>

        {/* Historical Hotspot Emphasis Section */}
        {!isWeatherUnavailable && detectedHotspots.length > 0 ? (
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
                  Documented waterlogging location during historical rainfall events.
                </p>
                <p className="text-[11px] text-slate-400 pt-1">
                  <strong>Source:</strong> {spot.source || 'Indian Express'} / {spot.coordinateSource || 'Delhi Government PWD document'}
                </p>
              </div>
            ))}
          </div>
        ) : !isWeatherUnavailable ? (
          <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>No coordinate-backed hotspot detected on this route.</span>
          </div>
        ) : null}

        {/* Textual Evidence List */}
        {!isWeatherUnavailable && textualEvidences.length > 0 && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
            <span className="font-bold text-slate-300 block uppercase tracking-wider">
              Additional Documented Textual Flood Evidence (Non-Geocoded):
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
            4-Component Prototype Risk Breakdown
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Rainfall */}
            <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <CloudRain className="w-3.5 h-3.5 text-cyan-400" /> Rainfall Intensity (30%)
                </span>
                <span className="font-bold text-cyan-300">
                  {activeRoute.risk.components?.rainfallRisk !== null && activeRoute.risk.components?.rainfallRisk !== undefined
                    ? `${activeRoute.risk.components.rainfallRisk} / 100`
                    : 'N/A (Unavailable)'}
                </span>
              </div>
              <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div className="h-full bg-cyan-400 transition-all duration-500" style={{ width: `${activeRoute.risk.components?.rainfallRisk || 0}%` }} />
              </div>
            </div>

            {/* Historical Waterlogging */}
            <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" /> Historical Waterlogging (35%)
                </span>
                <span className="font-bold text-amber-300">
                  {activeRoute.risk.components?.historicalWaterloggingRisk !== null && activeRoute.risk.components?.historicalWaterloggingRisk !== undefined
                    ? `${activeRoute.risk.components.historicalWaterloggingRisk} / 100`
                    : 'N/A (Unavailable)'}
                </span>
              </div>
              <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div className="h-full bg-amber-400 transition-all duration-500" style={{ width: `${activeRoute.risk.components?.historicalWaterloggingRisk || 0}%` }} />
              </div>
            </div>

            {/* Similarity */}
            <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-teal-400" /> Historical Similarity (20%)
                </span>
                <span className="font-bold text-teal-300">
                  {activeRoute.risk.components?.rainfallSimilarityRisk !== null && activeRoute.risk.components?.rainfallSimilarityRisk !== undefined
                    ? `${activeRoute.risk.components.rainfallSimilarityRisk} / 100`
                    : 'N/A (Unavailable)'}
                </span>
              </div>
              <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div className="h-full bg-teal-400 transition-all duration-500" style={{ width: `${activeRoute.risk.components?.rainfallSimilarityRisk || 0}%` }} />
              </div>
            </div>

            {/* Terrain Elevation */}
            <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Mountain className="w-3.5 h-3.5 text-emerald-400" /> Terrain Elevation (15%)
                </span>
                <span className="font-bold text-emerald-300">
                  {activeRoute.risk.components?.terrainRisk !== null && activeRoute.risk.components?.terrainRisk !== undefined
                    ? `${activeRoute.risk.components.terrainRisk} / 100`
                    : 'N/A (Unavailable)'}
                </span>
              </div>
              <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div className="h-full bg-emerald-400 transition-all duration-500" style={{ width: `${activeRoute.risk.components?.terrainRisk || 0}%` }} />
              </div>
              {isElevationUnavailable && (
                <div className="text-[10px] text-amber-400/90 font-medium">
                  Elevation service unreachable; terrain risk excluded from index.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Methodology & Coverage Disclaimer Note */}
        <div className="pt-3 text-[11px] text-slate-400 flex items-start gap-2 border-t border-slate-800">
          <Info className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
          <span>
            <strong>Methodology & Limitations Note:</strong> FloodSafe is an explainable prototype that compares route alternatives using rainfall indicators, historical rainfall similarity, coordinate-backed documented waterlogging locations, and terrain. Its prototype risk index is not a calibrated flood probability. Historical hotspot coverage is limited to locations with verified coordinates.
          </span>
        </div>
      </div>
    </div>
  );
}

