import React, { useState, useEffect } from 'react';
import { History, CloudRain, AlertTriangle, ExternalLink, Calendar, MapPin, Gauge, Info, Calculator, ShieldAlert, Mountain } from 'lucide-react';
import { fetchDelhiWeather, fetchReplayEvents, calculateRiskScore } from '../services/api';

export default function ScenarioSelector({ onSelectEvent }) {
  const [scenarioMode, setScenarioMode] = useState('live'); // 'live' | 'historical'
  
  // Live Weather state
  const [liveWeather, setLiveWeather] = useState(null);
  const [liveLoading, setLiveLoading] = useState(false);

  // Historical Replay state
  const [replayEvents, setReplayEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [riskResult, setRiskResult] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Fetch live weather on mount
  useEffect(() => {
    async function loadLive() {
      setLiveLoading(true);
      const res = await fetchDelhiWeather();
      if (res.ok) {
        setLiveWeather(res.data);
      }
      setLiveLoading(false);
    }
    loadLive();
  }, []);

  // Fetch replay events list on mount
  useEffect(() => {
    async function loadReplayEvents() {
      const res = await fetchReplayEvents();
      if (res.ok && res.data.length > 0) {
        setReplayEvents(res.data);
        setSelectedEventId(res.data[0].id);
        if (onSelectEvent) onSelectEvent(res.data[0]);
      }
    }
    loadReplayEvents();
  }, []);

  const handleEventChange = (eventId) => {
    setSelectedEventId(eventId);
    setRiskResult(null);
    const found = replayEvents.find(e => e.id === eventId);
    if (onSelectEvent) onSelectEvent(found);
  };

  const handleCalculateRisk = async () => {
    if (!selectedEventId) return;
    setIsCalculating(true);
    const res = await calculateRiskScore(selectedEventId);
    if (res.ok) {
      setRiskResult(res.data);
    }
    setIsCalculating(false);
  };

  const selectedEvent = replayEvents.find(e => e.id === selectedEventId);

  // Helper for progress bar text block rendering
  const renderProgressBar = (value, colorClass = 'bg-teal-500') => {
    if (value === null || value === undefined) {
      return (
        <div className="flex items-center gap-2 text-xs text-slate-400 italic">
          <span>Data Unavailable</span>
        </div>
      );
    }
    const blocksFilled = Math.round((value / 100) * 10);
    const filledStr = '█'.repeat(blocksFilled);
    const emptyStr = '░'.repeat(10 - blocksFilled);

    return (
      <div className="flex items-center gap-3">
        <div className="w-32 bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800 flex">
          <div className={`h-full ${colorClass}`} style={{ width: `${value}%` }} />
        </div>
        <span className="font-mono text-xs text-slate-300">
          <span className="text-teal-400 font-bold">{filledStr}</span>
          <span className="text-slate-600">{emptyStr}</span>
        </span>
        <span className="text-xs font-bold text-white min-w-[24px]">{value}</span>
      </div>
    );
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm space-y-6">
      
      {/* Scenario Mode Switcher Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Gauge className="w-5 h-5 text-teal-400" />
            Weather Risk Scenario
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Toggle between live forecast and documented historical storm replays
          </p>
        </div>

        {/* Toggle Buttons */}
        <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => setScenarioMode('live')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              scenarioMode === 'live'
                ? 'bg-teal-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CloudRain className="w-3.5 h-3.5" />
            Live Conditions
          </button>

          <button
            type="button"
            onClick={() => setScenarioMode('historical')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              scenarioMode === 'historical'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Historical Replay
          </button>
        </div>
      </div>

      {/* Mode 1: Live Conditions */}
      {scenarioMode === 'live' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-teal-950/40 border border-teal-800/50">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-bold text-teal-300 uppercase tracking-wider">
                LIVE: Current forecast
              </span>
            </div>
            <span className="text-[11px] text-slate-400">Location: Delhi (28.6139° N, 77.2090° E)</span>
          </div>

          {liveLoading ? (
            <div className="text-xs text-slate-400 p-4 text-center">Fetching live Open-Meteo precipitation data...</div>
          ) : (liveWeather && liveWeather.status !== 'unavailable' && liveWeather.forecast) ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Next 1h</span>
                <p className="text-lg font-extrabold text-teal-300 mt-1">{liveWeather.forecast.next1HourMm} <span className="text-xs font-normal text-slate-400">mm</span></p>
              </div>
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Next 3h</span>
                <p className="text-lg font-extrabold text-teal-300 mt-1">{liveWeather.forecast.next3HoursMm} <span className="text-xs font-normal text-slate-400">mm</span></p>
              </div>
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Next 6h</span>
                <p className="text-lg font-extrabold text-teal-300 mt-1">{liveWeather.forecast.next6HoursMm} <span className="text-xs font-normal text-slate-400">mm</span></p>
              </div>
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Next 12h</span>
                <p className="text-lg font-extrabold text-teal-300 mt-1">{liveWeather.forecast.next12HoursMm} <span className="text-xs font-normal text-slate-400">mm</span></p>
              </div>
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Next 24h</span>
                <p className="text-lg font-extrabold text-teal-300 mt-1">{liveWeather.forecast.next24HoursMm} <span className="text-xs font-normal text-slate-400">mm</span></p>
              </div>
              <div className="p-3 bg-slate-950/80 border border-amber-900/40 rounded-xl">
                <span className="text-[10px] text-amber-400 uppercase font-semibold">Max 1h Peak</span>
                <p className="text-lg font-extrabold text-amber-300 mt-1">{liveWeather.forecast.maxHourlyMm} <span className="text-xs font-normal text-slate-400">mm</span></p>
              </div>
            </div>
          ) : (
            <div className="text-xs text-amber-300 p-4 bg-amber-950/40 border border-amber-800/60 rounded-xl space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-400">
                <AlertTriangle className="w-4 h-4" />
                Live Weather Data Unavailable
              </div>
              <p className="text-slate-300">
                {liveWeather?.message || 'Live weather forecast data is currently unavailable (HTTP 429 Rate Limited or network error). Live flood risk could not be assessed.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Historical Replay */}
      {scenarioMode === 'historical' && (
        <div className="space-y-5">
          {/* Product Distinction Banner */}
          <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-amber-950/50 border border-amber-800/60 text-amber-200 text-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="font-bold uppercase tracking-wider">
                HISTORICAL: Historical replay — observed event
              </span>
            </div>
            <span className="text-[11px] text-amber-300/80">Replay Mode Active</span>
          </div>

          {/* Replay Event Dropdown & Calculate Button */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
            <div className="sm:col-span-8 space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Historical Delhi Event
              </label>
              <select
                value={selectedEventId}
                onChange={(e) => handleEventChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-amber-500 transition-colors"
              >
                {replayEvents.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title} ({ev.date})
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-4">
              <button
                type="button"
                onClick={handleCalculateRisk}
                disabled={isCalculating}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold py-3 px-4 rounded-xl shadow-lg shadow-amber-950/40 transition-all flex items-center justify-center gap-2 active:scale-95 text-xs"
              >
                {isCalculating ? (
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Calculator className="w-4 h-4" />
                    Calculate Risk Index
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Event Detailed Display */}
          {selectedEvent && (
            <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-5 space-y-5">
              {/* Event Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-white">{selectedEvent.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{selectedEvent.description}</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold bg-amber-950/40 px-3 py-1 rounded-full border border-amber-800/40 shrink-0">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Date: {selectedEvent.date}</span>
                </div>
              </div>

              {/* Grid: Rainfall Observations + Waterlogging Locations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Available Rainfall Observations */}
                <div className="p-4 bg-slate-900/60 border border-slate-800/90 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <CloudRain className="w-4 h-4 text-cyan-400" />
                    Available Rainfall Observations
                  </h4>
                  {selectedEvent.rainfallStations && selectedEvent.rainfallStations.length > 0 ? (
                    <div className="space-y-2">
                      {selectedEvent.rainfallStations.map((st, i) => (
                        <div key={i} className="flex items-center justify-between text-xs py-1.5 px-2.5 bg-slate-950/80 rounded-lg border border-slate-800">
                          <span className="font-semibold text-slate-300">{st.station}</span>
                          <span className="font-bold text-cyan-300">{st.rainfallMm} mm {st.timeframe ? `(${st.timeframe})` : ''}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 italic p-3 bg-slate-950/50 rounded-lg border border-slate-800/50">
                      Rainfall station values not explicitly available in documentation source for this event.
                    </div>
                  )}
                </div>

                {/* Waterlogging Locations */}
                <div className="p-4 bg-slate-900/60 border border-slate-800/90 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-rose-400" />
                    Documented Waterlogging Locations
                  </h4>
                  <div className="space-y-2">
                    {selectedEvent.waterloggingLocations.map((loc, i) => (
                      <div key={i} className="flex items-center justify-between text-xs py-1.5 px-2.5 bg-slate-950/80 rounded-lg border border-slate-800">
                        <span className="font-medium text-slate-200">{loc.name}</span>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          loc.severity === 'high'
                            ? 'bg-rose-950 text-rose-400 border border-rose-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}>
                          {loc.severity} Impact
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Milestone 5: Integrated 4-Component Risk Score Display Card */}
              {riskResult && (
                <div className="mt-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/30 border border-amber-500/40 shadow-2xl space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                    <div>
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-amber-400" />
                        Prototype Risk Index
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">4-Signal Risk Assessment for {riskResult.eventTitle}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-2xl font-black text-white">{riskResult.score}</span>
                        <span className="text-xs font-bold text-slate-400"> / 100</span>
                      </div>
                      <span className={`text-xs font-extrabold uppercase tracking-widest px-3.5 py-1.5 rounded-lg border ${
                        riskResult.level === 'SEVERE'
                          ? 'bg-rose-950 text-rose-300 border-rose-700'
                          : riskResult.level === 'HIGH'
                          ? 'bg-amber-950 text-amber-300 border-amber-700'
                          : 'bg-teal-950 text-teal-300 border-teal-700'
                      }`}>
                        {riskResult.level}
                      </span>
                    </div>
                  </div>

                  {/* Risk Component Progress Bars */}
                  <div className="space-y-3 pt-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                      <span className="font-semibold text-slate-300 w-48 flex items-center gap-1.5">
                        <CloudRain className="w-3.5 h-3.5 text-cyan-400" /> 🌧 Rainfall (30%)
                      </span>
                      {renderProgressBar(riskResult.components.rainfallRisk, 'bg-cyan-500')}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                      <span className="font-semibold text-slate-300 w-48 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-400" /> 🌊 Historical waterlogging (35%)
                      </span>
                      {renderProgressBar(riskResult.components.historicalWaterloggingRisk, 'bg-amber-500')}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                      <span className="font-semibold text-slate-300 w-48 flex items-center gap-1.5">
                        <Gauge className="w-3.5 h-3.5 text-teal-400" /> 📊 Rainfall similarity (20%)
                      </span>
                      {renderProgressBar(riskResult.components.rainfallSimilarityRisk, 'bg-teal-500')}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                      <div className="w-48">
                        <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                          <Mountain className="w-3.5 h-3.5 text-emerald-400" /> ⛰ Terrain (15%)
                        </span>
                        {riskResult.terrain?.explanation && (
                          <span className="text-[10px] text-emerald-400 font-medium block">
                            "{riskResult.terrain.explanation}"
                          </span>
                        )}
                      </div>
                      {renderProgressBar(riskResult.components.terrainRisk, 'bg-emerald-500')}
                    </div>
                  </div>

                  {/* Terrain Risk Explanation Note */}
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 flex items-center gap-2">
                    <Mountain className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>
                      Terrain risk estimates whether the selected point sits lower than nearby terrain and may therefore retain water.
                    </span>
                  </div>

                  {/* Mandatory Disclaimer */}
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
                    <Info className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Disclaimer:</strong> {riskResult.disclaimer}
                    </span>
                  </div>
                </div>
              )}

              {/* Source & Evidence Link */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1 text-slate-400">
                  <Info className="w-3.5 h-3.5 text-teal-400" />
                  Documentation Evidence Source:
                </span>
                <a
                  href={selectedEvent.source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-400 hover:text-teal-300 font-medium flex items-center gap-1 hover:underline"
                >
                  <span>Verify Media Source</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
