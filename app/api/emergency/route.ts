import { NextRequest, NextResponse } from 'next/server';

export interface EmergencyAlert {
  id: string;
  threat: boolean;
  riskScore: number;
  reason: string;
  photoBase64?: string;
  coordinates: {
    lat: number;
    lng: number;
    mapsUrl?: string;
  };
  transcript?: string;
  timestamp: string;
  clientInfo?: {
    device?: string;
    userAgent?: string;
  };
}

// Global in-memory singleton attached to globalThis to persist reliably in Next.js
declare global {
  // eslint-disable-next-line no-var
  var __GLOBAL_EMERGENCY_STORE__: {
    latestAlert: EmergencyAlert | null;
    alertHistory: EmergencyAlert[];
    lastUpdated: number;
  } | undefined;
}

if (!globalThis.__GLOBAL_EMERGENCY_STORE__) {
  globalThis.__GLOBAL_EMERGENCY_STORE__ = {
    latestAlert: null,
    alertHistory: [],
    lastUpdated: Date.now(),
  };
}

const store = globalThis.__GLOBAL_EMERGENCY_STORE__;

// POST /api/emergency — Phone dispatches live alert payload
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const newAlert: EmergencyAlert = {
      id: `alert-${Date.now()}`,
      threat: typeof body.threat === 'boolean' ? body.threat : true,
      riskScore: typeof body.riskScore === 'number' ? body.riskScore : 95,
      reason: String(body.reason || 'Distress trigger detected from mobile node.'),
      photoBase64: body.photoBase64 || undefined,
      coordinates: {
        lat: body.coordinates?.lat || 34.0522,
        lng: body.coordinates?.lng || -118.2437,
        mapsUrl: body.coordinates?.mapsUrl || `https://maps.google.com/?q=${body.coordinates?.lat || 34.0522},${body.coordinates?.lng || -118.2437}`,
      },
      transcript: body.transcript || '',
      timestamp: body.timestamp || new Date().toLocaleTimeString(),
      clientInfo: body.clientInfo || {
        device: 'Mobile Sentinel Phone',
      },
    };

    store.latestAlert = newAlert;
    store.alertHistory = [newAlert, ...store.alertHistory.slice(0, 19)];
    store.lastUpdated = Date.now();

    return NextResponse.json({
      success: true,
      alertId: newAlert.id,
      storedAt: store.lastUpdated,
    });
  } catch (error) {
    console.error('Error in POST /api/emergency:', error);
    return NextResponse.json({ error: 'Failed to process emergency payload' }, { status: 500 });
  }
}

// GET /api/emergency — Laptop Command Center polls every 1000ms
export async function GET() {
  return NextResponse.json(
    {
      hasAlert: Boolean(store.latestAlert && store.latestAlert.threat),
      latestAlert: store.latestAlert,
      historyCount: store.alertHistory.length,
      serverTime: new Date().toISOString(),
      lastUpdated: store.lastUpdated,
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    }
  );
}

// DELETE /api/emergency — Command Center / User silences alarm and marks safe
export async function DELETE() {
  store.latestAlert = null;
  store.lastUpdated = Date.now();
  return NextResponse.json({
    success: true,
    message: 'Emergency state cleared. Threat restored to SAFE.',
    lastUpdated: store.lastUpdated,
  });
}
