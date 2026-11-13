export interface SearchHistoryOptions {
  storageKey?: string;
  maxItems?: number;
  storage?: Storage;
}

export class SearchHistory {
  constructor(_options?: SearchHistoryOptions) {}

  public getHistory(): string[] {
    throw new Error('Not implemented');
  }

  public addQuery(_query: string): void {
    throw new Error('Not implemented');
  }

  public removeQuery(_query: string): void {
    throw new Error('Not implemented');
  }

  public clearHistory(): void {
    throw new Error('Not implemented');
  }
}
