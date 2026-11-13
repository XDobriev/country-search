export interface RawLanguage {
  name: string;
  nativeName?: string;
  iso639_1?: string;
  iso639_2?: string;
}

export interface RawCurrency {
  code?: string;
  name?: string;
  symbol?: string;
}

export interface RawCountry {
  name: string;
  nativeName?: string;
  capital?: string;
  region?: string;
  subregion?: string;
  population?: number;
  area?: number;
  flag?: string;
  flags?: {
    png?: string;
    svg?: string;
  };
  borders?: string[];
  languages?: RawLanguage[];
  currencies?: RawCurrency[];
  timezones?: string[];
  topLevelDomain?: string[];
  callingCodes?: string[];
  alpha2Code?: string;
  alpha3Code?: string;
  cioc?: string;
  populationDensity?: number;
}

export interface CountryCard {
  id: string;
  name: string;
  nativeName: string;
  flag: string;
  flagAlt: string;
  flagEmoji: string;
  capital: string;
  region: string;
  subregion: string;
  population: number;
  formattedPopulation: string;
  area: number;
  formattedArea: string;
  languages: string[];
  currencies: string[];
  borders: string[];
  timezones: string[];
  topLevelDomain: string[];
  callingCodes: string[];
  alpha2Code: string;
  alpha3Code: string;
}
