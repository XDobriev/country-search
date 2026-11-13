import { describe, it, expect, beforeEach } from 'vitest';
import { SearchHistory } from '../src/utils/searchHistory';

class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

describe('SearchHistory', () => {
  let storage: Storage;

  beforeEach(() => {
    storage = new MemoryStorage();
  });

  it('returns empty array when storage is empty', () => {
    const history = new SearchHistory({ storage });
    expect(history.getHistory()).toEqual([]);
  });

  it('adds new queries to the beginning of the list', () => {
    const history = new SearchHistory({ storage });
    history.addQuery('France');
    history.addQuery('Spain');

    expect(history.getHistory()).toEqual(['Spain', 'France']);
  });

  it('moves existing query to the top instead of adding duplicates', () => {
    const history = new SearchHistory({ storage });
    history.addQuery('Germany');
    history.addQuery('Italy');
    history.addQuery('germany'); // Case-insensitive duplicate check

    expect(history.getHistory()).toEqual(['germany', 'Italy']);
  });

  it('ignores empty or whitespace-only queries', () => {
    const history = new SearchHistory({ storage });
    history.addQuery('');
    history.addQuery('   ');

    expect(history.getHistory()).toEqual([]);
  });

  it('trims whitespace around queries', () => {
    const history = new SearchHistory({ storage });
    history.addQuery('  Canada  ');

    expect(history.getHistory()).toEqual(['Canada']);
  });

  it('limits history to maxItems by evicting oldest items', () => {
    const history = new SearchHistory({ storage, maxItems: 3 });
    history.addQuery('one');
    history.addQuery('two');
    history.addQuery('three');
    history.addQuery('four');

    expect(history.getHistory()).toEqual(['four', 'three', 'two']);
  });

  it('removes a specific query from history', () => {
    const history = new SearchHistory({ storage });
    history.addQuery('Japan');
    history.addQuery('Korea');

    history.removeQuery('Japan');
    expect(history.getHistory()).toEqual(['Korea']);
  });

  it('clears all history entries', () => {
    const history = new SearchHistory({ storage });
    history.addQuery('Brazil');
    history.addQuery('Peru');

    history.clearHistory();
    expect(history.getHistory()).toEqual([]);
    expect(storage.getItem('country_search_history')).toBeNull();
  });

  it('gracefully handles corrupted JSON in storage without throwing', () => {
    storage.setItem('country_search_history', 'INVALID_JSON_%%%');
    const history = new SearchHistory({ storage });

    expect(history.getHistory()).toEqual([]);
  });
});
