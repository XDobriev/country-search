import { el } from '../dom';
import type { CountryCard } from '../../types/country';

export function createCountryCard(
  country: CountryCard,
  onSelect: (country: CountryCard) => void
): HTMLElement {
  const card = el('article', {
    className: 'country-card',
    tabindex: '0',
    role: 'button',
    'aria-label': `${country.name}, столица ${country.capital}`,
  });

  const flagWrapper = el('div', { className: 'card-flag-wrapper' });

  if (country.flag) {
    const flagImg = el('img', {
      className: 'card-flag-img',
      src: country.flag,
      alt: country.flagAlt,
      loading: 'lazy',
    }) as HTMLImageElement;

    flagImg.addEventListener('error', () => {
      flagWrapper.replaceChildren(
        el('span', { className: 'card-flag-fallback' }, [country.flagEmoji])
      );
    });

    flagWrapper.appendChild(flagImg);
  } else {
    flagWrapper.appendChild(el('span', { className: 'card-flag-fallback' }, [country.flagEmoji]));
  }

  const title = el('h3', { className: 'card-title' }, [country.name]);
  const nativeName = country.nativeName
    ? el('span', { className: 'card-native-name' }, [country.nativeName])
    : null;

  const header = el(
    'div',
    { className: 'card-header' },
    nativeName ? [title, nativeName] : [title]
  );

  const stats = el('div', { className: 'card-stats' }, [
    el('div', { className: 'stat-item' }, [
      el('span', { className: 'stat-label' }, ['Столица:']),
      el('span', { className: 'stat-value' }, [country.capital]),
    ]),
    el('div', { className: 'stat-item' }, [
      el('span', { className: 'stat-label' }, ['Регион:']),
      el('span', { className: 'stat-value' }, [country.region]),
    ]),
    el('div', { className: 'stat-item' }, [
      el('span', { className: 'stat-label' }, ['Население:']),
      el('span', { className: 'stat-value' }, [country.formattedPopulation]),
    ]),
  ]);

  const footer = el('div', { className: 'card-footer' }, [el('span', {}, ['Подробнее →'])]);

  const content = el('div', { className: 'card-content' }, [header, stats, footer]);

  card.appendChild(flagWrapper);
  card.appendChild(content);

  const triggerSelect = (): void => onSelect(country);

  card.addEventListener('click', triggerSelect);
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      triggerSelect();
    }
  });

  return card;
}
