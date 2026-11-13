import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { searchCountries } from '../src/api/searchCountries';
import { HttpError } from '../src/api/HttpError';

describe('searchCountries', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('returns an empty array for an empty query without making a network request', async () => {
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock;

    const result = await searchCountries('');

    expect(result).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns an empty array for whitespace-only query without making a network request', async () => {
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock;

    const result = await searchCountries('   ');

    expect(result).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fetches countries from countries.dev API with trimmed and URI-encoded query', async () => {
    const mockData = [{ name: 'Spain', capital: 'Madrid', region: 'Europe' }];
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockData,
    });
    globalThis.fetch = fetchMock;

    const result = await searchCountries('  spain  ');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const calledUrl = fetchMock.mock.calls[0][0];
    expect(calledUrl).toBe('https://countries.dev/name/spain');
    expect(result).toEqual(mockData);
  });

  it('returns empty array when API responds with 404 (not found is not an error)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: async () => ({ message: 'Country not found' }),
    });
    globalThis.fetch = fetchMock;

    const result = await searchCountries('nonexistent');

    expect(result).toEqual([]);
  });

  it('throws HttpError with status 500 when server responds with 500 error', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => ({ message: 'Server crash' }),
    });
    globalThis.fetch = fetchMock;

    await expect(searchCountries('germany')).rejects.toThrow(HttpError);

    try {
      await searchCountries('germany');
    } catch (err) {
      expect(err).toBeInstanceOf(HttpError);
      expect((err as HttpError).status).toBe(500);
    }
  });

  it('throws HttpError with status 403 on forbidden response', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      json: async () => ({}),
    });
    globalThis.fetch = fetchMock;

    try {
      await searchCountries('secret');
      expect.fail('Should have thrown HttpError');
    } catch (err) {
      expect(err).toBeInstanceOf(HttpError);
      expect((err as HttpError).status).toBe(403);
    }
  });

  it('passes AbortSignal to fetch and rejects with AbortError when aborted', async () => {
    const controller = new AbortController();

    const fetchMock = vi.fn().mockImplementation((_url: string, init?: RequestInit) => {
      return new Promise((_resolve, reject) => {
        const signal = init?.signal;
        if (signal?.aborted) {
          const err = new DOMException('This operation was aborted', 'AbortError');
          reject(err);
          return;
        }
        signal?.addEventListener('abort', () => {
          const err = new DOMException('This operation was aborted', 'AbortError');
          reject(err);
        });
      });
    });
    globalThis.fetch = fetchMock;

    const promise = searchCountries('france', controller.signal);
    controller.abort();

    await expect(promise).rejects.toThrow();
    await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('rejects with TimeoutError when request exceeds timeout threshold', async () => {
    const fetchMock = vi.fn().mockImplementation((_url: string, init?: RequestInit) => {
      return new Promise((_resolve, reject) => {
        const signal = init?.signal;
        signal?.addEventListener('abort', () => {
          // If signal was aborted due to timeout
          const reason = signal.reason;
          if (reason instanceof Error) {
            reject(reason);
          } else {
            const timeoutErr = new DOMException('The operation timed out', 'TimeoutError');
            reject(timeoutErr);
          }
        });
      });
    });
    globalThis.fetch = fetchMock;

    // Call with very short timeout for testing
    const promise = searchCountries('timeout-test', undefined, { timeoutMs: 20 });

    await expect(promise).rejects.toMatchObject({ name: 'TimeoutError' });
  });
});
