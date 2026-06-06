export class HarmonyBus {
  constructor() {
    this.listeners = new Map();
    this.events = [];
  }

  on(event, callback) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event).add(callback);
    return () => this.listeners.get(event)?.delete(callback);
  }

  emit(event, payload = {}) {
    this.events.unshift({ event, payload, at: new Date().toISOString() });
    this.events = this.events.slice(0, 120);
    const callbacks = this.listeners.get(event);
    if (!callbacks) return;
    for (const callback of callbacks) {
      try { callback(payload); } catch (error) { console.warn('[HarmonyBus]', error); }
    }
  }
}

export const Bus = new HarmonyBus();
