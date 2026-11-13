// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyFunction = (...args: any[]) => any;

export type DebouncedFunction<T extends AnyFunction> = ((
  this: unknown,
  ...args: Parameters<T>
) => void) & {
  cancel: () => void;
};

export function debounce<T extends AnyFunction>(fn: T, delay: number): DebouncedFunction<T> {
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
