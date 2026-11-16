export {};

type MsgListener = (raw: string) => void;

interface FakeSocket {
  url: string;
  listeners: Map<string, MsgListener>;
  disconnect: jest.Mock;
}

/** Every socket the service opened in the current test, oldest first. */
let mockSockets: FakeSocket[] = [];

jest.mock('socket.io-client', () => ({
  __esModule: true,
  default: (url: string) => {
    const socket: FakeSocket = { url, listeners: new Map(), disconnect: jest.fn() };
    mockSockets.push(socket);
    return {
      on: (event: string, listener: MsgListener) => socket.listeners.set(event, listener),
      disconnect: socket.disconnect,
    };
  },
}));

type Env = Window & { environment?: string };
type Service = typeof import('./realtime.service').realtimeService;

let service: Service;
let cleanups: Array<() => void> = [];

function currentSocket(): FakeSocket {
  const socket = mockSockets[mockSockets.length - 1];
  if (!socket) throw new Error('no socket was opened');
  return socket;
}

/** Pushes a raw wire string through the open socket's 'MSG' channel. */
function emitRaw(raw: string) {
  currentSocket().listeners.get('MSG')!(raw);
}

/** Pushes one socket message framed the way the realtime server sends it (PAYLOAD as a JSON string). */
function emit(key: unknown, reason: string, payload: unknown) {
  emitRaw(JSON.stringify({ REASON: reason, KEY: key, PAYLOAD: JSON.stringify(payload) }));
}

/** Subscribes a recording handler; returns what it received and its unsubscribe function. */
function subscribe(propertyId: number | string) {
  const received: Array<{ reason: string; payload: unknown }> = [];
  const unsubscribe = service.subscribe(propertyId, msg => {
    received.push({ reason: msg.reason, payload: msg.payload });
  });
  cleanups.push(unsubscribe);
  return { received, unsubscribe };
}

/** Payloads only, for tests that don't care about the reason. */
const payloads = (received: Array<{ payload: unknown }>) => received.map(m => m.payload);

beforeEach(() => {
  jest.resetModules();
  mockSockets = [];
  delete (window as Env).environment;
  jest.spyOn(console, 'log').mockImplementation(() => {});
  service = (require('./realtime.service') as typeof import('./realtime.service')).realtimeService;
});

afterEach(() => {
  cleanups.forEach(fn => fn());
  cleanups = [];
  delete (window as Env).environment;
  jest.restoreAllMocks();
});

describe('connection lifecycle', () => {
  it('does not open a socket until the first subscriber arrives', () => {
    expect(mockSockets).toHaveLength(0);

    subscribe(42);

    expect(mockSockets).toHaveLength(1);
    expect(mockSockets[0].url).toBe('https://realtime.igloorooms.com/');
  });

  it('shares one socket across all subscribers, whatever their property', () => {
    subscribe(42);
    subscribe(42);
    subscribe(7);

    expect(mockSockets).toHaveLength(1);
  });

  it('keeps the socket open while any subscriber remains', () => {
    const first = subscribe(42);
    subscribe(7);

    first.unsubscribe();

    expect(currentSocket().disconnect).not.toHaveBeenCalled();
  });

  it('disconnects when the last subscriber leaves', () => {
    const a = subscribe(42);
    const b = subscribe(7);

    a.unsubscribe();
    b.unsubscribe();

    expect(currentSocket().disconnect).toHaveBeenCalledTimes(1);
  });

  it('opens a fresh socket for a subscriber that arrives after a disconnect', () => {
    subscribe(42).unsubscribe();

    const { received } = subscribe(42);
    emit(42, 'DORESERVATION', { booking_nbr: 'B1' });

    expect(mockSockets).toHaveLength(2);
    expect(payloads(received)).toEqual([{ booking_nbr: 'B1' }]);
  });

  it('treats a repeated unsubscribe as a no-op, so it cannot disconnect other subscribers', () => {
    const first = subscribe(42);
    const { received } = subscribe(42);

    first.unsubscribe();
    first.unsubscribe();
    emit(42, 'DORESERVATION', { booking_nbr: 'B1' });

    expect(currentSocket().disconnect).not.toHaveBeenCalled();
    expect(payloads(received)).toEqual([{ booking_nbr: 'B1' }]);
  });
});

describe('message delivery', () => {
  it('delivers the reason and the JSON-parsed payload', () => {
    const { received } = subscribe(42);

    emit(42, 'UNIT_HK_STATUS_CHANGED', { PR_ID: 3, HKS_CODE: 'VC' });

    expect(received).toEqual([{ reason: 'UNIT_HK_STATUS_CHANGED', payload: { PR_ID: 3, HKS_CODE: 'VC' } }]);
  });

  it('parses array payloads', () => {
    const { received } = subscribe(42);

    emit(42, 'UPDATE_CALENDAR_AVAILABILITY', [{ room_type_id: 1, date: '2026-11-09', availability: 4 }]);

    expect(payloads(received)).toEqual([[{ room_type_id: 1, date: '2026-11-09', availability: 4 }]]);
  });

  it('passes a PAYLOAD that is already an object through untouched', () => {
    const { received } = subscribe(42);

    emitRaw(JSON.stringify({ REASON: 'DORESERVATION', KEY: 42, PAYLOAD: { booking_nbr: 'B1' } }));

    expect(payloads(received)).toEqual([{ booking_nbr: 'B1' }]);
  });

  it('delivers a PAYLOAD that is not valid JSON as the raw string', () => {
    const { received } = subscribe(42);

    emitRaw(JSON.stringify({ REASON: 'DELETE_CALENDAR_POOL', KEY: 42, PAYLOAD: 'POOL-123' }));

    expect(received).toEqual([{ reason: 'DELETE_CALENDAR_POOL', payload: 'POOL-123' }]);
  });

  it('ignores frames that are not valid JSON, and keeps delivering afterwards', () => {
    const { received } = subscribe(42);

    expect(() => emitRaw('not json')).not.toThrow();
    expect(() => emitRaw('null')).not.toThrow();
    emit(42, 'DORESERVATION', { booking_nbr: 'B1' });

    expect(payloads(received)).toEqual([{ booking_nbr: 'B1' }]);
  });

  it('delivers every message to every handler of that property, in order', () => {
    const a = subscribe(42);
    const b = subscribe(42);

    emit(42, 'DORESERVATION', { booking_nbr: 'B1' });
    emit(42, 'DORESERVATION', { booking_nbr: 'B2' });

    expect(payloads(a.received)).toEqual([{ booking_nbr: 'B1' }, { booking_nbr: 'B2' }]);
    expect(payloads(b.received)).toEqual([{ booking_nbr: 'B1' }, { booking_nbr: 'B2' }]);
  });

  it('stops delivering to a handler once it unsubscribes', () => {
    const leaving = subscribe(42);
    const staying = subscribe(42);

    leaving.unsubscribe();
    emit(42, 'DORESERVATION', { booking_nbr: 'B1' });

    expect(leaving.received).toEqual([]);
    expect(payloads(staying.received)).toEqual([{ booking_nbr: 'B1' }]);
  });
});

describe('property filtering', () => {
  it('delivers only messages whose KEY matches the subscribed property', () => {
    const mine = subscribe(42);
    const other = subscribe(7);

    emit(42, 'DORESERVATION', { booking_nbr: 'FOR-42' });
    emit(7, 'DORESERVATION', { booking_nbr: 'FOR-7' });
    emit(99, 'DORESERVATION', { booking_nbr: 'FOR-99' });

    expect(payloads(mine.received)).toEqual([{ booking_nbr: 'FOR-42' }]);
    expect(payloads(other.received)).toEqual([{ booking_nbr: 'FOR-7' }]);
  });

  it('matches numeric and string property ids interchangeably', () => {
    const numeric = subscribe(42);
    const stringy = subscribe('7');

    emit('42', 'DORESERVATION', { booking_nbr: 'B1' });
    emit(7, 'DORESERVATION', { booking_nbr: 'B2' });

    expect(payloads(numeric.received)).toEqual([{ booking_nbr: 'B1' }]);
    expect(payloads(stringy.received)).toEqual([{ booking_nbr: 'B2' }]);
  });

  it('drops messages that carry no KEY', () => {
    const { received } = subscribe(42);

    emitRaw(JSON.stringify({ REASON: 'DORESERVATION', PAYLOAD: '{"booking_nbr":"B1"}' }));
    emit(null, 'DORESERVATION', { booking_nbr: 'B2' });

    expect(received).toEqual([]);
  });

  it('drops messages for a property whose subscribers have all left', () => {
    const leaving = subscribe(42);
    subscribe(7);

    leaving.unsubscribe();
    emit(42, 'DORESERVATION', { booking_nbr: 'B1' });

    expect(leaving.received).toEqual([]);
  });
});

describe('environment filtering', () => {
  /** Pushes a frame whose `environment` tag sits beside PAYLOAD, the way the realtime server tags it. */
  function emitTagged(key: unknown, reason: string, payload: unknown, environment: string) {
    emitRaw(JSON.stringify({ REASON: reason, KEY: key, PAYLOAD: JSON.stringify(payload), environment }));
  }

  describe('when window.environment is not set', () => {
    it('ignores frames tagged environment="alpha"', () => {
      const { received } = subscribe(42);

      emitTagged(42, 'DORESERVATION', { booking_nbr: 'A1' }, 'alpha');
      emit(42, 'DORESERVATION', { booking_nbr: 'P1' });

      expect(payloads(received)).toEqual([{ booking_nbr: 'P1' }]);
    });

    it('accepts frames tagged with any other environment', () => {
      const { received } = subscribe(42);

      emitTagged(42, 'DORESERVATION', { booking_nbr: 'P1' }, 'production');

      expect(payloads(received)).toEqual([{ booking_nbr: 'P1' }]);
    });

    it('does not read the tag from inside the payload', () => {
      const { received } = subscribe(42);

      emit(42, 'DORESERVATION', { environment: 'alpha', booking_nbr: 'P1' });

      expect(payloads(received)).toEqual([{ environment: 'alpha', booking_nbr: 'P1' }]);
    });

    it('still delivers array and non-JSON payloads', () => {
      const { received } = subscribe(42);

      emit(42, 'UPDATE_CALENDAR_AVAILABILITY', [{ room_type_id: 1 }]);
      emitRaw(JSON.stringify({ REASON: 'DELETE_CALENDAR_POOL', KEY: 42, PAYLOAD: 'POOL-123' }));

      expect(payloads(received)).toEqual([[{ room_type_id: 1 }], 'POOL-123']);
    });
  });

  describe('when window.environment is something other than "alpha"', () => {
    it('behaves like a normal page and ignores alpha frames', () => {
      (window as Env).environment = 'staging';
      const { received } = subscribe(42);

      emitTagged(42, 'DORESERVATION', { booking_nbr: 'A1' }, 'alpha');
      emit(42, 'DORESERVATION', { booking_nbr: 'P1' });

      expect(payloads(received)).toEqual([{ booking_nbr: 'P1' }]);
    });
  });

  describe('when window.environment is "alpha"', () => {
    beforeEach(() => {
      (window as Env).environment = 'alpha';
    });

    it('accepts only frames tagged environment="alpha"', () => {
      const { received } = subscribe(42);

      emit(42, 'DORESERVATION', { booking_nbr: 'P1' });
      emitTagged(42, 'DORESERVATION', { booking_nbr: 'X1' }, 'production');
      emitTagged(42, 'DORESERVATION', { booking_nbr: 'A1' }, 'alpha');

      expect(payloads(received)).toEqual([{ booking_nbr: 'A1' }]);
    });

    it('drops an untagged frame even when its payload says environment="alpha"', () => {
      const { received } = subscribe(42);

      emit(42, 'DORESERVATION', { environment: 'alpha', booking_nbr: 'P1' });

      expect(received).toEqual([]);
    });

    it('delivers array and non-JSON payloads from alpha-tagged frames', () => {
      const { received } = subscribe(42);

      emitTagged(42, 'UPDATE_CALENDAR_AVAILABILITY', [{ room_type_id: 1 }], 'alpha');
      emitRaw(JSON.stringify({ REASON: 'DELETE_CALENDAR_POOL', KEY: 42, PAYLOAD: 'POOL-123', environment: 'alpha' }));

      expect(payloads(received)).toEqual([[{ room_type_id: 1 }], 'POOL-123']);
    });

    it('still delivers only the subscribed property', () => {
      const { received } = subscribe(42);

      emitTagged(99, 'DORESERVATION', { booking_nbr: 'OTHER' }, 'alpha');
      emitTagged(42, 'DORESERVATION', { booking_nbr: 'MINE' }, 'alpha');

      expect(payloads(received)).toEqual([{ booking_nbr: 'MINE' }]);
    });
  });

  it('reads window.environment per message, so a host page can set it after subscribing', () => {
    const { received } = subscribe(42);

    emitTagged(42, 'DORESERVATION', { booking_nbr: 'BEFORE' }, 'alpha');
    (window as Env).environment = 'alpha';
    emitTagged(42, 'DORESERVATION', { booking_nbr: 'AFTER' }, 'alpha');

    expect(payloads(received)).toEqual([{ booking_nbr: 'AFTER' }]);
  });
});
