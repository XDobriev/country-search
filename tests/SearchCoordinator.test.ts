import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SearchCoordinator } from '../src/services/SearchCoordinator';
import { HttpError } from '../src/api/HttpError';

describe('SearchCoordinator', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('initializes with IDLE state and empty results', () => {
    const coordinator = new SearchCoordinator();
    const state = coordinator.getState();

    expect(state.status).toBe('IDLE');
    expect(state.query).toBe('');
    expect(state.results).toEqual([]);
    expect(state.error).toBeNull();
  });

  it('resets to IDLE state when query becomes empty or whitespace', () => {
    const coordinator = new SearchCoordinator({ debounceDelay: 0 });
    coordinator.onInput('   ');

    const state = coordinator.getState();
    expect(state.status).toBe('IDLE');
    expect(state.results).toEqual([]);
  });

  it('sets status to EMPTY on 404 response and does not set error', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: async () => ({ message: 'Not Found' }),
    });
    globalThis.fetch = fetchMock;

    const coordinator = new SearchCoordinator({ debounceDelay: 0 });
    coordinator.onInput('atlantis');

    await new Promise((resolve) => setTimeout(resolve, 20));

    const state = coordinator.getState();
    expect(state.status).toBe('EMPTY');
    expect(state.results).toEqual([]);
    expect(state.error).toBeNull();
  });

  it('sets status to ERROR on 500 server error and canRetry is true', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => ({ message: 'Crash' }),
    });
    globalThis.fetch = fetchMock;

    const coordinator = new SearchCoordinator({ debounceDelay: 0 });
    coordinator.onInput('error-country');

    await new Promise((resolve) => setTimeout(resolve, 20));

    const state = coordinator.getState();
    expect(state.status).toBe('ERROR');
    expect(state.error?.canRetry).toBe(true);
    expect(state.error?.statusCode).toBe(500);
  });

  it('retries the exact last requested query when retry() is called', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Server Error',
        json: async () => ({}),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [
          {
            name: 'Norway',
            capital: 'Oslo',
            region: 'Europe',
            population: 5400000,
          },
        ],
      });
    globalThis.fetch = fetchMock;

    const coordinator = new SearchCoordinator({ debounceDelay: 0 });
    coordinator.onInput('norway');

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(coordinator.getState().status).toBe('ERROR');

    // Call retry
    await coordinator.retry();

    const state = coordinator.getState();
    expect(state.status).toBe('SUCCESS');
    expect(state.results[0].name).toBe('Norway');
  });

  it('searches immediately when selecting a term from history', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [
        {
          name: 'Brazil',
          capital: 'Brasília',
          region: 'Americas',
          population: 214000000,
        },
      ],
    });
    globalThis.fetch = fetchMock;

    const coordinator = new SearchCoordinator({ debounceDelay: 500 });
    await coordinator.selectFromHistory('Brazil');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(coordinator.getState().status).toBe('SUCCESS');
    expect(coordinator.getState().results[0].name).toBe('Brazil');
  });

  it('unsubscribes listeners cleanly', () => {
    const coordinator = new SearchCoordinator();
    const listener = vi.fn();
    const unsubscribe = coordinator.subscribe(listener);

    expect(listener).toHaveBeenCalledTimes(1);
    coordinator.onInput('abc');
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    coordinator.onInput('def');
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
