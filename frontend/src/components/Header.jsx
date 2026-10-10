import React from 'react';
import { Waves, Activity, ShieldCheck } from 'lucide-react';

export default function Header({ apiStatus }) {
  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-teal-500 via-cyan-500 to-emerald-400 p-0.5 shadow-lg shadow-teal-950/50 flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Waves className="w-5 h-5 text-teal-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-white">
                FloodSafe
              </h1>
            </div>
            <p className="text-xs font-medium text-slate-400">
              Know the risk before you travel.
            </p>
          </div>
        </div>

        {/* Right Info / Status Pills */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-300 bg-slate-900 px-3.5 py-1.5 rounded-full border border-slate-800 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            <span>Historical Dataset Active</span>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">Engine:</span>
            <span className={`font-semibold ${apiStatus === 'online' ? 'text-emerald-400' : apiStatus === 'offline' ? 'text-rose-400' : 'text-amber-400'}`}>
              {apiStatus === 'online' ? '● Online' : apiStatus === 'offline' ? '○ Offline' : '... Checking'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

