'use client';

import React from 'react';
import { useSafety } from '@/lib/safety-context';
import { Shield, AlertTriangle, Radio, EyeOff, Activity, Monitor } from 'lucide-react';
import Link from 'next/link';

export default function TopAppBar() {
  const { threatLevel, toggleCamouflage, speech, geo } = useSafety();

  const isAlert = threatLevel === 'CRITICAL';
  const isElevated = threatLevel === 'ELEVATED';

  return (
    <header className="top-app-bar fixed top-0 w-full z-40 flex justify-between items-center px-4 md:px-8 h-16 transition-all duration-300">
      {/* Brand & Guard Status */}
      <div className="flex items-center gap-3 cursor-pointer select-none">
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-all duration-300 ${
            isAlert
              ? 'bg-primary-container/20 border-primary-container text-primary shadow-[0_0_15px_rgba(220,38,38,0.5)] animate-pulse'
              : isElevated
              ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
              : 'bg-secondary/10 border-secondary/30 text-secondary shadow-[0_0_15px_rgba(78,222,163,0.2)]'
          }`}
        >
          {isAlert ? (
            <AlertTriangle className="w-5 h-5 animate-bounce" />
          ) : (
            <Shield className="w-5 h-5" />
          )}
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span
              className={`font-mono text-xs md:text-sm font-bold tracking-widest uppercase transition-colors ${
                isAlert ? 'text-primary' : isElevated ? 'text-amber-400' : 'text-secondary'
              }`}
            >
              {isAlert
                ? 'SYSTEM GUARD: CRITICAL ALERT'
                : isElevated
                ? 'SYSTEM GUARD: ELEVATED'
                : 'SYSTEM GUARD: ACTIVE'}
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                isAlert
                  ? 'bg-primary animate-ping'
                  : isElevated
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-secondary animate-pulse'
              }`}
            />
          </div>
          <span className="font-mono text-[10px] text-on-surface-variant/70 hidden sm:inline">
            E.D.I.T.H. SENTINEL • MOBILE NODE
          </span>
        </div>
      </div>

      {/* Sensor Indicators & Action Buttons */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Live Audio Activity Meter */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md bg-surface-container-high border border-white/5 font-mono text-[11px] text-on-surface-variant">
          <Activity
            className={`w-3.5 h-3.5 ${
              speech.audioLevel > 20 ? 'text-secondary animate-pulse' : 'text-on-surface-variant/50'
            }`}
          />
          <span>{speech.audioLevel}% DB</span>
        </div>

        {/* GPS Telemetry status chip */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-container-high border border-white/5 font-mono text-[11px] text-on-surface-variant">
          <Radio className={`w-3.5 h-3.5 ${geo.isLocked ? 'text-secondary' : 'text-amber-400'}`} />
          <span>{geo.isLocked ? 'GPS LOCKED' : 'GPS ACQUIRING'}</span>
        </div>

        {/* Open Laptop Command Center Link */}
        <Link
          href="/command-center"
          target="_blank"
          title="Open Laptop Guardian Command Center Dashboard"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container border border-secondary/30 text-xs font-mono text-secondary hover:text-white transition-all active:scale-95 shadow-sm"
        >
          <Monitor className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Command Center</span>
        </Link>

        {/* Camouflage Stealth Mode Button */}
        <button
          onClick={toggleCamouflage}
          title="Switch to Camouflage Stealth Disguise Screen"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high/80 hover:bg-surface-container border border-white/10 text-xs font-mono text-on-surface-variant hover:text-white transition-all active:scale-95 shadow-sm"
        >
          <EyeOff className="w-4 h-4 text-secondary" />
          <span className="hidden sm:inline">STEALTH</span>
        </button>
      </div>
    </header>
  );
}
