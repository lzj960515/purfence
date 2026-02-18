import _ from 'lodash';
import _data from './world.json';

export namespace WorldUtil {
  export interface City {
    readonly name: string;
  }

  export interface State {
    readonly name: string;
    readonly iso2: string;
    readonly cities: City[];
  }

  export interface Country {
    readonly name: string;
    readonly iso2: string;
    readonly iso3: string;
    readonly phoneCode: string;
    readonly extraPhoneCodes?: string[];
    readonly states: State[];
  }

  const world: { countries: Country[] } = _data;

  function getCountryByISO2(iso2: string) {
    return _.find(world.countries, (o) => o.iso2 === iso2);
  }

  function getCountryByISO3(iso3: string) {
    return _.find(world.countries, (o) => o.iso3 === iso3);
  }

  export function getAllCountries() {
    return _.map(world.countries, omitStates);
  }

  function omitStates(country: Country) {
    return (country ? _.omit(country, ['states']) : country) as Omit<
      Country,
      'states'
    >;
  }

  function omitCities(state: State) {
    return (state ? _.omit(state, ['cities']) : state) as Omit<State, 'cities'>;
  }

  export function getCountryByCode(code: string, withStates?: true): Country;
  export function getCountryByCode(
    code: string,
    withStates: false,
  ): Omit<Country, 'states'>;
  export function getCountryByCode(code: string, withStates = true) {
    let country: Country = null;
    if (code.length === 3) {
      country = getCountryByISO3(code);
    } else if (code.length === 2) {
      country = getCountryByISO2(code);
    }
    if (withStates) return country;
    return omitStates(country);
  }

  export function getStatesOfCountry(code: string, withCities?: true): State[];
  export function getStatesOfCountry(
    code: string,
    withCities: false,
  ): Omit<State, 'cities'>[];
  export function getStatesOfCountry(code: string, withCities = true) {
    const cities = getCountryByCode(code, true)?.states ?? [];
    if (withCities) return cities;
    return _.map(cities, omitCities);
  }

  export function getCitiesOfState(countryCode: string, stateCode: string) {
    return (
      _.find(getStatesOfCountry(countryCode), (o) => o.iso2 === stateCode)
        ?.cities || []
    );
  }

  export function getStateByCodeAndCountry(
    stateCode: string,
    countryOrCode: string | Country,
  ) {
    if (!stateCode || !countryOrCode) return;
    const country = _.isString(countryOrCode)
      ? getCountryByCode(countryOrCode)
      : countryOrCode;
    return _.find(country?.states, (o) => o.iso2 === stateCode);
  }

  export function convertStateNameToCode(
    stateName: string,
    countryCode: string,
  ) {
    if (!stateName || !countryCode) return;
    return _.find(
      getStatesOfCountry(countryCode),
      (it) => it.name === stateName,
    )?.iso2;
  }

  export function getISO2ByCountryName(name: string) {
    return _.find(
      world.countries,
      (o) => o.name.toLowerCase() === name.toLowerCase(),
    )?.iso2;
  }

  // Business-specific S3/CDN helpers were removed from template.
}
