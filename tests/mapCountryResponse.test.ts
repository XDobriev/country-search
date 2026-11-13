import { describe, it, expect } from 'vitest';
import { mapCountryResponse } from '../src/utils/mapCountryResponse';
import spainFixture from './fixtures/spain.json';
import minimalFixture from './fixtures/minimalCountry.json';
import type { RawCountry } from '../src/types/country';

describe('mapCountryResponse', () => {
  it('correctly maps full country response into standardized CountryCard data', () => {
    const rawSpain = spainFixture[0] as RawCountry;
    const card = mapCountryResponse(rawSpain);

    expect(card.id).toBe('ESP');
    expect(card.name).toBe('Spain');
    expect(card.nativeName).toBe('España');
    expect(card.capital).toBe('Madrid');
    expect(card.region).toBe('Europe');
    expect(card.subregion).toBe('Southern Europe');
    expect(card.population).toBe(47351567);
    expect(card.formattedPopulation).toMatch(/47[\s\u00A0\u202F]351[\s\u00A0\u202F]567/);
    expect(card.flag).toBe('https://flagcdn.com/es.svg');
    expect(card.flagEmoji).toBe('🇪🇸');
    expect(card.languages).toEqual(['Spanish']);
    expect(card.currencies).toEqual(['Euro (€)']);
    expect(card.borders).toEqual(['AND', 'FRA', 'GIB', 'PRT', 'MAR']);
    expect(card.area).toBe(505992);
  });

  it('handles country with minimal data and provides fallback defaults', () => {
    const rawMinimal = minimalFixture as unknown as RawCountry;
    const card = mapCountryResponse(rawMinimal);

    expect(card.name).toBe('Narnia');
    expect(card.capital).toBe('Нет данных');
    expect(card.region).toBe('Не указан');
    expect(card.population).toBe(0);
    expect(card.formattedPopulation).toBe('0');
    expect(card.languages).toEqual([]);
    expect(card.currencies).toEqual([]);
    expect(card.borders).toEqual([]);
    expect(card.flagEmoji).toBe('🏳️');
  });

  it('formats multiple languages and currencies accurately', () => {
    const switzerland: RawCountry = {
      name: 'Switzerland',
      nativeName: 'Schweiz',
      capital: 'Bern',
      region: 'Europe',
      population: 8654622,
      flags: { png: 'https://flagcdn.com/w320/ch.png' },
      languages: [{ name: 'German' }, { name: 'French' }, { name: 'Italian' }, { name: 'Romansh' }],
      currencies: [{ name: 'Swiss Franc', symbol: 'CHF' }],
    };

    const card = mapCountryResponse(switzerland);

    expect(card.languages).toEqual(['German', 'French', 'Italian', 'Romansh']);
    expect(card.currencies).toEqual(['Swiss Franc (CHF)']);
    expect(card.flag).toBe('https://flagcdn.com/w320/ch.png');
  });

  it('removes duplicate languages if any exist in raw response', () => {
    const raw: RawCountry = {
      name: 'Bilingual Land',
      languages: [{ name: 'English' }, { name: 'English' }, { name: 'French' }],
    };

    const card = mapCountryResponse(raw);
    expect(card.languages).toEqual(['English', 'French']);
  });

  it('is a pure function without side effects on input object', () => {
    const input: RawCountry = {
      name: 'Purity Island',
      capital: 'Zen',
      population: 1000,
    };
    const inputCopy = JSON.parse(JSON.stringify(input));

    mapCountryResponse(input);

    expect(input).toEqual(inputCopy);
  });
});
