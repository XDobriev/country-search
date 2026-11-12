import { HttpError } from './HttpError';
import type { RawCountry } from '../types/country';

export interface SearchCountriesOptions {
  timeoutMs?: number;
  apiBaseUrl?: string;
}

const DEFAULT_TIMEOUT_MS = 10000;
const DEFAULT_API_BASE_URL = 'https://countries.dev/name';

/**
 * Searches countries by name using countries.dev API.
 * Supports cancellation via AbortSignal and handles timeouts.
 *
 * 404 response is treated as an empty result (not an error).
 * Other non-2xx responses throw HttpError.
 */
export async function searchCountries(
  query: string,
  signal?: AbortSignal,
  options?: SearchCountriesOptions
): Promise<RawCountry[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const baseUrl = options?.apiBaseUrl ?? DEFAULT_API_BASE_URL;
  const url = `${baseUrl}/${encodeURIComponent(trimmed)}`;

  const internalController = new AbortController();
  let timeoutTimer: ReturnType<typeof setTimeout> | null = null;
  let didTimeout = false;

  if (timeoutMs > 0) {
    timeoutTimer = setTimeout(() => {
      didTimeout = true;
      const timeoutError = new DOMException('The operation timed out', 'TimeoutError');
      internalController.abort(timeoutError);
    }, timeoutMs);
  }

  const onExternalAbort = (): void => {
    if (timeoutTimer !== null) {
      clearTimeout(timeoutTimer);
      timeoutTimer = null;
    }
    const abortReason =
      signal?.reason instanceof Error
        ? signal.reason
        : new DOMException('This operation was aborted', 'AbortError');
    internalController.abort(abortReason);
  };

  if (signal) {
    if (signal.aborted) {
      if (timeoutTimer !== null) {
        clearTimeout(timeoutTimer);
      }
      throw signal.reason instanceof Error
        ? signal.reason
        : new DOMException('This operation was aborted', 'AbortError');
    }
    signal.addEventListener('abort', onExternalAbort, { once: true });
  }

  try {
    const response = await fetch(url, { signal: internalController.signal });

    if (response.status === 404) {
      return [];
    }

    if (!response.ok) {
      throw new HttpError(response.status, `HTTP error ${response.status}: ${response.statusText}`);
    }

    const data = (await response.json()) as RawCountry[];
    return Array.isArray(data) ? data : [];
  } catch (error) {
    if (didTimeout) {
      throw new DOMException('The operation timed out', 'TimeoutError');
    }
    if (
      internalController.signal.aborted &&
      (internalController.signal.reason as DOMException)?.name === 'TimeoutError'
    ) {
      throw internalController.signal.reason;
    }
    if (signal?.aborted) {
      throw signal.reason instanceof Error
        ? signal.reason
        : new DOMException('This operation was aborted', 'AbortError');
    }
    throw error;
  } finally {
    if (timeoutTimer !== null) {
      clearTimeout(timeoutTimer);
    }
    if (signal) {
      signal.removeEventListener('abort', onExternalAbort);
    }
  }
}
