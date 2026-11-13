import { el } from '../dom';
import type { CountryCard } from '../../types/country';

export function openCountryModal(
  country: CountryCard,
  onBorderClick?: (borderCode: string) => void
): void {
  const overlay = el('div', {
    className: 'modal-overlay',
    role: 'dialog',
    'aria-modal': 'true',
    'aria-labelledby': 'modal-country-name',
  });

  const dialog = el('div', { className: 'modal-dialog' });

  // Hero / Flag
  const heroWrapper = el('div', { className: 'modal-header-hero' });
  if (country.flag) {
    const heroImg = el('img', {
      className: 'modal-hero-img',
      src: country.flag,
      alt: country.flagAlt,
    });
    heroWrapper.appendChild(heroImg);
  }

  const closeBtn = el(
    'button',
    {
      type: 'button',
      className: 'modal-close-btn',
      'aria-label': 'Закрыть окно подробностей',
      title: 'Закрыть (Esc)',
    },
    ['✕']
  );
  heroWrapper.appendChild(closeBtn);

  // Body
  const titleGroup = el('div', { className: 'modal-title-group' }, [
    el('h2', { id: 'modal-country-name', className: 'modal-title' }, [
      `${country.flagEmoji} ${country.name}`,
    ]),
    ...(country.nativeName && country.nativeName !== country.name
      ? [el('span', { className: 'modal-native' }, [`Официальное название: ${country.nativeName}`])]
      : []),
  ]);

  const gridDetails = el('div', { className: 'modal-grid-details' }, [
    el('div', { className: 'modal-detail-item' }, [
      el('span', { className: 'modal-detail-label' }, ['Столица']),
      el('span', { className: 'modal-detail-value' }, [country.capital]),
    ]),
    el('div', { className: 'modal-detail-item' }, [
      el('span', { className: 'modal-detail-label' }, ['Регион / Субрегион']),
      el('span', { className: 'modal-detail-value' }, [
        country.subregion ? `${country.region} (${country.subregion})` : country.region,
      ]),
    ]),
    el('div', { className: 'modal-detail-item' }, [
      el('span', { className: 'modal-detail-label' }, ['Население']),
      el('span', { className: 'modal-detail-value' }, [`${country.formattedPopulation} чел.`]),
    ]),
    el('div', { className: 'modal-detail-item' }, [
      el('span', { className: 'modal-detail-label' }, ['Площадь']),
      el('span', { className: 'modal-detail-value' }, [country.formattedArea]),
    ]),
  ]);

  // Languages section
  const languagesList = el('div', { className: 'tag-list' });
  if (country.languages.length > 0) {
    for (const lang of country.languages) {
      languagesList.appendChild(el('span', { className: 'detail-tag' }, [lang]));
    }
  } else {
    languagesList.appendChild(el('span', { className: 'modal-detail-value' }, ['Нет данных']));
  }
  const languagesSection = el('div', { className: 'modal-detail-item' }, [
    el('span', { className: 'modal-detail-label' }, ['Официальные языки']),
    languagesList,
  ]);

  // Currencies section
  const currenciesList = el('div', { className: 'tag-list' });
  if (country.currencies.length > 0) {
    for (const curr of country.currencies) {
      currenciesList.appendChild(el('span', { className: 'detail-tag' }, [curr]));
    }
  } else {
    currenciesList.appendChild(el('span', { className: 'modal-detail-value' }, ['Нет данных']));
  }
  const currenciesSection = el('div', { className: 'modal-detail-item' }, [
    el('span', { className: 'modal-detail-label' }, ['Валюта']),
    currenciesList,
  ]);

  // Borders section
  const bordersList = el('div', { className: 'tag-list' });
  if (country.borders.length > 0) {
    for (const border of country.borders) {
      const borderTag = el(
        'button',
        {
          type: 'button',
          className: 'detail-tag hint-chip',
          title: `Искать границу ${border}`,
        },
        [border]
      );
      if (onBorderClick) {
        borderTag.addEventListener('click', () => {
          closeModal();
          onBorderClick(border);
        });
      }
      bordersList.appendChild(borderTag);
    }
  } else {
    bordersList.appendChild(
      el('span', { className: 'modal-detail-value' }, ['Остров / нет границ'])
    );
  }
  const bordersSection = el('div', { className: 'modal-detail-item' }, [
    el('span', { className: 'modal-detail-label' }, ['Сухопутные границы (коды)']),
    bordersList,
  ]);

  // Codes section
  const miscGrid = el('div', { className: 'modal-grid-details' }, [
    el('div', { className: 'modal-detail-item' }, [
      el('span', { className: 'modal-detail-label' }, ['Телефонный код']),
      el('span', { className: 'modal-detail-value' }, [
        country.callingCodes.length > 0 ? country.callingCodes.map((c) => `+${c}`).join(', ') : '—',
      ]),
    ]),
    el('div', { className: 'modal-detail-item' }, [
      el('span', { className: 'modal-detail-label' }, ['Интернет-домен']),
      el('span', { className: 'modal-detail-value' }, [
        country.topLevelDomain.length > 0 ? country.topLevelDomain.join(', ') : '—',
      ]),
    ]),
  ]);

  const body = el('div', { className: 'modal-body' }, [
    titleGroup,
    gridDetails,
    languagesSection,
    currenciesSection,
    bordersSection,
    miscGrid,
  ]);

  dialog.appendChild(heroWrapper);
  dialog.appendChild(body);
  overlay.appendChild(dialog);

  const closeModal = (): void => {
    document.removeEventListener('keydown', onKeyDown);
    if (overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
  };

  const onKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      closeModal();
    }
  };

  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeModal();
    }
  });

  document.addEventListener('keydown', onKeyDown);
  document.body.appendChild(overlay);
  closeBtn.focus();
}
