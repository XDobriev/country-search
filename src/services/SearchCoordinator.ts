import { debounce, type DebouncedFunction } from '../utils/debounce';
import { searchCountries } from '../api/searchCountries';
import { mapCountryResponse } from '../utils/mapCountryResponse';
import { classifyError, ErrorCategory, type ClassifiedError } from '../utils/classifyError';
import { SearchCache } from '../utils/searchCache';
import { SearchHistory } from '../utils/searchHistory';
import type { CountryCard, RawCountry } from '../types/country';

export type SearchStatus = 'IDLE' | 'LOADING' | 'SUCCESS' | 'EMPTY' | 'ERROR';

export interface SearchState {
  status: SearchStatus;
  query: string;
  lastRequestedQuery: string;
  results: CountryCard[];
  error: ClassifiedError | null;
  history: string[];
}

export interface SearchCoordinatorOptions {
  debounceDelay?: number;
  cache?: SearchCache<RawCountry[]>;
  history?: SearchHistory;
}

const DEFAULT_DEBOUNCE_DELAY = 350;

export class SearchCoordinator {
  private state: SearchState;
  private readonly listeners = new Set<(state: SearchState) => void>();
  private readonly cache: SearchCache<RawCountry[]>;
  private readonly history: SearchHistory;
  private readonly debouncedSearch: DebouncedFunction<(query: string) => void>;
  private activeController: AbortController | null = null;
  private readonly debounceDelay: number;

  constructor(options?: SearchCoordinatorOptions) {
    this.cache = options?.cache ?? new SearchCache<RawCountry[]>();
    this.history = options?.history ?? new SearchHistory();
    this.debounceDelay = options?.debounceDelay ?? DEFAULT_DEBOUNCE_DELAY;

    this.state = {
      status: 'IDLE',
      query: '',
      lastRequestedQuery: '',
      results: [],
      error: null,
      history: this.history.getHistory(),
    };

    this.debouncedSearch = debounce((query: string) => {
      void this.executeSearch(query);
    }, this.debounceDelay);
  }

  public getState(): SearchState {
    return { ...this.state, results: [...this.state.results] };
  }

  public subscribe(listener: (state: SearchState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const currentState = this.getState();
    for (const listener of this.listeners) {
      listener(currentState);
    }
  }

  /**
   * Called whenever user inputs text.
   * Immediately aborts any ongoing request to prevent race conditions.
   */
  public onInput(query: string): void {
    this.debouncedSearch.cancel();

    if (this.activeController) {
      this.activeController.abort(new DOMException('Query changed by user', 'AbortError'));
      this.activeController = null;
    }

    const trimmed = query.trim();

    if (!trimmed) {
      this.state = {
        ...this.state,
        query,
        lastRequestedQuery: '',
        status: 'IDLE',
        results: [],
        error: null,
      };
      this.notify();
      return;
    }

    this.state = {
      ...this.state,
      query,
    };
    this.notify();

    if (this.debounceDelay === 0) {
      void this.executeSearch(trimmed);
    } else {
      this.debouncedSearch(trimmed);
    }
  }

  public async retry(): Promise<void> {
    if (!this.state.lastRequestedQuery) {
      return;
    }
    await this.executeSearch(this.state.lastRequestedQuery);
  }

  public async selectFromHistory(query: string): Promise<void> {
    this.debouncedSearch.cancel();
    if (this.activeController) {
      this.activeController.abort(new DOMException('Query selected from history', 'AbortError'));
      this.activeController = null;
    }

    this.state = {
      ...this.state,
      query,
    };
    this.notify();

    const trimmed = query.trim();
    if (trimmed) {
      await this.executeSearch(trimmed);
    }
  }

  public async executeSearch(query: string): Promise<void> {
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }

    if (this.activeController) {
      this.activeController.abort(new DOMException('Starting new request', 'AbortError'));
      this.activeController = null;
    }

    const controller = new AbortController();
    this.activeController = controller;

    this.state = {
      ...this.state,
      status: 'LOADING',
      lastRequestedQuery: trimmed,
      error: null,
    };
    this.notify();

    try {
      const rawCountries = await this.cache.execute(
        trimmed,
        (signal) => searchCountries(trimmed, signal),
        controller.signal
      );

      // If aborted in the meantime, ignore
      if (controller.signal.aborted || this.activeController !== controller) {
        return;
      }

      const results = rawCountries.map(mapCountryResponse);

      if (results.length === 0) {
        this.state = {
          ...this.state,
          status: 'EMPTY',
          results: [],
          error: null,
        };
      } else {
        this.history.addQuery(trimmed);
        this.state = {
          ...this.state,
          status: 'SUCCESS',
          results,
          error: null,
          history: this.history.getHistory(),
        };
      }
      this.notify();
    } catch (err: unknown) {
      if (controller.signal.aborted || this.activeController !== controller) {
        return;
      }

      const classified = classifyError(err);

      if (classified.category === ErrorCategory.ABORT) {
        return;
      }

      if (classified.category === ErrorCategory.NOT_FOUND) {
        this.state = {
          ...this.state,
          status: 'EMPTY',
          results: [],
          error: null,
        };
        this.notify();
        return;
      }

      this.state = {
        ...this.state,
        status: 'ERROR',
        error: classified,
      };
      this.notify();
    } finally {
      if (this.activeController === controller) {
        this.activeController = null;
      }
    }
  }

  public destroy(): void {
    this.debouncedSearch.cancel();
    if (this.activeController) {
      this.activeController.abort(new DOMException('Coordinator destroyed', 'AbortError'));
      this.activeController = null;
    }
    this.listeners.clear();
  }
}
