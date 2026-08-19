'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ShieldAlert,
  Radio,
  Volume2,
  VolumeX,
  MapPin,
  Camera,
  FileText,
  Clock,
  ExternalLink,
  Send,
  AlertTriangle,
  Sparkles,
  Smartphone,
  CheckCircle2,
  RefreshCw,
  Maximize2,
} from 'lucide-react';
import Image from 'next/image';
import { EmergencyAlert } from '../api/emergency/route';
import { buildWhatsAppSOSLink, formatCoordinates } from '@/lib/utils';

export default function LaptopCommandCenter() {
  const [isArmed, setIsArmed] = useState(false);
  const [isSirenPlaying, setIsSirenPlaying] = useState(false);
  const [latestAlert, setLatestAlert] = useState<EmergencyAlert | null>(null);
  const [pollingActive, setPollingActive] = useState(true);
  const [lastPollTime, setLastPollTime] = useState<string>('');
  const [selectedPhotoModal, setSelectedPhotoModal] = useState<string | null>(null);

  const sirenIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastAlertIdRef = useRef<string | null>(null);

  // Synthesize loud emergency siren alarm using Web Audio API (sweeping 800Hz - 1200Hz)
  const playSirenTone = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(1250, ctx.currentTime + 0.35);
      osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.7);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.7);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.7);
    } catch (e) {
      console.warn('Siren tone error:', e);
    }
  }, []);

  const startContinuousSiren = useCallback(() => {
    setIsSirenPlaying(true);
    playSirenTone();
    if (sirenIntervalRef.current) clearInterval(sirenIntervalRef.current);
    sirenIntervalRef.current = setInterval(() => {
      playSirenTone();
    }, 750);
  }, [playSirenTone]);

  const stopSiren = useCallback(async () => {
    setIsSirenPlaying(false);
    if (sirenIntervalRef.current) {
      clearInterval(sirenIntervalRef.current);
      sirenIntervalRef.current = null;
    }

    // Call DELETE /api/emergency to clear state on server
    try {
      await fetch('/api/emergency', { method: 'DELETE' });
    } catch {}
  }, []);

  // Arm Guardian System (primes audio permissions)
  const handleArmSystem = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        audioContextRef.current = new AudioCtx();
        audioContextRef.current.resume();
      }
      playSirenTone();
      setIsArmed(true);
    } catch {
      setIsArmed(true);
    }
  };

  // Poll /api/emergency every 1000ms (1 second)
  useEffect(() => {
    if (!pollingActive) return;

    const pollTimer = setInterval(async () => {
      try {
        const res = await fetch(`/api/emergency?t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        });

        if (res.ok) {
          const data = await res.json();
          setLastPollTime(new Date().toLocaleTimeString());

          if (data.hasAlert && data.latestAlert) {
            const incoming: EmergencyAlert = data.latestAlert;
            setLatestAlert(incoming);

            // If a new alert is received that wasn't previously triggered
            if (incoming.id !== lastAlertIdRef.current) {
              lastAlertIdRef.current = incoming.id;
              if (isArmed && incoming.threat) {
                startContinuousSiren();
              }
            }
          } else {
            // No active alert
            if (latestAlert && !data.hasAlert) {
              setLatestAlert(null);
              lastAlertIdRef.current = null;
            }
          }
        }
      } catch (err) {
        console.warn('Polling error:', err);
      }
    }, 1000);

    return () => {
      clearInterval(pollTimer);
      if (sirenIntervalRef.current) clearInterval(sirenIntervalRef.current);
    };
  }, [isArmed, latestAlert, pollingActive, startContinuousSiren]);

  // Simulation Trigger for Judge Demo
  const triggerDemoAlert = async (phrase: string, reason: string) => {
    const payload = {
      threat: true,
      riskScore: 95,
      reason,
      photoBase64: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAP-OtIzAVIWQK-vPe03oQmvb05Hym94_zgcqWY9nGfL_00_aGm3wxuJNfVmg40AV-LGWXkjofNeZd5lXXaza1sxIy35pDhVMq2OIidMgkOatkeC_g73peHHxPdRuVSJwKrG5WO8WOGTY7ZTSjGyncLSViuH7ymV1_j29tyj6WiNKMdLa1bf5irqLfYh-YlSUy6fUOk7c1wDGzR1uViV61RTCFVNn9RcmN6KLPNqjb2CQmWp1uhYLC5Jg',
      coordinates: {
        lat: 34.0522,
        lng: -118.2437,
        mapsUrl: 'https://maps.google.com/?q=34.0522,-118.2437',
      },
      transcript: phrase,
      timestamp: new Date().toLocaleTimeString(),
      clientInfo: { device: 'iPhone 15 Pro • Mobile Node' },
    };

    await fetch('/api/emergency', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  };

  const activeLat = latestAlert?.coordinates?.lat || 34.0522;
  const activeLng = latestAlert?.coordinates?.lng || -118.2437;
  const { latStr, lngStr } = formatCoordinates(activeLat, activeLng);

  const whatsAppUrl = buildWhatsAppSOSLink({
    phone: '+919876543210',
    incidentId: latestAlert?.id || '#8421',
    lat: activeLat,
    lng: activeLng,
    threatLevel: 'CRITICAL',
    threatScore: latestAlert?.riskScore || 95,
    reason: latestAlert?.reason || 'Distress trigger detected from mobile phone.',
    transcript: latestAlert?.transcript,
  });

  return (
    <div className="min-h-screen bg-[#09090b] text-[#e5e1e4] flex flex-col font-sans data-grid selection:bg-red-500/30 selection:text-white select-none">
      {/* Flashing Crimson Siren Alert Banner */}
      {isSirenPlaying && (
        <div className="bg-red-600 text-white py-2.5 px-4 flex items-center justify-between shadow-[0_0_35px_rgba(220,38,38,0.9)] animate-pulse z-50 sticky top-0">
          <div className="flex items-center gap-3 font-mono text-xs sm:text-sm font-black tracking-widest uppercase">
            <ShieldAlert className="w-6 h-6 animate-bounce" />
            <span>🚨 EMERGENCY SIREN ACTIVE: HIGH-PRIORITY DISTRESS ALERT RECEIVED FROM PHONE</span>
          </div>
          <button
            onClick={stopSiren}
            className="px-4 py-1.5 rounded-lg bg-black hover:bg-black/80 text-white font-mono text-xs font-bold border border-white/20 transition-all flex items-center gap-1.5 shadow-lg active:scale-95"
          >
            <VolumeX className="w-4 h-4 text-red-400" />
            <span>SILENCE ALARM</span>
          </button>
        </div>
      )}

      {/* Top Bar */}
      <header className="h-16 border-b border-white/10 bg-surface/80 backdrop-blur-xl px-6 flex justify-between items-center z-40 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-surface-container-high border border-white/10 flex items-center justify-center text-secondary shadow-[0_0_15px_rgba(78,222,163,0.2)]">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-mono text-sm sm:text-base font-bold tracking-wider text-on-surface">
                AURA GUARD COMMAND CENTER
              </h1>
              <span className="px-2 py-0.5 rounded bg-secondary/15 text-secondary border border-secondary/30 font-mono text-[10px] font-bold">
                LAPTOP HUD
              </span>
            </div>
            <p className="font-mono text-[10px] text-on-surface-variant/70 hidden sm:inline">
              Real-Time Emergency Bridge • Polling `/api/emergency` every 1000ms
            </p>
          </div>
        </div>

        {/* Action Controls & Arm Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const base = typeof window !== 'undefined' ? window.location.origin : 'https://e-d-i-t-h-ai.vercel.app';
              navigator.clipboard?.writeText(`${base}/`);
              alert(`Copied Mobile Victim Link to clipboard:\n${base}/`);
            }}
            title="Copy Mobile Victim Link to open on smartphone"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-white/10 text-xs font-mono text-secondary hover:text-white transition-all active:scale-95"
          >
            <span>📱 Copy Mobile Link</span>
          </button>

          <a
            href="/"
            title="Switch to Mobile Sentinel Client"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-white/10 text-xs font-mono text-on-surface-variant hover:text-white transition-all active:scale-95"
          >
            <span>View Mobile Client</span>
          </a>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface-container border border-white/5 font-mono text-xs text-on-surface-variant">
            <RefreshCw className="w-3.5 h-3.5 text-secondary animate-spin" />
            <span className="hidden md:inline">Sync: {lastPollTime || '1000ms'}</span>
          </div>

          <button
            onClick={isArmed ? (isSirenPlaying ? stopSiren : playSirenTone) : handleArmSystem}
            className={`px-4 py-2 rounded-xl font-mono text-xs font-black tracking-wider uppercase flex items-center gap-2 transition-all active:scale-95 shadow-md ${
              isArmed
                ? isSirenPlaying
                  ? 'bg-red-600 text-white border border-red-400 animate-pulse shadow-[0_0_20px_rgba(220,38,38,0.7)]'
                  : 'bg-surface-container hover:bg-surface-container-high text-secondary border border-secondary/40'
                : 'bg-secondary text-on-secondary-container border border-secondary shadow-[0_0_20px_rgba(78,222,163,0.5)]'
            }`}
          >
            {isArmed ? (
              isSirenPlaying ? (
                <>
                  <VolumeX className="w-4 h-4" />
                  <span>Silence Alarm</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-secondary" />
                  <span>Guardian Armed (Test Siren)</span>
                </>
              )
            ) : (
              <>
                <Volume2 className="w-4 h-4" />
                <span>Arm Guardian System</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Command Dashboard Layout */}
      <main className="flex-1 p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1600px] mx-auto w-full">
        {/* LEFT COLUMN: Tactical Live Map & Dispatch */}
        <section className="lg:col-span-5 flex flex-col gap-4">
          <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between gap-4 h-full border border-white/10 relative overflow-hidden">
            <div className="flex justify-between items-center z-10">
              <div className="flex items-center gap-2 text-secondary font-mono text-xs font-bold uppercase tracking-wider">
                <MapPin className="w-4 h-4" />
                <span>Live GNSS GPS Telemetry</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-secondary/15 text-secondary border border-secondary/30 font-mono text-[10px] font-bold">
                GNSS LOCKED
              </span>
            </div>

            {/* Embedded OpenStreetMap / Tactical Frame */}
            <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/10 bg-surface-container-lowest flex items-center justify-center shadow-inner">
              <iframe
                title="Tactical GNSS Location Map"
                className="w-full h-full border-0 filter invert contrast-125 opacity-75"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${activeLng - 0.01}%2C${activeLat - 0.01}%2C${activeLng + 0.01}%2C${activeLat + 0.01}&layer=mapnik&marker=${activeLat}%2C${activeLng}`}
              />

              {/* Pulsing Radar Pin Overlay */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-red-500/30 border-2 border-red-500 flex items-center justify-center animate-ping absolute" />
                <div className="w-5 h-5 rounded-full bg-red-600 border-2 border-white flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,1)] z-10" />
              </div>

              {/* Coordinates Pill */}
              <div className="absolute bottom-2 left-2 right-2 bg-black/85 backdrop-blur-sm p-2 rounded-lg border border-white/10 font-mono text-xs flex justify-between items-center text-on-surface">
                <span>{latStr}, {lngStr}</span>
                <a
                  href={`https://maps.google.com/?q=${activeLat},${activeLng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-secondary hover:underline flex items-center gap-1 text-[11px]"
                >
                  <span>Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Sector Telemetry & Device Info */}
            <div className="p-3 rounded-xl bg-surface-container font-mono text-xs space-y-1.5 border border-white/5">
              <div className="flex justify-between text-on-surface-variant text-[11px]">
                <span>Node Identity:</span>
                <span className="text-on-surface font-semibold">
                  {latestAlert?.clientInfo?.device || 'Mobile Phone Sentinel'}
                </span>
              </div>
              <div className="flex justify-between text-on-surface-variant text-[11px]">
                <span>Sector Address:</span>
                <span className="text-secondary font-semibold">Urban Transit Corridor (Live Fix)</span>
              </div>
            </div>

            {/* 1-Click Police / WhatsApp Dispatch Button */}
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-secondary text-on-secondary-container font-mono text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(78,222,163,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Send className="w-4 h-4" />
              <span>1-Click Police / WhatsApp SOS Dispatch</span>
            </a>
          </div>
        </section>

        {/* RIGHT COLUMN: Threat Brief, Photo Snapshot & Transcript */}
        <section className="lg:col-span-7 flex flex-col gap-4">
          {/* Threat Brief Header Card */}
          <div className="glass-panel p-5 rounded-2xl flex flex-col gap-4 border border-white/10">
            <div className="flex justify-between items-center font-mono text-xs">
              <span className="text-on-surface-variant font-bold uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-primary" />
                <span>Threat Intelligence Assessment</span>
              </span>
              <span
                className={`font-bold px-3 py-1 rounded border text-sm ${
                  latestAlert?.threat
                    ? 'bg-red-600/20 text-red-400 border-red-500 animate-pulse'
                    : 'bg-secondary/15 text-secondary border-secondary/30'
                }`}
              >
                {latestAlert?.riskScore || 5}% RISK
              </span>
            </div>

            {/* Dynamic Progress Bar */}
            <div className="w-full h-3 bg-surface-container-lowest rounded-full overflow-hidden p-0.5 border border-white/5">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  latestAlert?.threat
                    ? 'bg-gradient-to-r from-amber-500 to-red-500 shadow-[0_0_15px_rgba(220,38,38,0.8)]'
                    : 'bg-secondary shadow-[0_0_10px_rgba(78,222,163,0.5)]'
                }`}
                style={{ width: `${Math.max(4, latestAlert?.riskScore || 5)}%` }}
              />
            </div>

            {/* Reason & Time Banner */}
            <div className="p-3 rounded-xl bg-surface-container-lowest border border-white/5 font-mono text-xs">
              <span className="text-secondary font-bold mr-2">[DETECTED REASON]:</span>
              <span className="text-on-surface font-medium">
                {latestAlert?.reason || 'Passive acoustic sentinel active. Waiting for mobile trigger.'}
              </span>
              <div className="text-[10px] text-on-surface-variant/70 mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-secondary" />
                <span>Logged at: {latestAlert?.timestamp || 'Standby'}</span>
              </div>
            </div>
          </div>

          {/* Dual Evidence Row: Live Snapshot + Audio Transcript */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
            {/* Live Camera Snapshot */}
            <div className="glass-panel p-4 rounded-2xl flex flex-col gap-3 border border-white/10">
              <div className="flex justify-between items-center font-mono text-xs">
                <span className="text-on-surface font-bold flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-secondary" />
                  <span>Silent Photo Capture</span>
                </span>
                <span className="text-[10px] text-secondary bg-secondary/10 px-2 py-0.5 rounded border border-secondary/20 font-bold">
                  {latestAlert?.photoBase64 ? 'LIVE PHOTO' : 'STANDBY'}
                </span>
              </div>

              <div
                onClick={() =>
                  setSelectedPhotoModal(
                    latestAlert?.photoBase64 ||
                      'https://lh3.googleusercontent.com/aida-public/AB6AXuAP-OtIzAVIWQK-vPe03oQmvb05Hym94_zgcqWY9nGfL_00_aGm3wxuJNfVmg40AV-LGWXkjofNeZd5lXXaza1sxIy35pDhVMq2OIidMgkOatkeC_g73peHHxPdRuVSJwKrG5WO8WOGTY7ZTSjGyncLSViuH7ymV1_j29tyj6WiNKMdLa1bf5irqLfYh-YlSUy6fUOk7c1wDGzR1uViV61RTCFVNn9RcmN6KLPNqjb2CQmWp1uhYLC5Jg'
                  )
                }
                className="relative aspect-video rounded-xl overflow-hidden border border-white/10 bg-surface-container-lowest group cursor-pointer flex-1 min-h-[160px]"
              >
                <Image
                  src={
                    latestAlert?.photoBase64 ||
                    'https://lh3.googleusercontent.com/aida-public/AB6AXuAP-OtIzAVIWQK-vPe03oQmvb05Hym94_zgcqWY9nGfL_00_aGm3wxuJNfVmg40AV-LGWXkjofNeZd5lXXaza1sxIy35pDhVMq2OIidMgkOatkeC_g73peHHxPdRuVSJwKrG5WO8WOGTY7ZTSjGyncLSViuH7ymV1_j29tyj6WiNKMdLa1bf5irqLfYh-YlSUy6fUOk7c1wDGzR1uViV61RTCFVNn9RcmN6KLPNqjb2CQmWp1uhYLC5Jg'
                  }
                  alt="Silent forensic photo"
                  fill
                  unoptimized
                  className="object-cover opacity-85 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                />
                <div className="absolute bottom-0 left-0 w-full p-2 bg-black/80 flex justify-between items-center font-mono text-[10px] text-secondary">
                  <span>{latestAlert?.timestamp || 'Ready'}</span>
                  <Maximize2 className="w-3 h-3 text-white" />
                </div>
              </div>
            </div>

            {/* Transcript Snippet Feed */}
            <div className="glass-panel p-4 rounded-2xl flex flex-col justify-between gap-3 border border-white/10">
              <div className="flex justify-between items-center font-mono text-xs">
                <span className="text-on-surface font-bold flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-secondary" />
                  <span>Acoustic Transcript</span>
                </span>
              </div>

              <div className="p-3 rounded-xl bg-surface-container-lowest border border-white/5 font-mono text-xs text-on-surface leading-relaxed flex-1 overflow-y-auto custom-scrollbar select-text min-h-[100px]">
                {latestAlert?.transcript ? (
                  <p className="text-primary font-bold">&ldquo;{latestAlert.transcript}&rdquo;</p>
                ) : (
                  <p className="text-on-surface-variant/50 italic">
                    Awaiting ambient voice distress broadcast from phone...
                  </p>
                )}
              </div>

              {/* Instant Simulation Injections for Judges */}
              <div className="pt-2 border-t border-white/5 flex flex-col gap-1.5">
                <span className="font-mono text-[10px] text-on-surface-variant/70 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-secondary" /> Test Alert from Laptop:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() =>
                      triggerDemoAlert(
                        'Bhaiya ruko, you are taking the wrong way! Stop the car!',
                        'Distress Trigger: Route Deviation Panic'
                      )
                    }
                    className="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high border border-white/10 text-[10px] font-mono text-secondary"
                  >
                    ▶ &quot;Wrong Way / Stop&quot;
                  </button>
                  <button
                    onClick={() =>
                      triggerDemoAlert(
                        'Bachao! Leave me alone, don\'t touch me!',
                        'Distress Trigger: Physical Threat / Coercion'
                      )
                    }
                    className="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high border border-white/10 text-[10px] font-mono text-red-400"
                  >
                    ▶ &quot;Bachao!&quot;
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Snapshot Zoom Modal */}
      {selectedPhotoModal && (
        <div
          onClick={() => setSelectedPhotoModal(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full rounded-2xl overflow-hidden bg-surface-container-low border border-white/10 p-4 flex flex-col gap-3"
          >
            <div className="flex justify-between items-center font-mono text-xs text-secondary">
              <span>ENLARGED SILENT FORENSIC SNAPSHOT</span>
              <button
                onClick={() => setSelectedPhotoModal(null)}
                className="text-on-surface-variant hover:text-white font-bold"
              >
                ✕ CLOSE
              </button>
            </div>
            <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black">
              <Image
                src={selectedPhotoModal}
                alt="Enlarged snapshot"
                fill
                unoptimized
                className="object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
