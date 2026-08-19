'use client';

import React, { useState } from 'react';
import { useSafety } from '@/lib/safety-context';
import { Camera, Mic, FolderArchive, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import Image from 'next/image';

export default function EvidenceDrawerPreview() {
  const { evidence, triggerSilentCapture, setActiveTab, speech } = useSafety();
  const [isCapturing, setIsCapturing] = useState(false);

  const handleManualCapture = async () => {
    setIsCapturing(true);
    await triggerSilentCapture('Manual Tactical Snapshot');
    setTimeout(() => setIsCapturing(false), 400);
  };

  const latestSnapshot = evidence.snapshots[0];

  return (
    <section className="glass-panel rounded-xl p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 text-on-surface-variant">
          <FolderArchive className="w-4 h-4 text-secondary" />
          <span className="font-mono text-xs uppercase tracking-wider font-semibold">
            Evidence Capture Pipeline
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-surface-container-lowest text-secondary font-mono text-[10px] rounded border border-secondary/20 uppercase flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-ping" />
            {evidence.snapshots.length} SNAPS • {evidence.audioClips.length} AUDIO
          </span>

          <button
            onClick={() => setActiveTab('vault')}
            className="flex items-center gap-1 text-xs font-mono text-secondary hover:text-white hover:underline transition-colors ml-1"
          >
            <span>View Vault</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Snapshot Thumbnail & Audio Controls Grid */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        {/* Covert Camera Preview Frame */}
        <div className="relative w-full sm:w-36 h-24 rounded-lg bg-surface-container-lowest border border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center group">
          {latestSnapshot?.imageUrl ? (
            <Image
              src={latestSnapshot.imageUrl}
              alt="Silent Evidence Snapshot"
              fill
              unoptimized
              className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-on-surface-variant/40">
              <Camera className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-mono">STANDBY</span>
            </div>
          )}

          {/* Timestamp Badge */}
          <div className="absolute bottom-0 left-0 w-full bg-black/70 px-2 py-0.5 font-mono text-[10px] text-secondary flex justify-between items-center">
            <span>{latestSnapshot?.relativeTime || 'T-0:00'}</span>
            <span className="text-[9px] text-on-surface-variant/80 truncate max-w-[80px]">
              {latestSnapshot?.timestamp || 'Armed'}
            </span>
          </div>

          {/* Trigger Snapshot Button Overlay */}
          <button
            onClick={handleManualCapture}
            disabled={isCapturing}
            title="Trigger Instant Silent Camera Frame Capture"
            className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/70 hover:bg-secondary/30 text-secondary border border-secondary/30 transition-all opacity-90 hover:opacity-100"
          >
            {isCapturing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
          </button>
        </div>

        {/* Audio Recording & Waveform Controls */}
        <div className="flex-grow w-full flex flex-col justify-center gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (evidence.isRecordingAudio) {
                    evidence.stopAudioRecording();
                  } else {
                    evidence.startAudioRecordingLoop();
                  }
                }}
                className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all ${
                  evidence.isRecordingAudio
                    ? 'bg-primary-container/20 border-primary text-primary animate-pulse'
                    : 'bg-surface-container border-white/10 hover:bg-surface-container-high text-on-surface'
                }`}
                title={evidence.isRecordingAudio ? 'Audio loop actively recording' : 'Start 5-min continuous audio loop'}
              >
                <Mic className="w-4 h-4" />
              </button>

              <div className="flex flex-col">
                <span className="font-mono text-xs font-semibold text-on-surface flex items-center gap-1.5">
                  Continuous 5-Min Ring Buffer
                  <ShieldCheck className="w-3.5 h-3.5 text-secondary" />
                </span>
                <span className="font-mono text-[10px] text-on-surface-variant/70">
                  {evidence.isRecordingAudio ? 'Active Loop: Auto-saving encrypted chunks' : 'Tap mic to initialize audio loop'}
                </span>
              </div>
            </div>

            <button
              onClick={handleManualCapture}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-variant border border-white/10 text-xs font-mono text-on-surface transition-all active:scale-95"
            >
              <Camera className="w-3.5 h-3.5 text-secondary" />
              <span>Capture Snap</span>
            </button>
          </div>

          {/* Audio Waveform Equalizer Display */}
          <div className="h-6 w-full flex items-center gap-1 px-2 rounded-md bg-surface-container-lowest/60 border border-white/5">
            {speech.frequencyData.map((val, i) => (
              <div
                key={i}
                style={{ height: `${Math.max(4, Math.min(20, val))}px` }}
                className="flex-1 bg-gradient-to-t from-secondary/40 to-secondary rounded-full transition-all duration-75"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
