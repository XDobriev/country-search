import { el } from '../dom';

export interface SearchBarProps {
  onInput: (query: string) => void;
  onClear: () => void;
}

export interface SearchBarHandle {
  element: HTMLElement;
  setValue: (value: string) => void;
  setLoading: (isLoading: boolean) => void;
  focus: () => void;
}

export function createSearchBar(props: SearchBarProps): SearchBarHandle {
  const input = el('input', {
    type: 'text',
    className: 'search-input',
    placeholder: 'Введите название страны (например, Spain, Japan, Brazil)...',
    'aria-label': 'Поиск страны по названию',
    autocomplete: 'off',
    spellcheck: 'false',
  });

  const searchIcon = el('span', { className: 'search-icon', 'aria-hidden': 'true' }, ['🔍']);

  const clearBtn = el(
    'button',
    {
      type: 'button',
      className: 'search-action-btn',
      'aria-label': 'Очистить поле поиска',
      title: 'Очистить',
    },
    ['✕']
  );
  clearBtn.style.display = 'none';

  const spinner = el('div', {
    className: 'search-spinner',
    'aria-hidden': 'true',
  });
  spinner.style.display = 'none';

  clearBtn.addEventListener('click', () => {
    input.value = '';
    clearBtn.style.display = 'none';
    input.focus();
    props.onClear();
  });

  input.addEventListener('input', () => {
    if (input.value.length > 0) {
      clearBtn.style.display = 'flex';
    } else {
      clearBtn.style.display = 'none';
    }
    props.onInput(input.value);
  });

  const wrapper = el('div', { className: 'search-input-wrapper' }, [
    searchIcon,
    input,
    clearBtn,
    spinner,
  ]);

  const container = el('section', { className: 'search-section' }, [wrapper]);

  return {
    element: container,
    setValue: (val: string) => {
      input.value = val;
      clearBtn.style.display = val.length > 0 ? 'flex' : 'none';
    },
    setLoading: (isLoading: boolean) => {
      if (isLoading) {
        spinner.style.display = 'block';
        clearBtn.style.display = 'none';
      } else {
        spinner.style.display = 'none';
        clearBtn.style.display = input.value.length > 0 ? 'flex' : 'none';
      }
    },
    focus: () => input.focus(),
  };
}
