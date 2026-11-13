import { describe, it, expect } from 'vitest';
import { classifyError, ErrorCategory } from '../src/utils/classifyError';
import { HttpError } from '../src/api/HttpError';

describe('classifyError', () => {
  it('classifies DOMException AbortError as ABORT and suppresses error display', () => {
    const abortErr = new DOMException('User cancelled the search', 'AbortError');
    const result = classifyError(abortErr);

    expect(result.category).toBe(ErrorCategory.ABORT);
    expect(result.shouldDisplayToUser).toBe(false);
    expect(result.canRetry).toBe(false);
    expect(result.message).toBe('');
  });

  it('classifies DOMException TimeoutError as TIMEOUT and marks for display with retry', () => {
    const timeoutErr = new DOMException('The operation timed out', 'TimeoutError');
    const result = classifyError(timeoutErr);

    expect(result.category).toBe(ErrorCategory.TIMEOUT);
    expect(result.shouldDisplayToUser).toBe(true);
    expect(result.canRetry).toBe(true);
    expect(result.message).toContain('Время ожидания ответа истекло');
  });

  it('classifies HttpError 500 as HTTP_ERROR with status and server message', () => {
    const httpErr = new HttpError(500, 'Internal Server Error');
    const result = classifyError(httpErr);

    expect(result.category).toBe(ErrorCategory.HTTP_ERROR);
    expect(result.statusCode).toBe(500);
    expect(result.shouldDisplayToUser).toBe(true);
    expect(result.canRetry).toBe(true);
    expect(result.message).toContain('500');
  });

  it('classifies HttpError 404 specially as NOT_FOUND and suppresses error state', () => {
    const notFoundErr = new HttpError(404, 'Not Found');
    const result = classifyError(notFoundErr);

    expect(result.category).toBe(ErrorCategory.NOT_FOUND);
    expect(result.statusCode).toBe(404);
    expect(result.shouldDisplayToUser).toBe(false);
    expect(result.canRetry).toBe(false);
  });

  it('classifies network failure (Failed to fetch) as NETWORK_ERROR with retry', () => {
    const networkErr = new TypeError('Failed to fetch');
    const result = classifyError(networkErr);

    expect(result.category).toBe(ErrorCategory.NETWORK_ERROR);
    expect(result.shouldDisplayToUser).toBe(true);
    expect(result.canRetry).toBe(true);
    expect(result.message).toContain('интернет');
  });

  it('classifies unknown arbitrary errors as UNKNOWN with fallback message and retry', () => {
    const weirdErr = 'Something went completely sideways';
    const result = classifyError(weirdErr);

    expect(result.category).toBe(ErrorCategory.UNKNOWN);
    expect(result.shouldDisplayToUser).toBe(true);
    expect(result.canRetry).toBe(true);
    expect(result.message).toBeTruthy();
  });
});
