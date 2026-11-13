export interface CacheOptions {
  maxSize?: number;
  ttlMs?: number;
}

export class SearchCache<T> {
  constructor(_options?: CacheOptions) {}

  public get(_query: string): T | undefined {
    throw new Error('Not implemented');
  }

  public set(_query: string, _data: T): void {
    throw new Error('Not implemented');
  }

  public has(_query: string): boolean {
    throw new Error('Not implemented');
  }

  public clear(): void {
    throw new Error('Not implemented');
  }

  public async execute(
    _query: string,
    _fetchFn: (signal: AbortSignal) => Promise<T>,
    _callerSignal?: AbortSignal
  ): Promise<T> {
    throw new Error('Not implemented');
  }
}
