import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export interface EmergencyAlert {
  id: string;
  threat: boolean;
  riskScore: number;
  reason: string;
  photoBase64?: string;
  coordinates: {
    lat: number;
    lng: number;
    accuracy?: number;
    mapsUrl?: string;
  };
  transcript?: string;
  timestamp: string;
  clientInfo?: {
    device?: string;
    userAgent?: string;
  };
}

// Global in-memory singleton attached to globalThis to persist across warm serverless requests
declare global {
  // eslint-disable-next-line no-var
  var __EDITH_ALERT_STORE__: {
    latestAlert: EmergencyAlert | null;
    alertHistory: EmergencyAlert[];
    lastUpdated: number;
  } | undefined;
}

if (!globalThis.__EDITH_ALERT_STORE__) {
  globalThis.__EDITH_ALERT_STORE__ = {
    latestAlert: null,
    alertHistory: [],
    lastUpdated: Date.now(),
  };
}

const store = globalThis.__EDITH_ALERT_STORE__;

// POST /api/emergency — Mobile Phone dispatches live alert payload
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const newAlert: EmergencyAlert = {
      id: body.id || `alert-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      threat: typeof body.threat === 'boolean' ? body.threat : true,
      riskScore: typeof body.riskScore === 'number' ? body.riskScore : 95,
      reason: String(body.reason || 'Distress trigger detected from mobile node.'),
      photoBase64: body.photoBase64 || undefined,
      coordinates: {
        lat: typeof body.coordinates?.lat === 'number' ? body.coordinates.lat : 34.0522,
        lng: typeof body.coordinates?.lng === 'number' ? body.coordinates.lng : -118.2437,
        accuracy: body.coordinates?.accuracy || 6,
        mapsUrl:
          body.coordinates?.mapsUrl ||
          `https://maps.google.com/?q=${body.coordinates?.lat || 34.0522},${body.coordinates?.lng || -118.2437}`,
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

    return NextResponse.json(
      {
        success: true,
        alertId: newAlert.id,
        storedAt: store.lastUpdated,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
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
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0',
        Pragma: 'no-cache',
        Expires: '0',
      },
    }
  );
}

// DELETE /api/emergency — Clear alert state and silence alarm
export async function DELETE() {
  store.latestAlert = null;
  store.lastUpdated = Date.now();
  return NextResponse.json(
    {
      success: true,
      message: 'Emergency state cleared. Threat restored to SAFE.',
      lastUpdated: store.lastUpdated,
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        Pragma: 'no-cache',
        Expires: '0',
      },
    }
  );
}
