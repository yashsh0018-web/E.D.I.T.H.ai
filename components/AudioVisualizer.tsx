'use client';

import React, { useEffect, useRef, useState } from 'react';
import ThreeOrb from './ThreeOrb';
import { Shield, AlertTriangle, Radio } from 'lucide-react';

interface AudioVisualizerProps {
  threatLevel: 'SAFE' | 'ELEVATED' | 'CRITICAL';
  riskScore: number;
  isListening: boolean;
  onToggleSOS: () => void;
}

export default function AudioVisualizer({
  threatLevel,
  riskScore,
  isListening,
  onToggleSOS,
}: AudioVisualizerProps) {
  const isAlert = threatLevel === 'CRITICAL';
  const isElevated = threatLevel === 'ELEVATED';

  const [frequencyBars, setFrequencyBars] = useState<number[]>(new Array(16).fill(6));
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isMounted = true;

    async function initAudio() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        if (!isMounted) return;

        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;

        const ctx = new AudioCtx();
        audioContextRef.current = ctx;

        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateLoop = () => {
          if (!isMounted || !analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);

          const bars: number[] = [];
          for (let i = 0; i < 16; i++) {
            const val = dataArray[i] || 0;
            bars.push(Math.max(4, Math.round((val / 255) * 28)));
          }

          setFrequencyBars(bars);
          animFrameRef.current = requestAnimationFrame(updateLoop);
        };

        updateLoop();
      } catch (err) {
        console.warn('Microphone frequency analyzer access status:', err);
      }
    }

    if (isListening) {
      initAudio();
    }

    return () => {
      isMounted = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [isListening]);

  return (
    <section className="flex flex-col items-center justify-center py-4 select-none">
      <div className="relative flex items-center justify-center">
        {/* Glow halo */}
        <div
          className={`absolute rounded-full pointer-events-none transition-all duration-500 ${
            isAlert
              ? 'w-72 h-72 bg-primary-container/25 blur-3xl animate-pulse'
              : isElevated
              ? 'w-64 h-64 bg-amber-500/20 blur-2xl'
              : 'w-64 h-64 bg-secondary/15 blur-2xl'
          }`}
        />

        {/* Tactical interactive central orb */}
        <div
          onClick={onToggleSOS}
          title={isAlert ? 'Emergency active — click to de-escalate' : 'Click to trigger test SOS'}
          className={`relative w-48 h-48 sm:w-56 sm:h-56 rounded-full flex flex-col items-center justify-center cursor-pointer transition-all duration-500 border-2 ${
            isAlert
              ? 'pulse-alert border-primary-container bg-surface-container-high/90'
              : isElevated
              ? 'border-amber-500/40 bg-surface-container-high/70'
              : 'pulse-safe border-secondary/25 bg-surface-container-high/70'
          }`}
        >
          {/* Three.js 3D Wireframe Orb */}
          <div className="absolute inset-2 flex items-center justify-center pointer-events-none opacity-80">
            <ThreeOrb />
          </div>

          {/* Central Overlay HUD Text */}
          <div className="relative z-10 flex flex-col items-center text-center pointer-events-none px-4 py-2 rounded-xl bg-surface-container-lowest/70 backdrop-blur-sm border border-white/5 shadow-md">
            {isAlert ? (
              <AlertTriangle className="w-8 h-8 text-primary mb-1 animate-bounce" />
            ) : (
              <Shield className="w-7 h-7 text-secondary mb-1" />
            )}

            <span
              className={`font-mono text-xs font-bold tracking-widest uppercase transition-colors ${
                isAlert ? 'text-primary' : isElevated ? 'text-amber-400' : 'text-secondary'
              }`}
            >
              {isAlert ? 'THREAT DETECTED' : isElevated ? 'ELEVATED RISK' : 'MONITORING'}
            </span>
            <span className="font-mono text-[10px] text-on-surface-variant/80 mt-0.5">
              {riskScore}% RISK
            </span>
          </div>
        </div>
      </div>

      {/* Live Equalizer Bars */}
      <div className="mt-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-low border border-white/5 font-mono text-[11px] text-on-surface-variant">
        <Radio className={`w-3.5 h-3.5 ${isListening ? 'text-secondary animate-pulse' : 'text-on-surface-variant/40'}`} />
        <span>{isListening ? 'LIVE AMBIENT SPEECH LISTENER' : 'MIC STANDBY'}</span>
        <div className="flex items-center gap-0.5 ml-2 h-3.5">
          {frequencyBars.slice(0, 10).map((h, i) => (
            <div
              key={i}
              style={{ height: `${Math.min(14, Math.max(3, h / 2))}px` }}
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
