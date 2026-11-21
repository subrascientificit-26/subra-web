export type RealtimeTopic =
  | "products"
  | "external-products"
  | "categories"
  | "subcategories"
  | "enquiries"
  | "users"
  | "sidebar"
  | "settings"
  | "custom-requirements"
  | "dashboard";

export interface RealtimeEventPayload {
  id: number;
  topics: RealtimeTopic[];
  action?: string;
  timestamp: number;
}

type RealtimeListener = (event: RealtimeEventPayload) => void;

interface RealtimeBus {
  listeners: Set<RealtimeListener>;
  seq: number;
  history: RealtimeEventPayload[];
}

const MAX_HISTORY = 50;

const globalForRealtime = globalThis as unknown as {
  __subraRealtimeBus?: RealtimeBus;
};

function getRealtimeBus(): RealtimeBus {
  if (!globalForRealtime.__subraRealtimeBus) {
    globalForRealtime.__subraRealtimeBus = {
      listeners: new Set<RealtimeListener>(),
      seq: 0,
      history: [],
    };
  }
  if (!Array.isArray(globalForRealtime.__subraRealtimeBus.history)) {
    globalForRealtime.__subraRealtimeBus.history = [];
  }
  return globalForRealtime.__subraRealtimeBus;
}

export function getCurrentRealtimeSeq(): number {
  return getRealtimeBus().seq;
}

export function getRealtimeEventsSince(sinceSeq: number): RealtimeEventPayload[] {
  const bus = getRealtimeBus();
  if (!Number.isFinite(sinceSeq) || sinceSeq >= bus.seq) {
    return [];
  }
  return bus.history.filter((event) => event.id > sinceSeq);
}

export function subscribeRealtime(listener: RealtimeListener): () => void {
  const bus = getRealtimeBus();
  bus.listeners.add(listener);
  return () => {
    bus.listeners.delete(listener);
  };
}

export function emitRealtimeUpdate(
  topics: RealtimeTopic | RealtimeTopic[],
  action?: string
): void {
  const bus = getRealtimeBus();
  const normalizedTopics = Array.from(
    new Set(Array.isArray(topics) ? topics : [topics])
  );
  if (normalizedTopics.length === 0) return;

  bus.seq += 1;
  const payload: RealtimeEventPayload = {
    id: bus.seq,
    topics: normalizedTopics,
    action,
    timestamp: Date.now(),
  };

  bus.history.push(payload);
  if (bus.history.length > MAX_HISTORY) {
    bus.history.splice(0, bus.history.length - MAX_HISTORY);
  }

  for (const listener of bus.listeners) {
    try {
      listener(payload);
    } catch {
      // Never let a disconnected listener break other subscribers
    }
  }
}
