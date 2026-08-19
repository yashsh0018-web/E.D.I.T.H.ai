'use client';

import React from 'react';
import { useSafety } from '@/lib/safety-context';
import ThreeOrb from './ThreeOrb';
import { Shield, AlertOctagon, AlertTriangle, Mic } from 'lucide-react';

export default function PulseVisualizer() {
  const { threatLevel, threatScore, triggerEmergency, resolveEmergency, speech } = useSafety();

  const isAlert = threatLevel === 'CRITICAL';
  const isElevated = threatLevel === 'ELEVATED';

  const handleToggle = () => {
    if (isAlert) {
      resolveEmergency();
    } else {
      triggerEmergency('Manual Tap on Visualizer HUD');
    }
  };

  return (
    <section className="flex flex-col items-center justify-center py-4 sm:py-6 select-none">
      <div className="relative flex items-center justify-center">
        {/* Ambient Ring Glows */}
        <div
          className={`absolute rounded-full pointer-events-none transition-all duration-700 ${
            isAlert
              ? 'w-72 h-72 bg-primary-container/20 blur-2xl animate-pulse'
              : isElevated
              ? 'w-64 h-64 bg-amber-500/15 blur-2xl'
              : 'w-64 h-64 bg-secondary/10 blur-2xl'
          }`}
        />

        {/* Tactical Central Interactive Orb Container */}
        <div
          onClick={handleToggle}
          title={isAlert ? 'Threat Active — Click to De-escalate' : 'Click to test Emergency SOS Trigger'}
          className={`relative w-48 h-48 sm:w-56 sm:h-56 rounded-full flex flex-col items-center justify-center cursor-pointer transition-all duration-500 border-2 ${
            isAlert
              ? 'pulse-alert border-primary-container bg-surface-container-high/90'
              : isElevated
              ? 'border-amber-500/40 bg-surface-container-high/70'
              : 'pulse-safe border-secondary/25 bg-surface-container-high/70'
          }`}
        >
          {/* Subtle Outer Circles */}
          <div
            className={`absolute inset-0 rounded-full border opacity-40 scale-110 pointer-events-none ${
              isAlert ? 'border-primary/30' : isElevated ? 'border-amber-400/30' : 'border-secondary/20'
            }`}
          />
          <div
            className={`absolute inset-0 rounded-full border opacity-20 scale-125 pointer-events-none ${
              isAlert ? 'border-primary/20' : isElevated ? 'border-amber-400/20' : 'border-secondary/10'
            }`}
          />

          {/* Three.js 3D Wireframe Orb */}
          <div className="absolute inset-2 flex items-center justify-center pointer-events-none opacity-80">
            <ThreeOrb />
          </div>

          {/* Central Overlay HUD Text */}
          <div className="relative z-10 flex flex-col items-center text-center pointer-events-none px-4 py-2 rounded-xl bg-surface-container-lowest/60 backdrop-blur-sm border border-white/5">
            {isAlert ? (
              <AlertOctagon className="w-8 h-8 text-primary mb-1 animate-pulse" />
            ) : isElevated ? (
              <AlertTriangle className="w-7 h-7 text-amber-400 mb-1" />
            ) : (
              <Shield className="w-7 h-7 text-secondary mb-1" />
            )}

            <span
              className={`font-mono text-xs font-bold tracking-widest uppercase transition-colors ${
                isAlert ? 'text-primary' : isElevated ? 'text-amber-400' : 'text-secondary'
              }`}
            >
              {isAlert ? 'THREAT DETECTED' : isElevated ? 'CAUTION' : 'MONITORING'}
            </span>
            <span className="font-mono text-[10px] text-on-surface-variant/80 mt-0.5">
              {threatScore}% RISK
            </span>
          </div>
        </div>
      </div>

      {/* Acoustic Waveform preview underneath */}
      <div className="mt-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-low border border-white/5">
        <Mic className={`w-3 h-3 ${speech.isListening ? 'text-secondary animate-pulse' : 'text-on-surface-variant/40'}`} />
        <span className="font-mono text-[10px] text-on-surface-variant/70">
          {speech.isListening ? 'AMBIENT NEURAL LISTENER ARMED' : 'MICROPHONE SUSPENDED'}
        </span>
        <div className="flex items-center gap-0.5 ml-2 h-3">
          {speech.frequencyData.slice(0, 8).map((height, idx) => (
            <div
              key={idx}
              style={{ height: `${Math.min(12, Math.max(3, height / 2))}px` }}
              className={`w-0.5 rounded-full transition-all duration-75 ${
                isAlert ? 'bg-primary' : isElevated ? 'bg-amber-400' : 'bg-secondary'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
