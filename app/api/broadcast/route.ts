import { NextRequest, NextResponse } from 'next/server';
import {
  broadcastEvent,
  getLatestPayload,
  getSubscribersCount,
  BroadcastPayload,
} from '@/lib/broadcastBus';

export async function POST(req: NextRequest) {
  try {
    const data: Partial<BroadcastPayload> = await req.json();

    const fullPayload: BroadcastPayload = {
      id: data.id || `inc-${Date.now()}`,
      timestamp: data.timestamp || new Date().toISOString(),
      type: data.type || 'EMERGENCY_ALERT',
      threatLevel: data.threatLevel || 'CRITICAL',
      threatScore: typeof data.threatScore === 'number' ? data.threatScore : 95,
      intent: data.intent || 'Critical Distress Call',
      reasoning: data.reasoning || 'Automated distress trigger from mobile client node.',
      suggestedAction: data.suggestedAction || 'ESCALATE_SOS',
      transcript: data.transcript || '',
      coordinates: data.coordinates || {
        lat: 34.0522,
        lng: -118.2437,
        mapsUrl: 'https://maps.google.com/?q=34.0522,-118.2437',
      },
      snapshotBase64: data.snapshotBase64,
      audioBlobUrl: data.audioBlobUrl,
      nodeInfo: data.nodeInfo || { device: 'Mobile Node' },
    };

    broadcastEvent(fullPayload);

    return NextResponse.json({
      success: true,
      subscribersCount: getSubscribersCount(),
      broadcastedId: fullPayload.id,
    });
  } catch (error) {
    console.error('Error broadcasting emergency payload:', error);
    return NextResponse.json({ error: 'Failed to broadcast event' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    latest: getLatestPayload(),
    activeSubscribers: getSubscribersCount(),
    timestamp: new Date().toISOString(),
  });
}
