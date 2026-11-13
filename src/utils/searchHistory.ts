export interface SearchHistoryOptions {
  storageKey?: string;
  maxItems?: number;
  storage?: Storage;
}

const DEFAULT_STORAGE_KEY = 'country_search_history';
const DEFAULT_MAX_ITEMS = 5;

export class SearchHistory {
  private readonly storageKey: string;
  private readonly maxItems: number;
  private readonly storage: Storage | null;

  constructor(options?: SearchHistoryOptions) {
    this.storageKey = options?.storageKey ?? DEFAULT_STORAGE_KEY;
    this.maxItems = options?.maxItems ?? DEFAULT_MAX_ITEMS;

    if (options?.storage) {
      this.storage = options.storage;
    } else {
      try {
        this.storage =
          typeof window !== 'undefined' && window.localStorage ? window.localStorage : null;
      } catch {
        this.storage = null;
      }
    }
  }

  public getHistory(): string[] {
    if (!this.storage) {
      return [];
    }

    try {
      const raw = this.storage.getItem(this.storageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (item): item is string => typeof item === 'string' && item.trim().length > 0
        );
      }
      return [];
    } catch {
      return [];
    }
  }

  public addQuery(query: string): void {
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }

    const current = this.getHistory();
    const normalizedNew = trimmed.toLowerCase();
    const filtered = current.filter((item) => item.toLowerCase() !== normalizedNew);

    const updated = [trimmed, ...filtered].slice(0, this.maxItems);
    this.save(updated);
  }

  public removeQuery(query: string): void {
    const normalized = query.trim().toLowerCase();
    const current = this.getHistory();
    const updated = current.filter((item) => item.toLowerCase() !== normalized);
    this.save(updated);
  }

  public clearHistory(): void {
    if (!this.storage) return;
    try {
      this.storage.removeItem(this.storageKey);
    } catch {
      // Storage unavailable or blocked
    }
  }

  private save(items: string[]): void {
    if (!this.storage) return;
    try {
      this.storage.setItem(this.storageKey, JSON.stringify(items));
    } catch {
      // Storage full or blocked
    }
  }
}
