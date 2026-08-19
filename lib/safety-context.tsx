'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  ThreatLevel,
  ThreatAnalysisResult,
  SystemLogEntry,
  EmergencyContact,
  EmergencyPackage,
  SilentSnapshot,
  AudioEvidenceClip,
} from './types';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useSilentEvidence } from '@/hooks/useSilentEvidence';
import { useSpeechListener } from '@/hooks/useSpeechListener';
import { buildWhatsAppSOSLink, soundEffects, generateIncidentId } from './utils';

interface SafetyContextType {
  threatLevel: ThreatLevel;
  threatScore: number;
  lastAnalysis: ThreatAnalysisResult | null;
  coercionDetected: boolean;
  activeTab: 'dashboard' | 'vault' | 'contacts' | 'settings';
  setActiveTab: (tab: 'dashboard' | 'vault' | 'contacts' | 'settings') => void;
  camouflageMode: boolean;
  setCamouflageMode: (val: boolean) => void;
  camouflageApp: 'workspace' | 'fakecall';
  setCamouflageApp: (app: 'workspace' | 'fakecall') => void;
  isSOSModalOpen: boolean;
  setIsSOSModalOpen: (open: boolean) => void;
  incidentId: string;
  systemLogs: SystemLogEntry[];
  emergencyContacts: EmergencyContact[];
  setEmergencyContacts: React.Dispatch<React.SetStateAction<EmergencyContact[]>>;
  lastTriggerReason: string;

  // Actions
  triggerEmergency: (reason?: string, customIntent?: string) => void;
  resolveEmergency: () => void;
  toggleCamouflage: () => void;
  addLog: (source: SystemLogEntry['source'], message: string, type?: SystemLogEntry['type']) => void;
  dispatchWhatsAppSOS: (contactPhone?: string) => string;
  broadcastToCommandCenter: (snapshotUrl?: string, reason?: string, intent?: string, transcriptText?: string) => Promise<void>;

  // Hardware state
  geo: ReturnType<typeof useGeolocation>;
  evidence: ReturnType<typeof useSilentEvidence>;
  speech: ReturnType<typeof useSpeechListener>;
  triggerSilentCapture: (reason?: string) => Promise<SilentSnapshot | null>;
  simulateDistressPhrase: (phrase: string) => void;
  getEmergencyPackage: () => EmergencyPackage;
}

const DEFAULT_CONTACTS: EmergencyContact[] = [
  {
    id: 'c-1',
    name: 'Inspector Sharma (Police HQ)',
    relationship: 'Emergency Response / Local Ward',
    phone: '+919876543210',
    isPrimary: true,
    autoDispatch: true,
  },
  {
    id: 'c-2',
    name: 'Aanya (Sister)',
    relationship: 'Trusted Guardian',
    phone: '+919811122233',
    isPrimary: false,
    autoDispatch: true,
  },
  {
    id: 'c-3',
    name: 'David Vance',
    relationship: 'Campus Security',
    phone: '+14155550199',
    isPrimary: false,
    autoDispatch: false,
  },
];

const INITIAL_LOGS: SystemLogEntry[] = [
  {
    id: 'log-1',
    timestamp: new Date(Date.now() - 40000).toLocaleTimeString(),
    source: 'SYS',
    message: 'E.D.I.T.H. Sentinel Protocol initialized. Dual-layer acoustic pipeline online.',
    type: 'success',
  },
  {
    id: 'log-2',
    timestamp: new Date(Date.now() - 30000).toLocaleTimeString(),
    source: 'SYS',
    message: 'Encrypted continuous WebAudio ring buffer active (5-minute window).',
    type: 'normal',
  },
  {
    id: 'log-3',
    timestamp: new Date(Date.now() - 20000).toLocaleTimeString(),
    source: 'AI',
    message: 'Ambient voice listener armed for instant trigger words & Gemini 1.5 Flash sentiment.',
    type: 'normal',
  },
  {
    id: 'log-4',
    timestamp: new Date(Date.now() - 10000).toLocaleTimeString(),
    source: 'GPS',
    message: 'Tactical geolocation lock verified. Real-time dual-device broadcast ready.',
    type: 'normal',
  },
];

const SafetyContext = createContext<SafetyContextType | null>(null);

export function SafetyProvider({ children }: { children: React.ReactNode }) {
  const [threatLevel, setThreatLevel] = useState<ThreatLevel>('SAFE');
  const [threatScore, setThreatScore] = useState<number>(2);
  const [lastAnalysis, setLastAnalysis] = useState<ThreatAnalysisResult | null>(null);
  const [coercionDetected, setCoercionDetected] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'vault' | 'contacts' | 'settings'>('dashboard');
  const [camouflageMode, setCamouflageMode] = useState<boolean>(false);
  const [camouflageApp, setCamouflageApp] = useState<'workspace' | 'fakecall'>('workspace');
  const [isSOSModalOpen, setIsSOSModalOpen] = useState<boolean>(false);
  const [incidentId] = useState<string>(() => generateIncidentId());
  const [systemLogs, setSystemLogs] = useState<SystemLogEntry[]>(INITIAL_LOGS);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>(DEFAULT_CONTACTS);
  const [lastTriggerReason, setLastTriggerReason] = useState<string>('Routine passive monitoring');

  const geo = useGeolocation();
  const evidence = useSilentEvidence();

  const addLog = useCallback(
    (source: SystemLogEntry['source'], message: string, type: SystemLogEntry['type'] = 'normal') => {
      const newEntry: SystemLogEntry = {
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toLocaleTimeString(),
        source,
        message,
        type,
      };
      setSystemLogs((prev) => [newEntry, ...prev.slice(0, 40)]);
    },
    []
  );

  const triggerSilentCapture = useCallback(
    async (reason = 'Discreet Evidence Capture') => {
      addLog('CAM', `Executing silent canvas frame capture [${reason}]`, 'warning');
      const snap = await evidence.captureSilentSnapshot(reason, { lat: geo.lat, lng: geo.lng });
      return snap;
    },
    [addLog, evidence, geo.lat, geo.lng]
  );

  // Broadcast real-time event to Laptop Guardian Command Center
  const broadcastToCommandCenter = useCallback(
    async (snapshotUrl?: string, reason?: string, intent?: string, transcriptText?: string) => {
      try {
        const payload = {
          id: incidentId,
          timestamp: new Date().toLocaleTimeString(),
          type: 'EMERGENCY_ALERT',
          threatLevel: 'CRITICAL',
          threatScore: 95,
          intent: intent || 'Distress Call / Coercion',
          reasoning: reason || lastTriggerReason,
          suggestedAction: 'ESCALATE_SOS',
          transcript: transcriptText || '',
          coordinates: {
            lat: geo.lat,
            lng: geo.lng,
            accuracy: geo.accuracy || 6,
            mapsUrl: `https://maps.google.com/?q=${geo.lat},${geo.lng}`,
          },
          snapshotBase64: snapshotUrl || evidence.snapshots[0]?.imageUrl,
          nodeInfo: {
            device: typeof window !== 'undefined' ? (window.navigator.userAgent.includes('iPhone') ? 'iPhone • Mobile Node' : 'Android • Mobile Node') : 'Mobile Node',
          },
        };

        await fetch('/api/broadcast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        addLog('SOS', 'Real-time distress payload broadcasted to Laptop Command Center.', 'critical');
      } catch (err) {
        console.warn('Command center broadcast error:', err);
      }
    },
    [addLog, evidence.snapshots, geo.accuracy, geo.lat, geo.lng, incidentId, lastTriggerReason]
  );

  const triggerEmergency = useCallback(
    async (reason = 'MANUAL SOS / CRITICAL DISTRESS TRIGGER', customIntent?: string) => {
      setThreatLevel('CRITICAL');
      setThreatScore(95);
      setLastTriggerReason(reason);
      setIsSOSModalOpen(true);
      soundEffects.playSiren();

      addLog('SOS', `EMERGENCY SOS ARMED: ${reason}`, 'critical');
      addLog('AI', 'Escalated system state to CRITICAL (95%). Dispatching telemetry.', 'critical');

      // Silently capture camera frame & lock audio
      const snap = await triggerSilentCapture(reason);
      if (!evidence.isRecordingAudio) {
        evidence.startAudioRecordingLoop();
      }

      // Broadcast immediately to Laptop Command Center
      broadcastToCommandCenter(snap?.imageUrl, reason, customIntent);
    },
    [addLog, broadcastToCommandCenter, evidence, triggerSilentCapture]
  );

  const resolveEmergency = useCallback(() => {
    setThreatLevel('SAFE');
    setThreatScore(2);
    setCoercionDetected(false);
    setIsSOSModalOpen(false);
    setLastTriggerReason('All clear. De-escalated by operator.');
    soundEffects.playSafeArmed();
    addLog('SYS', 'Operator verified safety. Threat status restored to SAFE.', 'success');

    // Notify command center of de-escalation
    fetch('/api/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'STATUS_UPDATE',
        threatLevel: 'SAFE',
        threatScore: 5,
        intent: 'Benign Conversation',
        reasoning: 'De-escalated by user.',
        suggestedAction: 'MONITOR_PASSIVE',
      }),
    }).catch(() => {});
  }, [addLog]);

  const toggleCamouflage = useCallback(() => {
    setCamouflageMode((prev) => {
      const next = !prev;
      soundEffects.playBeep(next ? 400 : 900, 'sine', 0.06);
      addLog('SYS', next ? 'Camouflage Stealth Mode ENGAGED. Microphone surveillance remains active in background.' : 'Camouflage Stealth Mode DISENGAGED. Restored HUD.', 'normal');
      return next;
    });
  }, [addLog]);

  // Speech Listener handler callbacks
  const handleInstantLocalTrigger = useCallback(
    (keyword: string, currentTranscript: string) => {
      addLog('AUDIO', `Instant local trigger matched: "${keyword}"`, 'critical');
      triggerEmergency(
        `Voice distress keyword detected: "${keyword}" (Transcript: "${currentTranscript.slice(-60)}")`,
        keyword === 'wrong way' || keyword === 'stop the car' || keyword === 'bhaiya ruko'
          ? 'Route Deviation Panic'
          : 'Physical Threat / Coercion'
      );
    },
    [addLog, triggerEmergency]
  );

  const handleGeminiAnalysis = useCallback(
    (analysis: ThreatAnalysisResult) => {
      setLastAnalysis(analysis);
      setCoercionDetected(analysis.coercionDetected);

      if (analysis.threatLevel === 'CRITICAL' && threatLevel !== 'CRITICAL') {
        triggerEmergency(`Gemini Flash AI detected critical danger: ${analysis.summary}`, analysis.sentiment);
      } else if (analysis.threatLevel === 'ELEVATED' && threatLevel === 'SAFE') {
        setThreatLevel('ELEVATED');
        setThreatScore(Math.max(threatScore, analysis.threatScore));
        addLog('AI', `Gemini Flash elevated threat warning (${analysis.threatScore}%): ${analysis.summary}`, 'warning');
        triggerSilentCapture('Elevated Threat Pre-Snapshot');
      } else {
        addLog('AI', `Gemini Analysis: ${analysis.sentiment} (Score: ${analysis.threatScore}%)`, 'normal');
      }
    },
    [addLog, threatLevel, threatScore, triggerEmergency, triggerSilentCapture]
  );

  const speech = useSpeechListener({
    onInstantLocalTrigger: handleInstantLocalTrigger,
    onGeminiAnalysis: handleGeminiAnalysis,
    enabled: true,
  });

  const simulateDistressPhrase = useCallback(
    (phrase: string) => {
      addLog('AUDIO', `Injecting simulated voice sample: "${phrase}"`, 'warning');
      speech.simulateTriggerWord(phrase);
    },
    [addLog, speech]
  );

  const dispatchWhatsAppSOS = useCallback(
    (contactPhone?: string) => {
      const targetPhone = contactPhone || emergencyContacts.find((c) => c.isPrimary)?.phone || emergencyContacts[0]?.phone;
      const url = buildWhatsAppSOSLink({
        phone: targetPhone,
        incidentId,
        lat: geo.lat,
        lng: geo.lng,
        threatLevel,
        threatScore,
        reason: lastTriggerReason,
        transcript: speech.transcript || speech.interimTranscript,
      });

      addLog('SOS', `Dispatched WhatsApp SOS payload to ${targetPhone || 'Default Emergency Recipient'}`, 'critical');
      if (typeof window !== 'undefined') {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
      return url;
    },
    [addLog, emergencyContacts, geo.lat, geo.lng, incidentId, lastTriggerReason, speech.interimTranscript, speech.transcript, threatLevel, threatScore]
  );

  const getEmergencyPackage = useCallback((): EmergencyPackage => {
    return {
      incidentId,
      timestamp: new Date().toISOString(),
      location: {
        lat: geo.lat,
        lng: geo.lng,
        accuracy: geo.accuracy || undefined,
        addressString: `Sector Alpha Tactical Coordinate (${geo.lat.toFixed(4)}, ${geo.lng.toFixed(4)})`,
      },
      threatLevel,
      threatScore,
      reason: lastTriggerReason,
      recentTranscript: speech.transcript || 'No continuous transcript recorded.',
      snapshots: evidence.snapshots,
      audioClips: evidence.audioClips,
    };
  }, [evidence.audioClips, evidence.snapshots, geo.accuracy, geo.lat, geo.lng, incidentId, lastTriggerReason, speech.transcript, threatLevel, threatScore]);

  // Initial arming sound
  useEffect(() => {
    const timer = setTimeout(() => {
      soundEffects.playSafeArmed();
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <SafetyContext.Provider
      value={{
        threatLevel,
        threatScore,
        lastAnalysis,
        coercionDetected,
        activeTab,
        setActiveTab,
        camouflageMode,
        setCamouflageMode,
        camouflageApp,
        setCamouflageApp,
        isSOSModalOpen,
        setIsSOSModalOpen,
        incidentId,
        systemLogs,
        emergencyContacts,
        setEmergencyContacts,
        lastTriggerReason,
        triggerEmergency,
        resolveEmergency,
        toggleCamouflage,
        addLog,
        dispatchWhatsAppSOS,
        broadcastToCommandCenter,
        geo,
        evidence,
        speech,
        triggerSilentCapture,
        simulateDistressPhrase,
        getEmergencyPackage,
      }}
    >
      {children}
    </SafetyContext.Provider>
  );
}

export function useSafety() {
  const context = useContext(SafetyContext);
  if (!context) {
    throw new Error('useSafety must be used within a SafetyProvider');
  }
  return context;
}
