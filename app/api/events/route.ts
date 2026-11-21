import {
  getCurrentRealtimeSeq,
  getRealtimeEventsSince,
  subscribeRealtime,
  type RealtimeEventPayload,
  type RealtimeTopic,
} from "@/lib/realtime";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const encoder = new TextEncoder();
  const { searchParams } = new URL(req.url);
  const sinceRaw = searchParams.get("since");
  const sinceSeq = sinceRaw !== null ? Number.parseInt(sinceRaw, 10) : Number.NaN;

  let cleanup: (() => void) | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;

      const sendChunk = (chunk: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          closed = true;
          cleanup?.();
        }
      };

      const onEvent = (payload: RealtimeEventPayload) => {
        sendChunk(
          `id: ${payload.id}\nevent: update\ndata: ${JSON.stringify(payload)}\n\n`
        );
      };

      const unsubscribe = subscribeRealtime(onEvent);

      const currentSeq = getCurrentRealtimeSeq();
      sendChunk(`event: ready\ndata: ${JSON.stringify({ seq: currentSeq })}\n\n`);

      if (Number.isInteger(sinceSeq) && sinceSeq >= 0 && sinceSeq < currentSeq) {
        const missed = getRealtimeEventsSince(sinceSeq);
        if (missed.length > 0) {
          const mergedTopics = Array.from(
            new Set<RealtimeTopic>(missed.flatMap((event) => event.topics))
          );
          const replayPayload: RealtimeEventPayload = {
            id: currentSeq,
            topics: mergedTopics,
            action: "replay",
            timestamp: Date.now(),
          };
          onEvent(replayPayload);
        }
      }

      const heartbeat = setInterval(() => {
        sendChunk(`: ping\n\n`);
      }, 30000);

      cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // Stream already closed
        }
      };

      req.signal.addEventListener("abort", () => {
        cleanup?.();
      });
    },
    cancel() {
      cleanup?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
