export type ThreatLevel = 'SAFE' | 'ELEVATED' | 'CRITICAL';

export interface ThreatAnalysisResult {
  threatScore: number; // 0 - 100
  threatLevel: ThreatLevel;
  dangerKeywords: string[];
  coercionDetected: boolean;
  sentiment: string;
  summary: string;
  recommendedAction: string;
  timestamp: string;
}

export interface SilentSnapshot {
  id: string;
  imageUrl: string;
  timestamp: string;
  relativeTime: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  triggerReason?: string;
}

export interface AudioEvidenceClip {
  id: string;
  audioBlobUrl: string;
  durationSeconds: number;
  timestamp: string;
  transcriptSnippet?: string;
  threatScore?: number;
}

export interface SystemLogEntry {
  id: string;
  timestamp: string;
  source: 'SYS' | 'AI' | 'GPS' | 'AUDIO' | 'CAM' | 'SOS';
  message: string;
  type: 'normal' | 'warning' | 'critical' | 'success';
}

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  isPrimary: boolean;
  autoDispatch: boolean;
}

export interface EmergencyPackage {
  incidentId: string;
  timestamp: string;
  location: {
    lat: number;
    lng: number;
    accuracy?: number;
    addressString?: string;
  };
  threatLevel: ThreatLevel;
  threatScore: number;
  reason: string;
  recentTranscript: string;
  snapshots: SilentSnapshot[];
  audioClips: AudioEvidenceClip[];
}
