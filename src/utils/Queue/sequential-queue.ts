export class SequentialQueue<T> {
  private queue: T[] = [];
  private draining = false;
  private handler: ((item: T) => Promise<void>) | null = null;
  private destroyed = false;

  constructor(private readonly maxSize = 1000) {}

  setHandler(fn: (item: T) => Promise<void>): void {
    this.handler = fn;
  }

  enqueue(item: T): void {
    if (this.destroyed) return;
    if (this.queue.length >= this.maxSize) {
      this.queue.shift(); // drop oldest when full
    }
    this.queue.push(item);
    if (!this.draining) {
      this.drain();
    }
  }

  private async drain(): Promise<void> {
    if (!this.handler) return;
    this.draining = true;
    while (this.queue.length > 0 && !this.destroyed) {
      const item = this.queue.shift()!;
      try {
        await this.handler(item);
      } catch (e) {
        console.error('SequentialQueue handler error', e);
      }
    }
    this.draining = false;
  }

  destroy(): void {
    this.destroyed = true;
    this.queue = [];
    this.handler = null;
  }
}
