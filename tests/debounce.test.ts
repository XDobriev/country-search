import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce } from '../src/utils/debounce';

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not invoke callback immediately upon call', () => {
    const callback = vi.fn();
    const debounced = debounce(callback, 300);

    debounced('test');

    expect(callback).not.toHaveBeenCalled();
  });

  it('invokes callback once delay has passed', () => {
    const callback = vi.fn();
    const debounced = debounce(callback, 300);

    debounced('arg1', 42);
    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(299);
    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('arg1', 42);
  });

  it('resets timer when called repeatedly within delay window', () => {
    const callback = vi.fn();
    const debounced = debounce(callback, 300);

    debounced('first');
    vi.advanceTimersByTime(200);

    debounced('second');
    vi.advanceTimersByTime(200);

    debounced('third');
    vi.advanceTimersByTime(200);

    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('third');
  });

  it('passes the latest arguments to the callback', () => {
    const callback = vi.fn();
    const debounced = debounce(callback, 100);

    debounced(1);
    debounced(2);
    debounced(3);

    vi.advanceTimersByTime(100);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(3);
  });

  it('preserves the this context of the caller', () => {
    const context = {
      value: 99,
      method: vi.fn(function (this: { value: number }) {
        return this.value;
      }),
    };

    const debounced = debounce(context.method, 150);
    debounced.call(context);

    vi.advanceTimersByTime(150);

    expect(context.method).toHaveBeenCalledTimes(1);
  });

  it('supports cancelling pending execution via cancel()', () => {
    const callback = vi.fn();
    const debounced = debounce(callback, 300);

    debounced('will be cancelled');
    debounced.cancel();

    vi.advanceTimersByTime(500);

    expect(callback).not.toHaveBeenCalled();
  });
});
