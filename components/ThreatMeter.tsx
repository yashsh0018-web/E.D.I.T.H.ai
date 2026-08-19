'use client';

import React from 'react';
import { useSafety } from '@/lib/safety-context';
import { AlertTriangle, ShieldCheck, Zap } from 'lucide-react';

export default function ThreatMeter() {
  const { threatLevel, threatScore, lastAnalysis, coercionDetected } = useSafety();

  const isAlert = threatLevel === 'CRITICAL';
  const isElevated = threatLevel === 'ELEVATED';

  return (
    <div className="glass-panel rounded-xl p-4 flex flex-col justify-between gap-3 relative overflow-hidden transition-all duration-300">
      {/* Background glow in critical state */}
      {isAlert && (
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary/20 rounded-full blur-2xl pointer-events-none" />
      )}

      {/* Header Row */}
      <div className="flex justify-between items-center z-10">
        <div className="flex items-center gap-2 text-on-surface-variant">
          {isAlert ? (
            <AlertTriangle className="w-4 h-4 text-primary animate-bounce" />
          ) : isElevated ? (
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-secondary" />
          )}
          <span className="font-mono text-xs uppercase tracking-wider font-semibold">
            Threat Level (Gemini Flash)
          </span>
        </div>
        <span
          className={`font-mono text-sm font-bold px-2 py-0.5 rounded border transition-colors ${
            isAlert
              ? 'text-primary bg-primary/10 border-primary/30'
              : isElevated
              ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
              : 'text-secondary bg-secondary/10 border-secondary/20'
          }`}
        >
          {threatScore.toString().padStart(2, '0')}%
        </span>
      </div>

      {/* Dynamic Threat Progress Bar */}
      <div className="w-full h-2.5 bg-surface-container-lowest rounded-full overflow-hidden p-0.5 border border-white/5 relative z-10">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            isAlert
              ? 'bg-gradient-to-r from-amber-500 to-primary shadow-[0_0_12px_rgba(220,38,38,0.7)]'
              : isElevated
              ? 'bg-gradient-to-r from-secondary to-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
              : 'bg-secondary shadow-[0_0_8px_rgba(78,222,163,0.4)]'
          }`}
          style={{ width: `${Math.max(3, threatScore)}%` }}
        />
      </div>

      {/* Scale Markers */}
      <div className="flex justify-between text-[10px] font-mono text-on-surface-variant/60 z-10">
        <span className={threatLevel === 'SAFE' ? 'text-secondary font-bold' : ''}>0% SAFE</span>
        <span className={threatLevel === 'ELEVATED' ? 'text-amber-400 font-bold' : ''}>50% ELEVATED</span>
        <span className={threatLevel === 'CRITICAL' ? 'text-primary font-bold animate-pulse' : ''}>100% CRITICAL</span>
      </div>

      {/* Sentiment & Coercion Badges */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-white/5 z-10 text-[11px] font-mono">
        <span className="text-on-surface-variant/60">AI Context:</span>
        <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface border border-white/5">
          {lastAnalysis?.sentiment || 'Neutral / Ambient'}
        </span>
        {coercionDetected && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-primary-container/20 text-primary border border-primary/30 font-bold">
            <Zap className="w-3 h-3" /> COERCION CUE
          </span>
        )}
        {lastAnalysis?.dangerKeywords && lastAnalysis.dangerKeywords.length > 0 && (
          <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
            Keyword: {lastAnalysis.dangerKeywords[0]}
          </span>
        )}
      </div>
    </div>
  );
}
