import io, { Socket } from 'socket.io-client';
import type { RealtimeEventMap, RealtimeMessage, RealtimeReason } from './types';

export type { RealtimeEventMap, RealtimeMessage, RealtimeReason };
export type { UnitHkStatusChangePayload, SalesBatchPayload, AvailabilityBatchPayload } from './types';

const REALTIME_URL = 'https://realtime.igloorooms.com/';

export type MessageHandler = (msg: RealtimeMessage) => void | Promise<void>;

interface Subscriber {
  propertyId: string;
  handler: MessageHandler;
}

class RealtimeService {
  private static _instance: RealtimeService;
  private socket: Socket | null = null;
  private subscribers = new Map<symbol, Subscriber>();

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
    this.subscribers.set(key, { propertyId: String(propertyId), handler });
    if (!this.socket) {
      this.connect();
    }
    return () => {
      this.subscribers.delete(key);
      if (this.subscribers.size === 0) {
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
      const keyStr = KEY?.toString() ?? '';
      for (const sub of this.subscribers.values()) {
        if (keyStr === sub.propertyId.toString()) {
          console.log(message, keyStr, sub.propertyId);
          sub.handler(message);
        }
      }
    });
  }

  private disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }
}

export const realtimeService = RealtimeService.getInstance();
