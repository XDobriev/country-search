import { el } from '../dom';
import type { ClassifiedError } from '../../utils/classifyError';

export function createIdleView(onHintClick: (term: string) => void): HTMLElement {
  const icon = el('div', { className: 'state-icon' }, ['🧭']);
  const title = el('h2', { className: 'state-title' }, ['Исследуйте страны']);
  const desc = el('p', { className: 'state-desc' }, [
    'Начните вводить название любой страны на английском языке. Поиск начнется автоматически, а устаревшие запросы будут мгновенно отменены.',
  ]);

  const hintsContainer = el('div', { className: 'state-hints' });
  const sampleCountries = ['Spain', 'Japan', 'Brazil', 'Germany', 'Norway'];

  for (const country of sampleCountries) {
    const chip = el(
      'button',
      {
        type: 'button',
        className: 'hint-chip',
        title: `Искать ${country}`,
      },
      [country]
    );
    chip.addEventListener('click', () => onHintClick(country));
    hintsContainer.appendChild(chip);
  }

  return el('div', { className: 'state-box' }, [icon, title, desc, hintsContainer]);
}

export function createLoadingView(): HTMLElement {
  const grid = el('div', {
    className: 'country-grid',
    'aria-label': 'Загрузка результатов поиска',
    'aria-busy': 'true',
  });

  for (let i = 0; i < 6; i++) {
    const skeleton = el('div', { className: 'skeleton-card' }, [
      el('div', { className: 'skeleton-shimmer' }),
    ]);
    grid.appendChild(skeleton);
  }

  return grid;
}

export function createEmptyView(query: string): HTMLElement {
  const icon = el('div', { className: 'state-icon' }, ['🔍']);
  const title = el('h2', { className: 'state-title' }, ['Ничего не найдено']);
  const desc = el('p', { className: 'state-desc' }, [
    query
      ? `По запросу «${query}» совпадений не обнаружено. Проверьте правильность написания названия страны на английском языке.`
      : 'По вашему запросу ничего не найдено.',
  ]);

  return el('div', { className: 'state-box' }, [icon, title, desc]);
}

export function createErrorView(error: ClassifiedError | null, onRetry: () => void): HTMLElement {
  const icon = el('div', { className: 'state-icon' }, ['⚠️']);
  const title = el('h2', { className: 'state-title' }, ['Ошибка при загрузке данных']);

  const messageText =
    error?.message || 'Не удалось получить данные о странах. Проверьте соединение с сетью.';
  const desc = el('p', { className: 'state-desc' }, [messageText]);

  const retryBtn = el(
    'button',
    {
      type: 'button',
      className: 'btn-retry',
      'aria-label': 'Повторить последний запрос',
    },
    ['🔄 Повторить запрос']
  );

  retryBtn.addEventListener('click', () => {
    onRetry();
  });

  return el('div', { className: 'state-box error-box' }, [icon, title, desc, retryBtn]);
}
