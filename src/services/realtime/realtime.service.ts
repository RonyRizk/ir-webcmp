import io, { Socket } from 'socket.io-client';
import type { RealtimeEventMap, RealtimeMessage, RealtimeReason } from './types';

export type { RealtimeEventMap, RealtimeMessage, RealtimeReason };
export type { UnitHkStatusChangePayload, SalesBatchPayload, AvailabilityBatchPayload, DayUseModifiedPayload, DayUseRemovedPayload } from './types';

const REALTIME_URL = 'https://realtime.igloorooms.com/';

export type MessageHandler = (msg: RealtimeMessage) => void | Promise<void>;

class RealtimeService {
  private static _instance: RealtimeService;
  private socket: Socket | null = null;
  /** Handlers bucketed by propertyId, so dispatching a message never walks subscribers it can't match. */
  private subscribers = new Map<string, Map<symbol, MessageHandler>>();
  private subscriberCount = 0;

  private constructor() {}

  static getInstance(): RealtimeService {
    if (!RealtimeService._instance) {
      RealtimeService._instance = new RealtimeService();
    }
    return RealtimeService._instance;
  }

  /**
   * Subscribe to real-time messages for a given propertyId.
   *
   * The handler receives a typed {@link RealtimeMessage} discriminated union.
   * Narrowing `msg.reason` in a switch/if also narrows `msg.payload` to the
   * correct type for that reason.
   *
   * @returns An unsubscribe function — call it in `disconnectedCallback`.
   */
  subscribe(propertyId: number | string, handler: MessageHandler): () => void {
    const key = Symbol();
    const id = String(propertyId);
    const handlers = this.subscribers.get(id) ?? new Map<symbol, MessageHandler>();
    handlers.set(key, handler);
    this.subscribers.set(id, handlers);
    this.subscriberCount++;
    if (!this.socket) {
      this.connect();
    }
    return () => {
      if (!handlers.delete(key)) {
        return;
      }
      this.subscriberCount--;
      if (handlers.size === 0) {
        this.subscribers.delete(id);
      }
      if (this.subscriberCount === 0) {
        this.disconnect();
      }
    };
  }

  private connect(): void {
    this.socket = io(REALTIME_URL);
    this.socket.on('MSG', (raw: string) => {
      let envelope: { REASON: string; KEY: unknown; PAYLOAD: unknown };
      try {
        envelope = JSON.parse(raw);
      } catch {
        return;
      }
      if (!envelope) return;

      const { REASON, KEY, PAYLOAD } = envelope;

      // Messages for other properties are the common case on a busy socket — drop them before
      // paying for the payload parse.
      const propertyId = KEY?.toString() ?? '';
      const handlers = this.subscribers.get(propertyId);
      if (!handlers?.size) {
        return;
      }

      let payload: unknown;
      try {
        payload = typeof PAYLOAD === 'string' ? JSON.parse(PAYLOAD) : PAYLOAD;
      } catch {
        // PAYLOAD is not valid JSON (e.g. DELETE_CALENDAR_POOL, GET_UNASSIGNED_DATES)
        payload = PAYLOAD;
      }

      // Cast to the discriminated union. The REASON key governs which payload type
      // is expected; unknown reasons fall through harmlessly in handler switch/if blocks.
      const message = { reason: REASON as RealtimeReason, payload } as RealtimeMessage;
      // Once per delivered message — after the property filter, so the log is this property's
      // traffic only, and not repeated per subscriber.
      console.log('[realtime]', REASON, { propertyId, payload, subscribers: handlers.size });
      for (const handler of handlers.values()) {
        handler(message);
      }
    });
  }

  private disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }
}

export const realtimeService = RealtimeService.getInstance();
