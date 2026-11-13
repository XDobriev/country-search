export interface CacheOptions {
  maxSize?: number;
  ttlMs?: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface InFlightEntry<T> {
  sharedPromise: Promise<T>;
  underlyingController: AbortController;
  subscriberCount: number;
}

export class SearchCache<T> {
  private readonly maxSize: number;
  private readonly ttlMs: number;
  private readonly cache = new Map<string, CacheEntry<T>>();
  private readonly inFlight = new Map<string, InFlightEntry<T>>();

  constructor(options?: CacheOptions) {
    this.maxSize = options?.maxSize ?? 100;
    this.ttlMs = options?.ttlMs ?? 0;
  }

  public normalizeKey(query: string): string {
    return query.trim().toLowerCase();
  }

  public get(query: string): T | undefined {
    const key = this.normalizeKey(query);
    const entry = this.cache.get(key);
    if (!entry) {
      return undefined;
    }

    if (this.ttlMs > 0 && Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      return undefined;
    }

    // Refresh LRU position
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.data;
  }

  public set(query: string, data: T): void {
    const key = this.normalizeKey(query);
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  public has(query: string): boolean {
    return this.get(query) !== undefined;
  }

  public clear(): void {
    this.cache.clear();
    for (const entry of this.inFlight.values()) {
      entry.underlyingController.abort(new DOMException('Cache was cleared', 'AbortError'));
    }
    this.inFlight.clear();
  }

  public async execute(
    query: string,
    fetchFn: (signal: AbortSignal) => Promise<T>,
    callerSignal?: AbortSignal
  ): Promise<T> {
    const key = this.normalizeKey(query);

    if (callerSignal?.aborted) {
      throw callerSignal.reason ?? new DOMException('This operation was aborted', 'AbortError');
    }

    const cached = this.get(key);
    if (cached !== undefined) {
      return cached;
    }

    let inFlightEntry = this.inFlight.get(key);

    if (!inFlightEntry) {
      const underlyingController = new AbortController();
      const sharedPromise = fetchFn(underlyingController.signal);

      inFlightEntry = {
        sharedPromise,
        underlyingController,
        subscriberCount: 0,
      };

      this.inFlight.set(key, inFlightEntry);

      sharedPromise
        .then((data) => {
          this.set(key, data);
        })
        .catch(() => {
          // Do not cache failures
        })
        .finally(() => {
          if (this.inFlight.get(key) === inFlightEntry) {
            this.inFlight.delete(key);
          }
        });
    }

    inFlightEntry.subscriberCount += 1;
    const currentEntry = inFlightEntry;

    return new Promise<T>((resolve, reject) => {
      let isDone = false;

      const onCallerAbort = (): void => {
        if (isDone) return;
        isDone = true;

        currentEntry.subscriberCount -= 1;
        if (currentEntry.subscriberCount <= 0) {
          currentEntry.underlyingController.abort(callerSignal?.reason);
          this.inFlight.delete(key);
        }

        const abortError =
          callerSignal?.reason instanceof Error
            ? callerSignal.reason
            : new DOMException('This operation was aborted', 'AbortError');
        reject(abortError);
      };

      if (callerSignal) {
        callerSignal.addEventListener('abort', onCallerAbort, { once: true });
      }

      currentEntry.sharedPromise
        .then((result) => {
          if (!isDone) {
            isDone = true;
            if (callerSignal) {
              callerSignal.removeEventListener('abort', onCallerAbort);
            }
            resolve(result);
          }
        })
        .catch((err) => {
          if (!isDone) {
            isDone = true;
            if (callerSignal) {
              callerSignal.removeEventListener('abort', onCallerAbort);
            }
            reject(err);
          }
        });
    });
  }
}
