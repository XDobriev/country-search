import { el, clearElement } from '../dom';

export interface HistoryBarProps {
  onSelect: (term: string) => void;
  onRemove: (term: string) => void;
  onClearAll: () => void;
}

export interface HistoryBarHandle {
  element: HTMLElement;
  update: (history: string[]) => void;
}

export function createHistoryBar(props: HistoryBarProps): HistoryBarHandle {
  const container = el('nav', {
    className: 'history-bar',
    'aria-label': 'История поисковых запросов',
  });
  container.style.display = 'none';

  const update = (history: string[]): void => {
    clearElement(container);

    if (history.length === 0) {
      container.style.display = 'none';
      return;
    }

    container.style.display = 'flex';

    const label = el('span', { className: 'history-label' }, ['Недавние:']);
    container.appendChild(label);

    for (const term of history) {
      const chip = el('button', {
        type: 'button',
        className: 'history-chip',
        'aria-label': `Искать «${term}»`,
      });

      const termText = el('span', {}, [term]);
      termText.addEventListener('click', (e) => {
        e.stopPropagation();
        props.onSelect(term);
      });

      const removeBtn = el(
        'button',
        {
          type: 'button',
          className: 'history-chip-remove',
          'aria-label': `Удалить «${term}» из истории`,
          title: 'Удалить',
        },
        ['×']
      );

      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        props.onRemove(term);
      });

      chip.appendChild(termText);
      chip.appendChild(removeBtn);
      chip.addEventListener('click', () => {
        props.onSelect(term);
      });

      container.appendChild(chip);
    }

    const clearAllBtn = el(
      'button',
      {
        type: 'button',
        className: 'history-clear-btn',
        title: 'Очистить всю историю',
      },
      ['Очистить']
    );

    clearAllBtn.addEventListener('click', () => {
      props.onClearAll();
    });

    container.appendChild(clearAllBtn);
  };

  return {
    element: container,
    update,
  };
}
