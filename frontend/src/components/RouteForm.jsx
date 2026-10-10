import React, { useState } from 'react';
import { MapPin, Navigation, Search, AlertCircle, ArrowRightLeft, History, CloudRain, CheckCircle2 } from 'lucide-react';
import { analyzeRoutes } from '../services/api';

export default function RouteForm({ onRoutesCalculated, isAnalyzing, setIsAnalyzing }) {
  const [startText, setStartText] = useState('New Delhi Station (Ajmeri Gate)');
  const [startCoords, setStartCoords] = useState({ latitude: 28.6435, longitude: 77.2215 });

  const [destText, setDestText] = useState('IGI Airport, Delhi');
  const [destCoords, setDestCoords] = useState({ latitude: 28.5562, longitude: 77.1000 });

  const [scenarioMode, setScenarioMode] = useState('historical'); // Default to Historical Replay for demo
  const [selectedEventId, setSelectedEventId] = useState('delhi-july-08-2023');

  const [loadingStep, setLoadingStep] = useState(0);
  const [notification, setNotification] = useState(null);

  const loadingSteps = [
    'Analyzing route options...',
    'Checking rainfall intensity...',
    'Comparing historical patterns...',
    'Evaluating terrain topography...',
    'Scanning historical waterlogging hotspots...',
    'Ranking safe routes...'
  ];

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    setIsAnalyzing(true);
    setNotification(null);
    setLoadingStep(0);

    // Stepped loading progress visualizer
    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
    }, 250);

    const result = await analyzeRoutes(startText, destText, {
      mode: scenarioMode,
      eventId: selectedEventId,
      startCoords,
      destCoords
    });

    clearInterval(stepInterval);
    setIsAnalyzing(false);

    if (result.ok && result.data && result.data.routes) {
      if (onRoutesCalculated) {
        onRoutesCalculated(result.data, {
          start: startText,
          destination: destText,
          scenarioMode,
          eventId: selectedEventId
        });
      }
    } else {
      setNotification({
        type: 'error',
        text: result.error || 'Failed to analyze routes. Please ensure backend server is running.'
      });
    }
  };

  const handleSwap = () => {
    const tempT = startText;
    const tempC = startCoords;
    setStartText(destText);
    setStartCoords(destCoords);
    setDestText(tempT);
    setDestCoords(tempC);
  };

  const handlePresetCPToAirport = () => {
    setStartText('Connaught Place, Delhi');
    setStartCoords({ latitude: 28.6304, longitude: 77.2177 });
    setDestText('IGI Airport, Delhi');
    setDestCoords({ latitude: 28.5562, longitude: 77.1000 });
  };

  const handlePresetMintoRoad = () => {
    setStartText('New Delhi Station (Ajmeri Gate)');
    setStartCoords({ latitude: 28.6430, longitude: 77.2194 });
    setDestText('ITO Intersection, Delhi');
    setDestCoords({ latitude: 28.6280, longitude: 77.2400 });
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm space-y-5">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Navigation className="w-5 h-5 text-teal-400" />
          Route & Scenario Controls
        </h2>
        <span className="text-[11px] font-semibold text-slate-400 bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700/60">
          FloodSafe Router
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* From Input */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              From
            </label>
            <span className="text-[10px] text-slate-400 font-mono">
              {startCoords && typeof startCoords.latitude === 'number' && typeof startCoords.longitude === 'number'
                ? `${startCoords.latitude}, ${startCoords.longitude}`
                : 'Text location (Geocodes on Submit)'}
            </span>
          </div>
          <input
            type="text"
            value={startText}
            onChange={(e) => {
              setStartText(e.target.value);
              setStartCoords(null);
            }}
            placeholder="Start location"
            className="w-full bg-slate-950 border border-slate-700/90 rounded-xl py-3 px-4 text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition-colors"
          />
        </div>

        {/* Swap Button */}
        <div className="flex justify-center -my-2">
          <button
            type="button"
            onClick={handleSwap}
            title="Swap locations"
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-full border border-slate-700 transition-transform active:scale-95 shadow"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 rotate-90" />
          </button>
        </div>

        {/* To Input */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              To
            </label>
            <span className="text-[10px] text-slate-400 font-mono">
              {destCoords && typeof destCoords.latitude === 'number' && typeof destCoords.longitude === 'number'
                ? `${destCoords.latitude}, ${destCoords.longitude}`
                : 'Text location (Geocodes on Submit)'}
            </span>
          </div>
          <input
            type="text"
            value={destText}
            onChange={(e) => {
              setDestText(e.target.value);
              setDestCoords(null);
            }}
            placeholder="Destination location"
            className="w-full bg-slate-950 border border-slate-700/90 rounded-xl py-3 px-4 text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition-colors"
          />
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={handlePresetCPToAirport}
            className="text-xs bg-slate-800/80 hover:bg-teal-950/50 text-slate-300 hover:text-teal-300 px-3 py-1.5 rounded-lg border border-slate-700/60 transition-colors"
          >
            Connaught Place ➔ Airport
          </button>
          <button
            type="button"
            onClick={handlePresetMintoRoad}
            className="text-xs bg-slate-800/80 hover:bg-amber-950/50 text-slate-300 hover:text-amber-300 px-3 py-1.5 rounded-lg border border-slate-700/60 transition-colors"
          >
            Minto Road Corridor
          </button>
        </div>

        {/* Scenario Mode Switcher */}
        <div className="pt-3 border-t border-slate-800/80 space-y-3">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
            Scenario Mode
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 border border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setScenarioMode('historical')}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                scenarioMode === 'historical'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Historical Replay
            </button>
            <button
              type="button"
              onClick={() => setScenarioMode('live')}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                scenarioMode === 'live'
                  ? 'bg-teal-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CloudRain className="w-3.5 h-3.5" />
              Live Conditions
            </button>
          </div>

          {/* Historical Event Dropdown */}
          {scenarioMode === 'historical' ? (
            <div className="space-y-1.5 bg-amber-950/20 border border-amber-800/40 rounded-xl p-3">
              <span className="text-[11px] text-amber-300/90 font-bold block uppercase tracking-wider">
                Historical Replay — Observed Event
              </span>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              >
                <option value="delhi-july-08-2023">Delhi Torrential Downpour — July 8, 2023</option>
                <option value="delhi-july-24-2024">Delhi Monsoon Spells — July 24, 2024</option>
                <option value="delhi-july-2025">Delhi Monsoon Downpour — July 2025</option>
              </select>
            </div>
          ) : (
            <div className="p-3 bg-teal-950/20 border border-teal-800/40 rounded-xl text-xs text-teal-300">
              <span className="font-bold block uppercase tracking-wider">Live Conditions — Current Forecast</span>
              <span className="text-slate-400 text-[11px]">Evaluating live rainfall API forecast for Delhi.</span>
            </div>
          )}
        </div>

        {/* Primary CTA: Analyze Routes */}
        <button
          type="submit"
          disabled={isAnalyzing}
          className="w-full mt-2 bg-gradient-to-r from-teal-500 via-cyan-500 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 text-slate-950 font-extrabold py-3.5 px-4 rounded-xl shadow-lg shadow-teal-950/50 transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wider active:scale-[0.99]"
        >
          {isAnalyzing ? (
            <div className="flex items-center gap-2 text-slate-950">
              <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              <span>Analyzing Routes...</span>
            </div>
          ) : (
            <>
              <Search className="w-4 h-4 text-slate-950" />
              Analyze Routes
            </>
          )}
        </button>
      </form>

      {/* Stepped Loading Visualizer */}
      {isAnalyzing && (
        <div className="p-4 rounded-xl bg-slate-950 border border-teal-500/40 space-y-2 text-xs">
          <div className="flex items-center justify-between text-teal-300 font-semibold">
            <span>Analyzing route safety</span>
            <span>{Math.round(((loadingStep + 1) / loadingSteps.length) * 100)}%</span>
          </div>
          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-teal-400 transition-all duration-300"
              style={{ width: `${((loadingStep + 1) / loadingSteps.length) * 100}%` }}
            />
          </div>
          <p className="text-slate-400 text-[11px] italic pt-1">
            ✓ {loadingSteps[loadingStep]}
          </p>
        </div>
      )}

      {/* Feedback Banner */}
      {notification && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
            notification.type === 'error'
              ? 'bg-rose-950/40 border-rose-800/60 text-rose-300'
              : 'bg-teal-950/50 border-teal-800/60 text-teal-200'
          }`}
        >
          {notification.type === 'error' && (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          )}
          <div>
            <p className="font-semibold">Analysis Error</p>
            <p className="text-slate-300 mt-0.5">{notification.text}</p>
          </div>
        </div>
      )}
    </div>
  );
}
