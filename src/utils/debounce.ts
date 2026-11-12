export type DebouncedFunction<T extends (...args: unknown[]) => unknown> = ((
  ...args: Parameters<T>
) => void) & {
  cancel: () => void;
};

export function debounce<T extends (...args: unknown[]) => unknown>(
  _fn: T,
  _delay: number
): DebouncedFunction<T> {
  throw new Error('Not implemented');
}
