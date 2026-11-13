import type { CountryCard } from '../types/country';
import type { ClassifiedError } from '../utils/classifyError';

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
}

export class SearchCoordinator {
  constructor(_options?: SearchCoordinatorOptions) {}

  public getState(): SearchState {
    throw new Error('Not implemented');
  }

  public subscribe(_listener: (state: SearchState) => void): () => void {
    throw new Error('Not implemented');
  }

  public onInput(_query: string): void {
    throw new Error('Not implemented');
  }

  public retry(): Promise<void> {
    throw new Error('Not implemented');
  }

  public selectFromHistory(_query: string): Promise<void> {
    throw new Error('Not implemented');
  }

  public destroy(): void {
    throw new Error('Not implemented');
  }
}
