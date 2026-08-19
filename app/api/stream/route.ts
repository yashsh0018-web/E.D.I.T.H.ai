import { NextRequest } from 'next/server';
import { subscribeToEvents, BroadcastPayload } from '@/lib/broadcastBus';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection handshake
      const initialHandshake = `event: connected\ndata: ${JSON.stringify({
        status: 'CONNECTED',
        timestamp: new Date().toISOString(),
        message: 'Guardian Command Center stream initialized.',
      })}\n\n`;
      controller.enqueue(encoder.encode(initialHandshake));

      // Subscribe to real-time broadcasts
      const unsubscribe = subscribeToEvents((payload: BroadcastPayload) => {
        try {
          const sseData = `event: emergency_event\ndata: ${JSON.stringify(payload)}\n\n`;
          controller.enqueue(encoder.encode(sseData));
        } catch (err) {
          console.warn('SSE enqueue error:', err);
        }
      });

      // Keep connection alive with periodic heartbeat comment every 15s
      const heartbeatTimer = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch {
          clearInterval(heartbeatTimer);
        }
      }, 15000);

      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeatTimer);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // Closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
