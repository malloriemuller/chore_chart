/**
 * Queues async work so that no more than `maxPerSecond` items start within any
 * rolling second, matching Airtable's 5 requests/sec/base rate limit.
 */
export class RateLimiter {
  private readonly minIntervalMs: number;
  private queue: Promise<unknown> = Promise.resolve();
  private lastStart = 0;

  constructor(maxPerSecond: number) {
    this.minIntervalMs = 1000 / maxPerSecond;
  }

  run<T>(fn: () => Promise<T>): Promise<T> {
    const result = this.queue.then(async () => {
      const wait = Math.max(0, this.lastStart + this.minIntervalMs - Date.now());
      if (wait > 0) {
        await sleep(wait);
      }
      this.lastStart = Date.now();
      return fn();
    });
    // Swallow rejections in the chain so one failed call doesn't jam the queue for the next caller.
    this.queue = result.catch(() => undefined);
    return result;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const airtableLimiter = new RateLimiter(5);
