export interface SearchCountriesOptions {
  timeoutMs?: number;
}

export async function searchCountries(
  _query: string,
  _signal?: AbortSignal,
  _options?: SearchCountriesOptions
): Promise<unknown[]> {
  throw new Error('Not implemented');
}
