import type { RawCountry, CountryCard } from '../types/country';

const numberFormatter = new Intl.NumberFormat('ru-RU');

/**
 * Pure function transforming a raw country API response into a standardized CountryCard.
 * Handles missing or malformed attributes with sensible defaults.
 */
export function mapCountryResponse(raw: RawCountry): CountryCard {
  const name = raw.name || 'Неизвестно';
  const nativeName = raw.nativeName || raw.name || '';
  const capital = raw.capital || 'Нет данных';
  const region = raw.region || 'Не указан';
  const subregion = raw.subregion || '';

  const population =
    typeof raw.population === 'number' && !Number.isNaN(raw.population) ? raw.population : 0;
  const formattedPopulation = numberFormatter.format(population);

  const area = typeof raw.area === 'number' && !Number.isNaN(raw.area) ? raw.area : 0;
  const formattedArea = area > 0 ? `${numberFormatter.format(area)} кв. км` : 'Нет данных';

  const flag = raw.flags?.svg || raw.flags?.png || '';
  const flagAlt = `Флаг страны ${name}`;
  const flagEmoji = raw.flag || '🏳️';

  const languages: string[] = [];
  if (Array.isArray(raw.languages)) {
    const seen = new Set<string>();
    for (const lang of raw.languages) {
      if (lang && typeof lang.name === 'string' && lang.name.trim()) {
        const trimmed = lang.name.trim();
        if (!seen.has(trimmed)) {
          seen.add(trimmed);
          languages.push(trimmed);
        }
      }
    }
  }

  const currencies: string[] = [];
  if (Array.isArray(raw.currencies)) {
    for (const curr of raw.currencies) {
      if (!curr) continue;
      const cName = curr.name?.trim();
      const symbol = curr.symbol?.trim();
      const code = curr.code?.trim();

      if (cName && symbol) {
        currencies.push(`${cName} (${symbol})`);
      } else if (cName && code) {
        currencies.push(`${cName} (${code})`);
      } else if (cName) {
        currencies.push(cName);
      } else if (code) {
        currencies.push(code);
      }
    }
  }

  const borders = Array.isArray(raw.borders)
    ? raw.borders.filter((b): b is string => typeof b === 'string' && Boolean(b.trim()))
    : [];

  const timezones = Array.isArray(raw.timezones)
    ? raw.timezones.filter((t): t is string => typeof t === 'string' && Boolean(t.trim()))
    : [];

  const topLevelDomain = Array.isArray(raw.topLevelDomain)
    ? raw.topLevelDomain.filter((d): d is string => typeof d === 'string' && Boolean(d.trim()))
    : [];

  const callingCodes = Array.isArray(raw.callingCodes)
    ? raw.callingCodes.filter((c): c is string => typeof c === 'string' && Boolean(c.trim()))
    : [];

  const alpha2Code = raw.alpha2Code || '';
  const alpha3Code = raw.alpha3Code || '';
  const id = raw.alpha3Code || raw.alpha2Code || raw.cioc || name;

  return {
    id,
    name,
    nativeName,
    flag,
    flagAlt,
    flagEmoji,
    capital,
    region,
    subregion,
    population,
    formattedPopulation,
    area,
    formattedArea,
    languages,
    currencies,
    borders,
    timezones,
    topLevelDomain,
    callingCodes,
    alpha2Code,
    alpha3Code,
  };
}
