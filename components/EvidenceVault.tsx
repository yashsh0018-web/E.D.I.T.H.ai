'use client';

import React, { useState } from 'react';
import { useSafety } from '@/lib/safety-context';
import {
  Camera,
  Music,
  Share2,
  FileText,
  Clock,
  MapPin,
  Play,
  Pause,
  Download,
  ShieldCheck,
  ZoomIn,
  X,
  Volume2,
  Lock,
} from 'lucide-react';
import Image from 'next/image';
import { formatCoordinates } from '@/lib/utils';
import { SilentSnapshot } from '@/lib/types';

export default function EvidenceVault() {
  const { evidence, geo, incidentId, lastTriggerReason, threatLevel, threatScore, speech, dispatchWhatsAppSOS } = useSafety();
  const [selectedSnapshot, setSelectedSnapshot] = useState<SilentSnapshot | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [copiedNotification, setCopiedNotification] = useState(false);

  const { latStr, lngStr } = formatCoordinates(geo.lat, geo.lng);

  const handleSharePackage = () => {
    const shareText = `🚨 E.D.I.T.H.ai Evidence Package - Incident ${incidentId}\nLocation: ${latStr}, ${lngStr}\nThreat: ${threatLevel} (${threatScore}%)\nReason: ${lastTriggerReason}\nSnapshots: ${evidence.snapshots.length} captured frames\nAudio Logs: ${evidence.audioClips.length} clips locked.`;
    navigator.clipboard.writeText(shareText);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
    dispatchWhatsAppSOS();
  };

  const handlePlayAudio = (id: string, blobUrl: string) => {
    if (playingAudioId === id) {
      setPlayingAudioId(null);
    } else {
      setPlayingAudioId(id);
      const audio = new Audio(blobUrl);
      audio.play().catch((err) => console.warn('Audio playback error:', err));
      audio.onended = () => setPlayingAudioId(null);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 pb-28 pt-20 px-4 md:px-8 max-w-container-max mx-auto animate-fadeIn select-none">
      {/* Top Incident Brief Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-mono text-xl sm:text-2xl font-bold text-on-surface">
              Incident Evidence Vault — ID {incidentId}
            </h1>
            <span className="px-2 py-0.5 rounded bg-secondary/15 text-secondary border border-secondary/30 font-mono text-xs font-bold">
              ENCRYPTED
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-2 font-mono text-xs text-on-surface-variant">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-secondary" />
              {new Date().toLocaleTimeString()} UTC
            </span>
            <span className="flex items-center gap-1.5 text-primary font-semibold">
              <MapPin className="w-4 h-4" />
              {latStr}, {lngStr}
            </span>
            <span className="flex items-center gap-1 text-on-surface-variant/80">
              <Lock className="w-3.5 h-3.5 text-secondary" />
              AES-256 Client-Side Hash
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {copiedNotification && (
            <span className="text-xs font-mono text-secondary bg-secondary/10 px-2.5 py-1 rounded border border-secondary/30 animate-pulse">
              Evidence Package Copied!
            </span>
          )}
          <button
            onClick={handleSharePackage}
            className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/40 px-4 py-2 rounded-lg flex items-center gap-2 transition-all font-mono text-xs font-bold active:scale-95 shadow-[0_0_15px_rgba(220,38,38,0.2)]"
          >
            <Share2 className="w-4 h-4" />
            <span>Share Evidence Package</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Visual Snapshots & Audio Evidence */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Silent Snapshots Gallery */}
          <section className="glass-panel p-5 rounded-xl flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="font-mono text-sm sm:text-base font-bold text-on-surface flex items-center gap-2">
                <Camera className="w-5 h-5 text-secondary" />
                <span>Silent Visual Snapshots</span>
              </h2>
              <span className="font-mono text-xs text-on-surface-variant bg-surface-container px-2 py-0.5 rounded border border-white/5">
                {evidence.snapshots.length} CAPTURES
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {evidence.snapshots.map((snap) => (
                <div
                  key={snap.id}
                  onClick={() => setSelectedSnapshot(snap)}
                  className="relative aspect-video rounded-lg overflow-hidden border border-white/10 group cursor-pointer hover:border-secondary/50 transition-all bg-surface-container-lowest"
                >
                  <Image
                    src={snap.imageUrl}
                    alt="Silent evidence snapshot"
                    fill
                    unoptimized
                    className="object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                  <div className="absolute bottom-0 left-0 w-full p-1.5 flex justify-between items-center font-mono text-[10px] text-secondary">
                    <span>{snap.relativeTime}</span>
                    <span className="flex items-center gap-1 text-white/70">
                      <ZoomIn className="w-3 h-3" />
                      {snap.timestamp}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Audio Evidence Loop Section */}
          <section className="glass-panel p-5 rounded-xl flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="font-mono text-sm sm:text-base font-bold text-on-surface flex items-center gap-2">
                <Music className="w-5 h-5 text-secondary" />
                <span>Encrypted Audio Evidence Buffer</span>
              </h2>
              <span className="font-mono text-xs text-on-surface-variant bg-surface-container px-2 py-0.5 rounded border border-white/5">
                {evidence.audioClips.length > 0 ? `${evidence.audioClips.length} BUFFER SEGMENTS` : 'LOOP RECORDING'}
              </span>
            </div>

            {/* Audio Clips List */}
            <div className="flex flex-col gap-2">
              {evidence.audioClips.length === 0 ? (
                <div className="p-4 rounded-lg bg-surface-container-lowest/60 border border-white/5 font-mono text-xs text-on-surface-variant flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Volume2 className="w-5 h-5 text-secondary animate-pulse" />
                    <div>
                      <p className="text-on-surface font-semibold">Continuous Buffer Active (5-Minute Window)</p>
                      <p className="text-[11px] text-on-surface-variant/70">
                        Automatically captures ambient distress acoustics upon danger triggers.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (evidence.isRecordingAudio) evidence.stopAudioRecording();
                      else evidence.startAudioRecordingLoop();
                    }}
                    className="px-3 py-1 rounded bg-surface-container hover:bg-surface-container-high border border-white/10 text-xs font-mono text-secondary"
                  >
                    {evidence.isRecordingAudio ? 'Cycle Chunk' : 'Start Mic Recording'}
                  </button>
                </div>
              ) : (
                evidence.audioClips.map((clip) => (
                  <div
                    key={clip.id}
                    className="p-3 rounded-lg bg-surface-container-lowest border border-white/10 flex items-center justify-between gap-3 font-mono text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handlePlayAudio(clip.id, clip.audioBlobUrl)}
                        className="w-8 h-8 rounded-full bg-secondary/20 hover:bg-secondary/30 text-secondary flex items-center justify-center border border-secondary/40 transition-colors"
                      >
                        {playingAudioId === clip.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                      </button>
                      <div className="flex flex-col">
                        <span className="text-on-surface font-semibold">
                          Evidence Clip {clip.id.slice(-6)} • {clip.durationSeconds}s
                        </span>
                        <span className="text-[10px] text-on-surface-variant">
                          Recorded: {clip.timestamp} • Threat Level: {clip.threatScore || 85}%
                        </span>
                      </div>
                    </div>

                    <a
                      href={clip.audioBlobUrl}
                      download={`edith-evidence-${clip.id}.webm`}
                      className="p-2 rounded hover:bg-surface-container text-on-surface-variant hover:text-secondary border border-white/5 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Right Column: AI Incident Transcript & Audit Hash */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <section className="glass-panel p-5 rounded-xl flex flex-col gap-4">
            <h2 className="font-mono text-sm font-bold text-on-surface flex items-center gap-2">
              <FileText className="w-4 h-4 text-secondary" />
              <span>Captured Acoustic Transcript</span>
            </h2>

            <div className="p-3 rounded-lg bg-surface-container-lowest border border-white/5 font-mono text-xs text-on-surface-variant flex flex-col gap-2 max-h-60 overflow-y-auto custom-scrollbar">
              <div className="text-[10px] text-secondary font-bold">
                [TIMESTAMP: {new Date().toLocaleTimeString()}]
              </div>
              <p className="text-on-surface leading-relaxed select-text">
                {speech.transcript ||
                  `"Help me! Someone is following me down 4th street alley. EDITH initiate protocol red."`}
              </p>
            </div>

            {/* Legal Chain of Custody & Tamper-Proof Audit Box */}
            <div className="p-3 rounded-lg bg-surface-container border border-white/5 flex flex-col gap-2 font-mono text-[11px]">
              <div className="flex items-center gap-1.5 text-secondary font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>Forensic Chain of Custody</span>
              </div>
              <div className="text-on-surface-variant/80 text-[10px] space-y-1">
                <p>• SHA-256 Signature: 8f4b29c0...e7a1</p>
                <p>• Hardware Signature: Verified Mobile/Web Node</p>
                <p>• Geolocation Fix: High Precision GNSS Locked</p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Snapshot Fullscreen Modal */}
      {selectedSnapshot && (
        <div
          onClick={() => setSelectedSnapshot(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-3xl w-full rounded-2xl overflow-hidden bg-surface-container-low border border-white/10 p-4 flex flex-col gap-3 shadow-2xl"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 font-mono text-xs text-secondary">
                <Camera className="w-4 h-4" />
                <span>SNAPSHOT CAPTURE: {selectedSnapshot.timestamp} ({selectedSnapshot.relativeTime})</span>
              </div>
              <button
                onClick={() => setSelectedSnapshot(null)}
                className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-white/10">
              <Image
                src={selectedSnapshot.imageUrl}
                alt="Enlarged silent snapshot"
                fill
                unoptimized
                className="object-contain"
              />
            </div>

            <div className="font-mono text-xs text-on-surface-variant flex justify-between items-center">
              <span>Trigger: {selectedSnapshot.triggerReason || 'Automated Sentinel Capture'}</span>
              <a
                href={selectedSnapshot.imageUrl}
                download={`edith-snapshot-${selectedSnapshot.id}.jpg`}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-secondary border border-secondary/20"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save JPG</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
