// Offline-tolerant POS (Tier 3, docs/business/06-restaurant-vertical.md) —
// when a sale's fetch to /api/ecommerce/pos fails because the network is
// actually down (not a validation error the server sent back), the sale
// is queued here instead of lost. Plain localStorage, not IndexedDB: POS
// queue entries are small, few (a busy shift losing connectivity for a
// while might queue a handful of sales, not thousands), and localStorage's
// synchronous API is simpler to reason about for something this size —
// revisit only if queue volume ever makes that a real problem.

const QUEUE_KEY = "pc_pos_offline_queue";

export interface QueuedSale {
  id: string; // local-only id, not an order id — the server assigns that on sync
  queued_at: string;
  payload: Record<string, unknown>;
}

function readQueue(): QueuedSale[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return []; // corrupted/blocked storage reads as empty, never throws into the caller
  }
}

function writeQueue(queue: QueuedSale[]) {
  try { localStorage.setItem(QUEUE_KEY, JSON.stringify(queue)); } catch { /* storage full/blocked — sale still rang up locally in UI state, just won't survive a reload */ }
}

export function enqueueSale(payload: Record<string, unknown>): QueuedSale {
  const entry: QueuedSale = { id: crypto.randomUUID(), queued_at: new Date().toISOString(), payload };
  const queue = readQueue();
  queue.push(entry);
  writeQueue(queue);
  return entry;
}

export function getQueue(): QueuedSale[] {
  return readQueue();
}

export function removeFromQueue(id: string) {
  writeQueue(readQueue().filter(q => q.id !== id));
}

/** Attempts to sync every queued sale to the server, in order (oldest
 *  first — a restocked/discontinued item mid-outage is more likely to
 *  matter for the earliest sale). Stops at the first genuine network
 *  failure (assumes still offline, no point hammering the rest) but keeps
 *  going past a sale the server actually rejects (bad data shouldn't block
 *  every later sale behind it — that one stays queued for a person to look
 *  at, not silently dropped). */
export async function syncQueue(): Promise<{ synced: number; failed: number; stillOffline: boolean }> {
  const queue = readQueue();
  let synced = 0;
  let failed = 0;

  for (const entry of queue) {
    let res: Response;
    try {
      res = await fetch("/api/ecommerce/pos", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry.payload),
      });
    } catch {
      return { synced, failed, stillOffline: true };
    }
    if (res.ok) {
      removeFromQueue(entry.id);
      synced++;
    } else {
      failed++;
    }
  }
  return { synced, failed, stillOffline: false };
}
