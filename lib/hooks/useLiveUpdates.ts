"use client";

import { useEffect, useRef } from "react";
import type { RealtimeEventPayload, RealtimeTopic } from "@/lib/realtime";

type SubscriberEntry = {
  topics: Set<RealtimeTopic>;
  callback: (event: RealtimeEventPayload) => void;
};

const subscribers = new Set<SubscriberEntry>();

let eventSource: EventSource | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempt = 0;
let lastSeenSeq: number | null = null;

function notifyMatchingSubscribers(event: RealtimeEventPayload) {
  if (!Array.isArray(event.topics) || event.topics.length === 0) return;

  for (const entry of subscribers) {
    if (event.topics.some((topic) => entry.topics.has(topic))) {
      try {
        entry.callback(event);
      } catch {
        // Ignore individual subscriber errors
      }
    }
  }
}

function connectEventSource() {
  if (typeof window === "undefined" || typeof EventSource === "undefined") {
    return;
  }
  if (eventSource || subscribers.size === 0) return;

  const url =
    lastSeenSeq !== null ? `/api/events?since=${lastSeenSeq}` : "/api/events";
  const source = new EventSource(url);
  eventSource = source;

  source.onopen = () => {
    reconnectAttempt = 0;
  };

  source.addEventListener("ready", (rawEvent) => {
    try {
      const message = rawEvent as MessageEvent<string>;
      const data = JSON.parse(message.data) as { seq?: number };
      if (typeof data.seq === "number" && Number.isFinite(data.seq)) {
        if (lastSeenSeq === null || data.seq > lastSeenSeq) {
          lastSeenSeq = data.seq;
        }
      }
    } catch {
      // Ignore malformed ready frame
    }
  });

  source.addEventListener("update", (rawEvent) => {
    try {
      const message = rawEvent as MessageEvent<string>;
      const payload = JSON.parse(message.data) as RealtimeEventPayload;
      if (typeof payload?.id === "number" && Number.isFinite(payload.id)) {
        if (lastSeenSeq !== null && payload.id <= lastSeenSeq) {
          return;
        }
        lastSeenSeq = payload.id;
      }
      notifyMatchingSubscribers(payload);
    } catch {
      // Ignore malformed update frame
    }
  });

  source.onerror = () => {
    source.close();
    if (eventSource === source) {
      eventSource = null;
    }

    if (subscribers.size === 0) return;

    if (!reconnectTimer) {
      const delay = Math.min(30000, 2000 * Math.max(1, 2 ** reconnectAttempt));
      reconnectAttempt += 1;
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        if (subscribers.size > 0) {
          connectEventSource();
        }
      }, delay);
    }
  };
}

function disconnectIfUnused() {
  if (subscribers.size > 0) return;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }
}

export function subscribeLiveUpdates(
  topics: RealtimeTopic | readonly RealtimeTopic[],
  callback: (event: RealtimeEventPayload) => void
): () => void {
  const topicList: readonly RealtimeTopic[] =
    typeof topics === "string" ? [topics] : topics;
  const entry: SubscriberEntry = {
    topics: new Set(topicList),
    callback,
  };

  subscribers.add(entry);
  connectEventSource();

  return () => {
    subscribers.delete(entry);
    disconnectIfUnused();
  };
}

export function useLiveUpdates(
  topics: RealtimeTopic | readonly RealtimeTopic[],
  onUpdate: () => void,
  options?: { enabled?: boolean; debounceMs?: number }
) {
  const enabled = options?.enabled ?? true;
  const debounceMs = options?.debounceMs ?? 150;
  const callbackRef = useRef(onUpdate);
  const topicsKey = typeof topics === "string" ? topics : topics.join(",");

  useEffect(() => {
    callbackRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    if (!enabled || !topicsKey) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    const topicList = topicsKey.split(",").filter(Boolean) as RealtimeTopic[];

    const unsubscribe = subscribeLiveUpdates(topicList, () => {
      if (debounceMs <= 0) {
        callbackRef.current();
        return;
      }
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        callbackRef.current();
      }, debounceMs);
    });

    return () => {
      if (timer) clearTimeout(timer);
      unsubscribe();
    };
  }, [enabled, topicsKey, debounceMs]);
}
