type Listener = () => void;

const listeners = new Set<Listener>();

/**
 * Subscribe to logical "DB touched" notifications (client-side).
 * Used to refresh Dashboard (generation bump + invalidate) without wiring every flow by hand.
 */
export function subscribeDataWrites(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Fire after any successful mutation that should invalidate dashboard summary on next view. */
export function notifyDataWrite(): void {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.error("[data-write-bus] listener error", e);
    }
  });
}
