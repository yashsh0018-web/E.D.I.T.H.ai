'use client';

import React from 'react';
import { useSafety } from '@/lib/safety-context';
import AudioVisualizer from './AudioVisualizer';
import ThreatMeter from './ThreatMeter';
import LiveTelemetryCard from './LiveTelemetryCard';
import EventLogTerminal from './EventLogTerminal';
import EvidenceDrawerPreview from './EvidenceDrawerPreview';
import { Shield, Mic, Camera, Navigation, Send, AlertOctagon } from 'lucide-react';

export default function DashboardHUD() {
  const {
    threatLevel,
    threatScore,
    speech,
    triggerEmergency,
    resolveEmergency,
    geo,
    evidence,
    dispatchWhatsAppSOS,
  } = useSafety();

  const isAlert = threatLevel === 'CRITICAL';

  return (
    <div className="pt-20 pb-32 px-4 md:px-8 flex flex-col gap-5 max-w-container-max mx-auto w-full relative z-10 animate-fadeIn select-none">
      {/* Permission Status Badges Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-surface-container-low/80 border border-white/5 font-mono text-[11px]">
        <div className="flex items-center gap-3">
          {/* Mic Badge */}
          <span className="flex items-center gap-1.5 text-secondary">
            <Mic className="w-3.5 h-3.5" />
            <span>MIC: {speech.isListening ? 'ACTIVE (Continuous)' : 'STANDBY'}</span>
          </span>

          {/* Cam Badge */}
          <span className="flex items-center gap-1.5 text-on-surface-variant">
            <Camera className="w-3.5 h-3.5 text-secondary" />
            <span>CAM: {evidence.cameraActive ? 'CAPTURING' : 'READY (Covert)'}</span>
          </span>

          {/* GPS Badge */}
          <span className="flex items-center gap-1.5 text-on-surface-variant">
            <Navigation className="w-3.5 h-3.5 text-secondary" />
            <span>GPS: {geo.isLocked ? 'ACTIVE (GNSS Locked)' : 'INITIALIZING'}</span>
          </span>
        </div>

        <div className="flex items-center gap-1 text-[10px] text-on-surface-variant/70">
          <Shield className="w-3 h-3 text-secondary" />
          <span>DUAL-LAYER SENTINEL ARMED</span>
        </div>
      </div>

      {/* Emergency Dispatch Visual Ticker Simulator */}
      {isAlert && (
        <div className="p-3 rounded-xl bg-primary-container/20 border border-primary text-primary font-mono text-xs flex items-center justify-between gap-3 shadow-[0_0_20px_rgba(220,38,38,0.4)] animate-pulse">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 animate-bounce" />
            <span className="font-bold">
              DISPATCHING EMERGENCY DATA PACKET TO GUARDIAN CONTACT...
            </span>
          </div>
          <button
            onClick={() => dispatchWhatsAppSOS()}
            className="px-3 py-1 rounded-lg bg-primary text-on-primary font-bold text-[11px] hover:opacity-90 transition-opacity"
          >
            Launch WhatsApp Now
          </button>
        </div>
      )}

      {/* 3D Visualizer Orb & Acoustic Waveform */}
      <AudioVisualizer
        threatLevel={threatLevel}
        riskScore={threatScore}
        isListening={speech.isListening}
        onToggleSOS={() => {
          if (isAlert) resolveEmergency();
          else triggerEmergency('Manual Tap on Central Orb');
        }}
      />

      {/* Threat Level & GPS Telemetry Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ThreatMeter />
        <LiveTelemetryCard />
      </section>

      {/* Event Log Terminal with Test Speech Injections */}
      <EventLogTerminal />

      {/* Evidence Capture Drawer Preview */}
      <EvidenceDrawerPreview />
    </div>
  );
}
