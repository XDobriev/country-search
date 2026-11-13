import { describe, it, expect, vi } from 'vitest';
import { SearchCache } from '../src/utils/searchCache';

describe('SearchCache', () => {
  it('returns cached result on repeated queries without invoking fetchFn again', async () => {
    const cache = new SearchCache<string[]>();
    const fetchFn = vi.fn().mockResolvedValue(['Spain', 'Sweden']);

    const result1 = await cache.execute('sw', fetchFn);
    const result2 = await cache.execute('sw', fetchFn);

    expect(result1).toEqual(['Spain', 'Sweden']);
    expect(result2).toEqual(['Spain', 'Sweden']);
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(cache.has('sw')).toBe(true);
  });

  it('normalizes query strings with leading/trailing spaces and varying case', async () => {
    const cache = new SearchCache<string[]>();
    const fetchFn = vi.fn().mockResolvedValue(['Norway']);

    await cache.execute('  Norway ', fetchFn);
    const cached = cache.get('norway');

    expect(cached).toEqual(['Norway']);
    expect(cache.has('NORWAY  ')).toBe(true);
  });

  it('deduplicates simultaneous in-flight requests for the exact same query', async () => {
    const cache = new SearchCache<string[]>();
    let resolveRequest: (val: string[]) => void = () => {};
    const fetchFn = vi.fn().mockImplementation(() => {
      return new Promise<string[]>((resolve) => {
        resolveRequest = resolve;
      });
    });

    const promise1 = cache.execute('germany', fetchFn);
    const promise2 = cache.execute('germany', fetchFn);

    expect(fetchFn).toHaveBeenCalledTimes(1);

    resolveRequest(['Germany']);

    const [res1, res2] = await Promise.all([promise1, promise2]);
    expect(res1).toEqual(['Germany']);
    expect(res2).toEqual(['Germany']);
  });

  it('preserves other callers if one caller cancels its in-flight request', async () => {
    const cache = new SearchCache<string[]>();
    const caller1Controller = new AbortController();
    const caller2Controller = new AbortController();

    let underlyingSignal: AbortSignal | undefined;
    let resolveFn: (val: string[]) => void = () => {};

    const fetchFn = vi.fn().mockImplementation((signal: AbortSignal) => {
      underlyingSignal = signal;
      return new Promise<string[]>((resolve, reject) => {
        resolveFn = resolve;
        signal.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'));
        });
      });
    });

    const promise1 = cache.execute('italy', fetchFn, caller1Controller.signal);
    const promise2 = cache.execute('italy', fetchFn, caller2Controller.signal);

    expect(fetchFn).toHaveBeenCalledTimes(1);

    // Caller 1 aborts
    caller1Controller.abort();

    await expect(promise1).rejects.toMatchObject({ name: 'AbortError' });
    // Underlying signal should NOT be aborted because caller2 is still waiting
    expect(underlyingSignal?.aborted).toBe(false);

    // Resolve the underlying request
    resolveFn(['Italy']);
    const res2 = await promise2;
    expect(res2).toEqual(['Italy']);
  });

  it('aborts underlying request when all in-flight subscribers cancel', async () => {
    const cache = new SearchCache<string[]>();
    const caller1Controller = new AbortController();
    const caller2Controller = new AbortController();

    let underlyingSignal: AbortSignal | undefined;

    const fetchFn = vi.fn().mockImplementation((signal: AbortSignal) => {
      underlyingSignal = signal;
      return new Promise<string[]>((_resolve, reject) => {
        signal.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'));
        });
      });
    });

    const promise1 = cache.execute('poland', fetchFn, caller1Controller.signal);
    const promise2 = cache.execute('poland', fetchFn, caller2Controller.signal);

    caller1Controller.abort();
    caller2Controller.abort();

    await expect(promise1).rejects.toMatchObject({ name: 'AbortError' });
    await expect(promise2).rejects.toMatchObject({ name: 'AbortError' });

    expect(underlyingSignal?.aborted).toBe(true);
  });

  it('does not cache failed requests and allows retrying subsequent calls', async () => {
    const cache = new SearchCache<string[]>();
    const fetchFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('Network failure'))
      .mockResolvedValueOnce(['Finland']);

    await expect(cache.execute('finland', fetchFn)).rejects.toThrow('Network failure');
    expect(cache.has('finland')).toBe(false);

    const retryResult = await cache.execute('finland', fetchFn);
    expect(retryResult).toEqual(['Finland']);
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it('respects maxSize by evicting oldest entries (LRU)', async () => {
    const cache = new SearchCache<string[]>({ maxSize: 2 });
    const fetchFn = vi.fn().mockImplementation((_sig, q: string) => Promise.resolve([q]));

    await cache.execute('a', () => fetchFn(null, 'a'));
    await cache.execute('b', () => fetchFn(null, 'b'));
    await cache.execute('c', () => fetchFn(null, 'c')); // 'a' evicted

    expect(cache.has('a')).toBe(false);
    expect(cache.has('b')).toBe(true);
    expect(cache.has('c')).toBe(true);
  });
});
