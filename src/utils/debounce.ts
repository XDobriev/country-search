export type DebouncedFunction<T extends (...args: unknown[]) => unknown> = ((
  this: unknown,
  ...args: Parameters<T>
) => void) & {
  cancel: () => void;
};

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): DebouncedFunction<T> {
  let timerId: ReturnType<typeof setTimeout> | null = null;

  const debounced = function (this: unknown, ...args: Parameters<T>): void {
    if (timerId !== null) {
      clearTimeout(timerId);
    }
    timerId = setTimeout(() => {
      fn.apply(this, args);
      timerId = null;
    }, delay);
  };

  debounced.cancel = (): void => {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
  };

  return debounced as DebouncedFunction<T>;
}
