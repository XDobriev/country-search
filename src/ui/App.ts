import { el, clearElement } from './dom';
import { SearchCoordinator, type SearchState } from '../services/SearchCoordinator';
import { createSearchBar } from './components/SearchBar';
import { createHistoryBar } from './components/HistoryBar';
import { createCountryCard } from './components/CountryCardView';
import { openCountryModal } from './components/CountryModal';
import {
  createIdleView,
  createLoadingView,
  createEmptyView,
  createErrorView,
} from './components/StateViews';
import type { CountryCard } from '../types/country';

export function createApp(): HTMLElement {
  const coordinator = new SearchCoordinator();

  const container = el('div', { className: 'app-container' });

  // Header
  const brandBadge = el('div', { className: 'brand-badge' }, ['RS School • Core JS/TS Module']);
  const brandTitle = el('h1', { className: 'brand-title' }, ['ATLAS EXPLORER']);
  const brandSubtitle = el('p', { className: 'brand-subtitle' }, [
    'Живой поиск стран с моментальной отменой устаревших запросов (AbortController), debounce и кэшированием.',
  ]);
  const header = el('header', { className: 'app-header' }, [brandBadge, brandTitle, brandSubtitle]);

  // Search Bar
  const searchBar = createSearchBar({
    onInput: (query) => {
      coordinator.onInput(query);
    },
    onClear: () => {
      coordinator.onInput('');
    },
  });

  // History Bar
  const historyBar = createHistoryBar({
    onSelect: (term) => {
      searchBar.setValue(term);
      void coordinator.selectFromHistory(term);
    },
    onRemove: (term) => {
      // Access storage directly or through coordinator
      const history = coordinator.getState().history.filter((h) => h !== term);
      localStorage.setItem('country_search_history', JSON.stringify(history));
      historyBar.update(history);
    },
    onClearAll: () => {
      localStorage.removeItem('country_search_history');
      historyBar.update([]);
    },
  });

  // Content area
  const contentArea = el('main', {
    className: 'content-area',
    'aria-live': 'polite',
  });

  const footer = el('footer', { className: 'app-footer' }, [
    el('p', {}, ['Country Search — Выполнено по спецификации RS School. API: countries.dev']),
  ]);

  container.appendChild(header);
  container.appendChild(searchBar.element);
  container.appendChild(historyBar.element);
  container.appendChild(contentArea);
  container.appendChild(footer);

  const onCountrySelect = (country: CountryCard): void => {
    openCountryModal(country, (borderCode) => {
      searchBar.setValue(borderCode);
      void coordinator.executeSearch(borderCode);
    });
  };

  const onHintClick = (hint: string): void => {
    searchBar.setValue(hint);
    void coordinator.selectFromHistory(hint);
  };

  coordinator.subscribe((state: SearchState) => {
    searchBar.setLoading(state.status === 'LOADING');
    historyBar.update(state.history);

    clearElement(contentArea);

    switch (state.status) {
      case 'IDLE':
        contentArea.appendChild(createIdleView(onHintClick));
        break;

      case 'LOADING':
        contentArea.appendChild(createLoadingView());
        break;

      case 'EMPTY':
        contentArea.appendChild(createEmptyView(state.query));
        break;

      case 'ERROR':
        contentArea.appendChild(
          createErrorView(state.error, () => {
            void coordinator.retry();
          })
        );
        break;

      case 'SUCCESS': {
        const meta = el('div', { className: 'results-meta' }, [
          el('span', {}, [
            'Найдено результатов: ',
            el('span', { className: 'results-count' }, [String(state.results.length)]),
          ]),
          el('span', {}, ['Кликните по карточке для детального просмотра']),
        ]);

        const grid = el('div', {
          className: 'country-grid',
          role: 'region',
          'aria-label': 'Список найденных стран',
        });

        for (const country of state.results) {
          grid.appendChild(createCountryCard(country, onCountrySelect));
        }

        contentArea.appendChild(meta);
        contentArea.appendChild(grid);
        break;
      }
    }
  });

  return container;
}
