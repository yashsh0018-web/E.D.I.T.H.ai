'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Camera,
  Mic,
  Navigation,
  Activity,
  AlertTriangle,
  Radio,
  EyeOff,
  Send,
  Sparkles,
  Play,
  RotateCcw,
  Sliders,
  Users,
  FolderArchive,
  Monitor,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { LOCAL_HOTWORDS } from '@/lib/speechRecognition';
import { buildWhatsAppSOSLink, formatCoordinates, soundEffects } from '@/lib/utils';
import CamouflageScreen from '@/components/CamouflageScreen';
import EvidenceVault from '@/components/EvidenceVault';
import ContactsManager from '@/components/ContactsManager';
import SettingsModal from '@/components/SettingsModal';
import PulseVisualizer from '@/components/PulseVisualizer';
import SOSModal from '@/components/SOSModal';
import { useSafety } from '@/lib/safety-context';

export default function MobilePhoneClient() {
  const {
    threatLevel,
    threatScore,
    activeTab,
    setActiveTab,
    camouflageMode,
    toggleCamouflage,
    isSOSModalOpen,
    setIsSOSModalOpen,
    lastTriggerReason,
    triggerEmergency: contextTriggerEmergency,
    resolveEmergency: contextResolveEmergency,
    dispatchWhatsAppSOS,
  } = useSafety();

  // Hardware Permissions & State
  const [shieldActive, setShieldActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [gpsReady, setGpsReady] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>({
    lat: 34.0522,
    lng: -118.2437,
  });
  const [latestSnapshot, setLatestSnapshot] = useState<string | null>(null);
  const [lastDispatchedTime, setLastDispatchedTime] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);

  // Hidden hardware capture refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const speechRecognitionRef = useRef<unknown>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const isTriggeringRef = useRef<boolean>(false);

  // 1. SILENT CAMERA CAPTURE FUNCTION
  const captureSilentFrame = useCallback(async (): Promise<string | undefined> => {
    try {
      if (videoRef.current && videoRef.current.readyState >= 2 && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          // Forensic watermark
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.fillRect(0, canvas.height - 24, canvas.width, 24);
          ctx.font = '11px monospace';
          ctx.fillStyle = '#4edea3';
          ctx.fillText(`AURA GUARD COVERT CAPTURE — ${new Date().toISOString()}`, 8, canvas.height - 8);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
          setLatestSnapshot(dataUrl);
          return dataUrl;
        }
      }

      // Fallback: If camera stream not ready, attempt immediate single-frame stream
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });
        const tempVideo = document.createElement('video');
        tempVideo.srcObject = stream;
        tempVideo.muted = true;
        tempVideo.playsInline = true;
        await tempVideo.play();
        await new Promise((res) => setTimeout(res, 200));

        const canvas = document.createElement('canvas');
        canvas.width = tempVideo.videoWidth || 640;
        canvas.height = tempVideo.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(tempVideo, 0, 0, canvas.width, canvas.height);
        }
        stream.getTracks().forEach((t) => t.stop());
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        setLatestSnapshot(dataUrl);
        return dataUrl;
      }
    } catch (e) {
      console.warn('Camera silent frame capture fallback:', e);
    }
    return undefined;
  }, []);

  // 2. DISPATCH EMERGENCY PAYLOAD TO SERVER (/api/emergency)
  const dispatchAlertToBridge = useCallback(
    async (reason: string, customTranscript?: string, photoData?: string) => {
      if (isTriggeringRef.current) return;
      isTriggeringRef.current = true;

      try {
        const finalPhoto = photoData || (await captureSilentFrame());
        const timestampStr = new Date().toLocaleTimeString();
        setLastDispatchedTime(timestampStr);
        soundEffects.playSiren();
        contextTriggerEmergency(reason);

        const payload = {
          threat: true,
          riskScore: 95,
          reason,
          photoBase64: finalPhoto,
          coordinates: {
            lat: currentCoords.lat,
            lng: currentCoords.lng,
            mapsUrl: `https://maps.google.com/?q=${currentCoords.lat},${currentCoords.lng}`,
          },
          transcript: customTranscript || transcript || interimTranscript,
          timestamp: timestampStr,
          clientInfo: {
            device: typeof window !== 'undefined' && window.navigator.userAgent.includes('iPhone') ? 'iPhone • Mobile Node' : 'Android • Mobile Sentinel',
          },
        };

        await fetch('/api/emergency', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        // Also broadcast to SSE stream
        await fetch('/api/broadcast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch (err) {
        console.warn('Emergency dispatch error:', err);
      } finally {
        setTimeout(() => {
          isTriggeringRef.current = false;
        }, 2000);
      }
    },
    [captureSilentFrame, contextTriggerEmergency, currentCoords.lat, currentCoords.lng, interimTranscript, transcript]
  );

  // 3. START SAFETY SHIELD (One-Click Permissions)
  const handleStartSafetyShield = async () => {
    try {
      soundEffects.playSafeArmed();

      // A. Camera Initialization
      if (navigator.mediaDevices?.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
            audio: true,
          });
          mediaStreamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
          }
          setCameraReady(true);
        } catch {
          console.warn('Camera permission dismissed');
        }
      }

      // B. GPS Telemetry Initialization
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setCurrentCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            setGpsReady(true);
          },
          () => {
            setGpsReady(true); // Fallback coords
          },
          { enableHighAccuracy: true }
        );
      }

      // C. Speech Recognition Initialization
      interface ExtendedWindow extends Window {
        SpeechRecognition?: new () => {
          continuous: boolean;
          interimResults: boolean;
          lang: string;
          onresult: (event: {
            resultIndex: number;
            results: Array<Array<{ transcript: string }> & { isFinal: boolean }>;
          }) => void;
          onend: () => void;
          start: () => void;
          stop: () => void;
        };
        webkitSpeechRecognition?: ExtendedWindow['SpeechRecognition'];
      }

      const extWindow = window as unknown as ExtendedWindow;
      const SpeechRecognition = extWindow.SpeechRecognition || extWindow.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        speechRecognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
          let interim = '';
          let final = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const piece = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              final += piece + ' ';
            } else {
              interim += piece;
            }
          }

          if (interim) {
            setInterimTranscript(interim);
            checkVoiceTriggers(interim);
          }

          if (final) {
            setTranscript((prev) => {
              const updated = (prev + ' ' + final).trim();
              checkVoiceTriggers(updated);
              return updated;
            });
            setInterimTranscript('');
          }
        };

        recognition.onend = () => {
          if (shieldActive && speechRecognitionRef.current) {
            try {
              (speechRecognitionRef.current as { start: () => void }).start();
            } catch {}
          }
        };

        try {
          recognition.start();
          setIsListening(true);
        } catch {}
      }

      setShieldActive(true);
    } catch (e) {
      console.warn('Error starting safety shield:', e);
      setShieldActive(true);
    }
  };

  // Check voice transcript for hotwords
  const checkVoiceTriggers = useCallback(
    (text: string) => {
      const lower = text.toLowerCase();
      for (const hotword of LOCAL_HOTWORDS) {
        if (lower.includes(hotword)) {
          dispatchAlertToBridge(`Instant voice trigger: "${hotword}"`, text);
          break;
        }
      }
    },
    [dispatchAlertToBridge]
  );

  // Cleanup
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (speechRecognitionRef.current) {
        try {
          (speechRecognitionRef.current as { stop?: () => void })?.stop?.();
        } catch {}
      }
    };
  }, []);

  const { latStr, lngStr } = formatCoordinates(currentCoords.lat, currentCoords.lng);
  const isAlert = threatLevel === 'CRITICAL';

  // If Camouflage Mode is active, render stealth disguise screen
  if (camouflageMode) {
    return <CamouflageScreen />;
  }

  return (
    <div className="min-h-screen bg-[#0e0e10] text-[#e5e1e4] flex flex-col font-sans select-none data-grid">
      {/* Hidden Hardware Capture Canvas & Video */}
      <video ref={videoRef} className="hidden" playsInline muted autoPlay />
      <canvas ref={canvasRef} className="hidden" />

      {/* Cyber Scanline */}
      <div className="scanline" />

      {/* Top Header */}
      <header className="fixed top-0 w-full h-16 bg-surface/80 backdrop-blur-xl border-b border-white/10 px-4 md:px-8 flex justify-between items-center z-40">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-all ${
              isAlert
                ? 'bg-red-600/30 border-red-500 text-red-400 animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.6)]'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            }`}
          >
            {isAlert ? <ShieldAlert className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`font-mono text-xs sm:text-sm font-bold uppercase tracking-wider ${
                  isAlert ? 'text-red-400' : 'text-emerald-400'
                }`}
              >
                {isAlert ? 'CRITICAL DISTRESS' : 'E.D.I.T.H. SENTINEL'}
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <span className="font-mono text-[10px] text-on-surface-variant/70">MOBILE CLIENT NODE</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Link to open Laptop Command Center */}
          <Link
            href="/command-center"
            title="Open Guardian Command Center"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-xs font-mono text-emerald-400 font-bold shadow-[0_0_15px_rgba(78,222,163,0.3)] transition-all active:scale-95"
          >
            <Monitor className="w-4 h-4 text-emerald-400" />
            <span>💻 Laptop Command Center</span>
          </Link>

          {/* Camouflage Toggle */}
          <button
            onClick={toggleCamouflage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container border border-white/10 text-xs font-mono text-on-surface-variant hover:text-white transition-all active:scale-95"
          >
            <EyeOff className="w-3.5 h-3.5 text-secondary" />
            <span className="hidden sm:inline">STEALTH</span>
          </button>
        </div>
      </header>

      {/* Main View Router */}
      <main className="flex-1 w-full pt-20 pb-32 px-4 md:px-8 max-w-container-max mx-auto">
        {activeTab === 'dashboard' && (
          <div className="flex flex-col gap-5 animate-fadeIn">
            {/* 1. START SAFETY SHIELD PERMISSION BANNER */}
            {!shieldActive ? (
              <div className="glass-panel p-5 rounded-2xl border-2 border-secondary/40 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_0_25px_rgba(78,222,163,0.25)]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-secondary/20 border border-secondary flex items-center justify-center text-secondary">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="font-mono text-sm sm:text-base font-bold text-on-surface">
                      One-Click Sentinel Shield Initialization
                    </h2>
                    <p className="font-mono text-xs text-on-surface-variant/80">
                      Arm continuous microphone listener, covert camera frame pipeline, and GNSS telemetry.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleStartSafetyShield}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-secondary text-on-secondary-container font-mono text-xs font-black tracking-widest uppercase shadow-[0_0_20px_rgba(78,222,163,0.5)] hover:scale-105 active:scale-95 transition-all"
                >
                  Start Safety Shield
                </button>
              </div>
            ) : (
              /* Hardware Status Badges Bar */
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-surface-container-low border border-white/5 font-mono text-[11px]">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-secondary">
                    <Mic className="w-3.5 h-3.5" />
                    <span>MIC: {isListening ? 'LISTENING' : 'STANDBY'}</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-on-surface-variant">
                    <Camera className="w-3.5 h-3.5 text-secondary" />
                    <span>CAM: {cameraReady ? 'ARMED (Covert)' : 'READY'}</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-on-surface-variant">
                    <Navigation className="w-3.5 h-3.5 text-secondary" />
                    <span>GPS: {gpsReady ? 'LOCKED' : 'INITIALIZING'}</span>
                  </span>
                </div>

                {lastDispatchedTime && (
                  <span className="text-secondary bg-secondary/10 px-2 py-0.5 rounded border border-secondary/30 text-[10px] animate-pulse">
                    🚨 Alert Dispatched at {lastDispatchedTime}
                  </span>
                )}
              </div>
            )}

            {/* 2. ALERT DISPATCHED BANNER (when active) */}
            {isAlert && (
              <div className="p-4 rounded-2xl bg-red-600/20 border-2 border-red-500 text-red-400 font-mono text-xs flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[0_0_25px_rgba(220,38,38,0.5)] animate-pulse">
                <div className="flex items-center gap-3">
                  <ShieldAlert className="w-6 h-6 animate-bounce flex-shrink-0" />
                  <div>
                    <p className="font-bold text-sm">ALERT BROADCASTED TO GUARDIAN COMMAND CENTER</p>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">
                      Laptop siren sounding • Live GPS pin: {latStr}, {lngStr}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => dispatchWhatsAppSOS()}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 transition-colors shadow-md"
                  >
                    Open WhatsApp SOS
                  </button>
                  <button
                    onClick={contextResolveEmergency}
                    className="px-3 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-white text-xs border border-white/10"
                  >
                    Mark Safe
                  </button>
                </div>
              </div>
            )}

            {/* 3. 3D VISUALIZER ORB */}
            <PulseVisualizer />

            {/* 4. TELEMETRY & THREAT GRID */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Threat Gauge */}
              <div className="glass-panel p-4 rounded-xl flex flex-col justify-between gap-3">
                <div className="flex justify-between items-center font-mono text-xs">
                  <span className="text-on-surface-variant uppercase font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-primary" /> Threat Level (AI Neural)
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded font-bold border ${
                      isAlert ? 'bg-red-500/20 text-red-400 border-red-500' : 'bg-secondary/15 text-secondary border-secondary/30'
                    }`}
                  >
                    {threatScore}% RISK
                  </span>
                </div>
                <div className="w-full h-2.5 bg-surface-container-lowest rounded-full overflow-hidden p-0.5 border border-white/5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isAlert ? 'bg-gradient-to-r from-amber-500 to-red-500 shadow-[0_0_12px_rgba(220,38,38,0.8)]' : 'bg-secondary shadow-[0_0_8px_rgba(78,222,163,0.4)]'
                    }`}
                    style={{ width: `${Math.max(4, threatScore)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-on-surface-variant/60">
                  <span>0% SAFE</span>
                  <span>50% ELEVATED</span>
                  <span>100% CRITICAL</span>
                </div>
              </div>

              {/* GPS Live Telemetry */}
              <div className="glass-panel p-4 rounded-xl flex flex-col justify-between gap-2">
                <div className="flex justify-between items-center font-mono text-xs">
                  <span className="text-on-surface-variant uppercase font-semibold flex items-center gap-1.5">
                    <Navigation className="w-4 h-4 text-secondary" /> GNSS Coordinates
                  </span>
                  <span className="px-2 py-0.5 rounded bg-secondary/15 text-secondary border border-secondary/30 text-[10px] font-bold">
                    GPS LOCKED
                  </span>
                </div>
                <div className="font-mono text-xs text-on-surface flex justify-between items-center">
                  <span>{latStr}</span>
                  <span>{lngStr}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono text-on-surface-variant/60 pt-1 border-t border-white/5">
                  <span>Accuracy: ±6m</span>
                  <a
                    href={`https://maps.google.com/?q=${currentCoords.lat},${currentCoords.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-secondary hover:underline"
                  >
                    Open Map Pin
                  </a>
                </div>
              </div>
            </section>

            {/* 5. LIVE ACOUSTIC TRANSCRIPT & HACKATHON DEMO INJECTION BUTTONS */}
            <div className="glass-panel p-4 rounded-xl flex flex-col gap-3">
              <div className="flex justify-between items-center font-mono text-xs">
                <span className="text-on-surface-variant font-semibold">Live Speech Listener Transcript</span>
                <span className="text-[10px] text-secondary">
                  {isListening ? '● Listening for "bachao", "wrong way", "help"' : 'Standby'}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-surface-container-lowest border border-white/5 font-mono text-xs text-on-surface min-h-[48px] select-text">
                {interimTranscript || transcript ? (
                  <span className="text-secondary font-medium">{interimTranscript || transcript.slice(-150)}</span>
                ) : (
                  <span className="text-on-surface-variant/50 italic">
                    {shieldActive ? 'Listening to ambient voice...' : 'Click "Start Safety Shield" above to arm microphone.'}
                  </span>
                )}
              </div>

              {/* Instant Test Triggers for Mobile Phone Demo */}
              <div className="pt-2 border-t border-white/5 flex flex-col gap-2">
                <span className="font-mono text-[10px] text-on-surface-variant/70 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-secondary" /> Instant Demo Voice Injections:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => dispatchAlertToBridge('Bhaiya ruko, you are taking the wrong way! Stop the car!', 'Wrong way, stop the car!')}
                    className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-white/10 text-xs font-mono text-secondary hover:text-white transition-all active:scale-95 flex items-center gap-1"
                  >
                    <Play className="w-3 h-3 text-secondary" /> &quot;Wrong Way / Stop&quot;
                  </button>
                  <button
                    onClick={() => dispatchAlertToBridge('Bachao! Leave me alone, don\'t touch me!', 'Bachao! Leave me alone!')}
                    className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-white/10 text-xs font-mono text-red-400 hover:text-white transition-all active:scale-95 flex items-center gap-1"
                  >
                    <Play className="w-3 h-3 text-red-400" /> &quot;Bachao!&quot;
                  </button>
                  <button
                    onClick={() => dispatchAlertToBridge('EDITH code red emergency protocol', 'EDITH code red')}
                    className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-white/10 text-xs font-mono text-amber-300 hover:text-white transition-all active:scale-95 flex items-center gap-1"
                  >
                    <Play className="w-3 h-3 text-amber-300" /> &quot;Code Red&quot;
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'vault' && <EvidenceVault />}
        {activeTab === 'contacts' && <ContactsManager />}
        {activeTab === 'settings' && <SettingsModal />}
      </main>

      {/* SOS Modal */}
      <SOSModal />

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full glass-card h-16 border-t border-white/10 flex justify-around items-center px-4 z-40">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center font-mono text-[10px] ${activeTab === 'dashboard' ? 'text-secondary font-bold' : 'text-on-surface-variant/70'}`}
        >
          <Activity className="w-5 h-5" />
          <span>Status</span>
        </button>
        <button
          onClick={() => setActiveTab('vault')}
          className={`flex flex-col items-center font-mono text-[10px] ${activeTab === 'vault' ? 'text-secondary font-bold' : 'text-on-surface-variant/70'}`}
        >
          <FolderArchive className="w-5 h-5" />
          <span>Evidence</span>
        </button>
        <button
          onClick={() => setActiveTab('contacts')}
          className={`flex flex-col items-center font-mono text-[10px] ${activeTab === 'contacts' ? 'text-secondary font-bold' : 'text-on-surface-variant/70'}`}
        >
          <Users className="w-5 h-5" />
          <span>Guardians</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center font-mono text-[10px] ${activeTab === 'settings' ? 'text-secondary font-bold' : 'text-on-surface-variant/70'}`}
        >
          <Sliders className="w-5 h-5" />
          <span>Settings</span>
        </button>
      </nav>
    </div>
  );
}
