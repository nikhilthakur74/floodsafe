import React from 'react';
import { CloudRain, History, LineChart, Mountain, GitFork, Info } from 'lucide-react';

const riskFactors = [
  {
    icon: CloudRain,
    title: 'Rainfall Forecast',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/20',
    description: 'Real-time precipitation modeling along planned travel corridors.'
  },
  {
    icon: History,
    title: 'Historical Incidents',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
    description: 'Empirical records of past waterlogging hotspots and road blockages.'
  },
  {
    icon: LineChart,
    title: 'Pattern Similarity',
    color: 'text-teal-400',
    bgColor: 'bg-teal-500/10',
    borderColor: 'border-teal-500/20',
    description: 'Comparing current storm systems with past flood-triggering weather profiles.'
  },
  {
    icon: Mountain,
    title: 'Terrain & Elevation',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
    description: 'Topographical slope and depression mapping for low-lying risk detection.'
  },
  {
    icon: GitFork,
    title: 'Safe Route Alternatives',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
    description: 'Dynamic rerouting suggestions to bypass elevated risk segments.'
  }
];

export default function RiskSummaryCard() {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Info className="w-4 h-4 text-teal-400" />
            FloodSafe Risk Assessment Pillars
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            5 key dimensions analyzed to evaluate road waterlogging before you travel
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mt-4">
        {riskFactors.map((factor, index) => {
          const IconComponent = factor.icon;
          return (
            <div
              key={index}
              className={`p-4 rounded-xl border ${factor.borderColor} bg-slate-950/70 hover:bg-slate-900 transition-all duration-200 flex flex-col justify-between group`}
            >
              <div>
                <div className={`w-9 h-9 rounded-lg ${factor.bgColor} flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
                  <IconComponent className={`w-5 h-5 ${factor.color}`} />
                </div>
                <h4 className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">
                  {factor.title}
                </h4>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  {factor.description}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                  Pillar 0{index + 1}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-700 group-hover:bg-teal-400 transition-colors" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
