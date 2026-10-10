import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import RouteForm from './components/RouteForm';
import MapView from './components/MapView';
import RouteResultsPanel from './components/RouteResultsPanel';
import { fetchHealthStatus, analyzeRoutes } from './services/api';
import { Shield, Droplets, Waves } from 'lucide-react';

export default function App() {
  const [apiStatus, setApiStatus] = useState('checking');
  const [routeInfo, setRouteInfo] = useState({
    start: 'New Delhi Station (Ajmeri Gate), Delhi',
    destination: 'IGI Airport, Delhi'
  });

  const [routeAnalysisData, setRouteAnalysisData] = useState(null);
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    async function initApp() {
      const healthRes = await fetchHealthStatus();
      if (healthRes.ok) {
        setApiStatus('online');
      } else {
        setApiStatus('offline');
      }

      // Demo-First Default State: Auto-trigger pre-loaded deterministic demo scenario
      setIsAnalyzing(true);
      const demoResult = await analyzeRoutes('New Delhi Station (Ajmeri Gate), Delhi', 'IGI Airport, Delhi', {
        mode: 'historical',
        eventId: 'delhi-july-08-2023',
        startCoords: { latitude: 28.6435, longitude: 77.2215 },
        destCoords: { latitude: 28.5562, longitude: 77.1000 }
      });
      setIsAnalyzing(false);

      if (demoResult.ok && demoResult.data && demoResult.data.routes) {
        setRouteAnalysisData(demoResult.data);
        if (demoResult.data.recommendedRouteId) {
          setSelectedRouteId(demoResult.data.recommendedRouteId);
        }
      }
    }

    initApp();
  }, []);

  const handleRoutesCalculated = (analysisData, info) => {
    setRouteAnalysisData(analysisData);
    if (analysisData && analysisData.recommendedRouteId) {
      setSelectedRouteId(analysisData.recommendedRouteId);
    }
    if (info) {
      setRouteInfo(info);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-slate-950">
      {/* Background radial ambient lights */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-teal-600/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[140px]" />
      </div>

      {/* Main Header */}
      <Header apiStatus={apiStatus} />

      {/* App Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 z-10 space-y-6">
        
        {/* Hero Product Banner */}
        <section className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-teal-950/40 border border-slate-800 p-6 sm:p-8 overflow-hidden shadow-2xl">
          <div className="max-w-3xl space-y-2 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold">
              <Droplets className="w-3.5 h-3.5 text-teal-400" />
              <span>Historical Replay Dataset Active</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
              FloodSafe
            </h1>
            
            <p className="text-xl sm:text-2xl font-bold text-teal-300">
              Know the risk before you travel.
            </p>
            
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl pt-1">
              FloodSafe compares route options using rainfall indicators, historical similarity, documented waterlogging locations, and terrain to recommend a safer route.
            </p>
          </div>

          <div className="absolute right-6 bottom-4 opacity-10 pointer-events-none hidden lg:block">
            <Waves className="w-64 h-64 text-teal-400" />
          </div>
        </section>

        {/* Main Workspace Grid: Controls + Interactive Map */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Route Controls */}
          <div className="lg:col-span-4">
            <RouteForm
              onRoutesCalculated={handleRoutesCalculated}
              isAnalyzing={isAnalyzing}
              setIsAnalyzing={setIsAnalyzing}
            />
          </div>

          {/* Right Column: Interactive Map View */}
          <div className="lg:col-span-8">
            <MapView
              routeInfo={routeInfo}
              routeAnalysisData={routeAnalysisData}
              selectedRouteId={selectedRouteId}
              onSelectRoute={(id) => setSelectedRouteId(id)}
            />
          </div>
        </section>

        {/* Route Comparison Cards & Detailed Risk Analysis Panel */}
        {routeAnalysisData && (
          <section>
            <RouteResultsPanel
              routeData={routeAnalysisData}
              selectedRouteId={selectedRouteId}
              onSelectRoute={(id) => setSelectedRouteId(id)}
            />
          </section>
        )}

        {/* Global Methodology Disclaimer */}
        <section className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-1">
          <p className="font-bold text-slate-300">Methodology & Data Transparency:</p>
          <p className="leading-relaxed">
            FloodSafe combines current rainfall, historical rainfall similarity, documented waterlogging evidence, and terrain into an explainable prototype risk index. It is a relative risk indicator, not a calibrated flood probability or guarantee. Historical rainfall patterns are derived from Open-Meteo modeled/reanalysis data, while documented waterlogging locations come from cited historical reports and official coordinate evidence.
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 mt-12 py-6 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-teal-400" />
            <span className="font-semibold text-slate-300">FloodSafe</span>
            <span>— Know the risk before you travel.</span>
          </div>
          <p>© 2026 FloodSafe. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

