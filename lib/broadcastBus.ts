export interface BroadcastPayload {
  id: string;
  timestamp: string;
  type: 'EMERGENCY_ALERT' | 'HEARTBEAT' | 'STATUS_UPDATE';
  threatLevel: 'SAFE' | 'ELEVATED' | 'CRITICAL';
  threatScore: number;
  intent: string;
  reasoning: string;
  suggestedAction?: string;
  transcript: string;
  coordinates: {
    lat: number;
    lng: number;
    accuracy?: number;
    mapsUrl: string;
  };
  snapshotBase64?: string;
  audioBlobUrl?: string;
  nodeInfo?: {
    device: string;
    batteryLevel?: string;
  };
}

// In-memory shared state for hackathon real-time dual-device demo
let latestPayload: BroadcastPayload | null = null;
const subscribers = new Set<(payload: BroadcastPayload) => void>();

export function subscribeToEvents(callback: (payload: BroadcastPayload) => void) {
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
}

export function broadcastEvent(payload: BroadcastPayload) {
  latestPayload = payload;
  subscribers.forEach((cb) => {
    try {
      cb(payload);
    } catch {
      subscribers.delete(cb);
    }
  });
}

export function getLatestPayload(): BroadcastPayload | null {
  return latestPayload;
}

export function getSubscribersCount(): number {
  return subscribers.size;
}
