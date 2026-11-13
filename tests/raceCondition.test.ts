import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SearchCoordinator } from '../src/services/SearchCoordinator';

describe('Race condition and cancellation', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('aborts earlier in-flight request when user inputs new query and prevents stale response from overwriting newer result', async () => {
    let spSignal: AbortSignal | undefined;
    let spainSignal: AbortSignal | undefined;
    let resolveSp: (val: unknown) => void = () => {};
    let resolveSpain: (val: unknown) => void = () => {};

    const spData = [
      {
        name: 'Spain',
        capital: 'Madrid',
        region: 'Europe',
        population: 47000000,
        flags: { svg: 'https://flagcdn.com/es.svg' },
      },
      {
        name: 'Special Country',
        capital: 'Special',
        region: 'Special',
        population: 1000,
        flags: { svg: '' },
      },
    ];

    const spainData = [
      {
        name: 'Spain',
        capital: 'Madrid',
        region: 'Europe',
        population: 47000000,
        flags: { svg: 'https://flagcdn.com/es.svg' },
      },
    ];

    const fetchMock = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      const signal = init?.signal;

      if (url.includes('spain')) {
        spainSignal = signal;
        return new Promise((resolve, reject) => {
          resolveSpain = () =>
            resolve({
              ok: true,
              status: 200,
              json: async () => spainData,
            });

          signal?.addEventListener('abort', () => {
            reject(new DOMException('This operation was aborted', 'AbortError'));
          });
        });
      }

      if (url.includes('sp')) {
        spSignal = signal;
        return new Promise((resolve, reject) => {
          resolveSp = () =>
            resolve({
              ok: true,
              status: 200,
              json: async () => spData,
            });

          signal?.addEventListener('abort', () => {
            reject(new DOMException('This operation was aborted', 'AbortError'));
          });
        });
      }

      return Promise.reject(new Error('Unknown url'));
    });

    globalThis.fetch = fetchMock;

    const coordinator = new SearchCoordinator({ debounceDelay: 0 });

    // Step 1: User types 'sp'
    coordinator.onInput('sp');

    // Allow synchronous microtasks to initiate the 'sp' fetch
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/sp'),
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
    expect(spSignal).toBeDefined();
    expect(spSignal?.aborted).toBe(false);

    // Step 2: User types 'spain' while 'sp' is still in flight
    coordinator.onInput('spain');

    // The coordinator MUST immediately abort the previous request's signal
    expect(spSignal?.aborted).toBe(true);

    // Allow synchronous microtasks to initiate the 'spain' fetch
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(spainSignal).toBeDefined();
    expect(spainSignal?.aborted).toBe(false);

    // Step 3: INVERTED RESOLUTION ORDER:
    // Resolve the later request ('spain') FIRST
    resolveSpain({});
    await new Promise((resolve) => setTimeout(resolve, 10));

    const stateAfterSpain = coordinator.getState();
    expect(stateAfterSpain.status).toBe('SUCCESS');
    expect(stateAfterSpain.results).toHaveLength(1);
    expect(stateAfterSpain.results[0].name).toBe('Spain');

    // Step 4: Now attempt to resolve the earlier request ('sp') LATER
    // Even if the delayed promise resolves, it was already aborted
    resolveSp({});
    await new Promise((resolve) => setTimeout(resolve, 10));

    // The final state must remain 'Spain' (1 country), NOT overwritten by 'sp' (2 countries)
    const finalState = coordinator.getState();
    expect(finalState.status).toBe('SUCCESS');
    expect(finalState.results).toHaveLength(1);
    expect(finalState.results[0].name).toBe('Spain');
    expect(finalState.error).toBeNull();
  });

  it('aborts active request immediately on input change even during debounce interval', async () => {
    let firstSignal: AbortSignal | undefined;

    const fetchMock = vi.fn().mockImplementation((_url: string, init?: RequestInit) => {
      const signal = init?.signal;
      firstSignal = signal;
      return new Promise((_resolve, reject) => {
        signal?.addEventListener('abort', () => {
          reject(new DOMException('This operation was aborted', 'AbortError'));
        });
      });
    });
    globalThis.fetch = fetchMock;

    const coordinator = new SearchCoordinator({ debounceDelay: 50 });

    // Trigger first input and wait for debounce to fire fetch
    coordinator.onInput('first');
    await new Promise((resolve) => setTimeout(resolve, 60));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(firstSignal?.aborted).toBe(false);

    // Typing second query immediately aborts the active in-flight request
    coordinator.onInput('second');
    expect(firstSignal?.aborted).toBe(true);
  });
});
